"""Reminders + morning digest. Reminder parsing is confirm-first: Claude's parse
is shown back with ✔/✘ buttons before anything is stored."""
import json
import logging
import re
from datetime import date, datetime, timedelta

import anthropic
from telegram import InlineKeyboardButton, InlineKeyboardMarkup, Update
from telegram.ext import ContextTypes

from handlers.common import allowed, refuse
from services import claude

logger = logging.getLogger(__name__)

_PARSE_SYSTEM = (
    "You convert a Hebrew (or English) reminder request into JSON. "
    'Reply with ONLY a JSON object: {{"date": "YYYY-MM-DD", "time": "HH:MM", "text": "..."}}. '
    "The text field keeps the reminder content in its original language, without the date/time words. "
    "Today is {today} ({weekday}), timezone Asia/Jerusalem. "
    'If no time given use "07:30". If you cannot determine a date, reply {{"error": "unparseable"}}.'
)
_WEEKDAYS_HE = ["שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת", "ראשון"]


def _weekday_he(d: date) -> str:
    return "יום " + _WEEKDAYS_HE[d.weekday()]


def parse_reminder_reply(raw: str) -> dict | None:
    """Extract and validate the JSON object from Claude's reply."""
    m = re.search(r"\{.*\}", raw, re.S)
    if not m:
        return None
    try:
        data = json.loads(m.group(0))
    except json.JSONDecodeError:
        return None
    if "error" in data:
        return None
    try:
        datetime.strptime(f"{data['date']} {data['time']}", "%Y-%m-%d %H:%M")
    except (KeyError, ValueError):
        return None
    return {"date": data["date"], "time": data["time"], "text": str(data.get("text", "")).strip()}


async def cmd_remind(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not allowed(update):
        return await refuse(update)
    text = " ".join(context.args) if context.args else ""
    if not text:
        return await update.message.reply_text(
            'למשל: /remind מחר 07:30 להביא כובע לטיול'
        )
    today = date.today()
    system = _PARSE_SYSTEM.format(today=today.isoformat(), weekday=_weekday_he(today))
    try:
        raw = claude.ask(update.effective_user.id,
                         [{"role": "user", "content": text}], system, max_tokens=200)
    except anthropic.APIError:
        logger.exception("reminder parse failed")
        return await update.message.reply_text("משהו השתבש. נסו: /remind DD/MM HH:MM טקסט")
    parsed = parse_reminder_reply(raw)
    if parsed is None or not parsed["text"]:
        return await update.message.reply_text(
            "לא הצלחתי להבין מתי 🤔 נסו למשל: /remind 12/07 16:00 יום הולדת לסבתא"
        )
    context.user_data["pending_reminder"] = parsed
    d = date.fromisoformat(parsed["date"])
    kb = InlineKeyboardMarkup([[
        InlineKeyboardButton("✔ נכון", callback_data="rem:yes"),
        InlineKeyboardButton("✘ בטל", callback_data="rem:no"),
    ]])
    await update.message.reply_text(
        f"{_weekday_he(d)} {d.strftime('%d/%m')} בשעה {parsed['time']} — {parsed['text']}\nנכון?",
        reply_markup=kb,
    )


async def on_remind_confirm(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    query = update.callback_query
    await query.answer()
    pending = context.user_data.pop("pending_reminder", None)
    if query.data == "rem:no" or pending is None:
        return await query.edit_message_text("בוטל 🙂")
    store = context.bot_data["store"]
    store.add_reminder(query.from_user.id, f"{pending['date']} {pending['time']}", pending["text"])
    await query.edit_message_text(f"נשמר ✔ אזכיר בדייג'סט של הבוקר: {pending['text']}")


async def cmd_reminders(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not allowed(update):
        return await refuse(update)
    rows = context.bot_data["store"].reminders_for(update.effective_user.id)
    if not rows:
        return await update.message.reply_text("אין תזכורות פתוחות 🙂")
    kb = [[InlineKeyboardButton(f"🗑 {r['due_at'][5:16]} — {r['text'][:30]}",
                                callback_data=f"remdel:{r['id']}")] for r in rows]
    await update.message.reply_text(
        "התזכורות שלך (לחיצה מוחקת):", reply_markup=InlineKeyboardMarkup(kb)
    )


async def on_reminder_delete(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    query = update.callback_query
    rid = int(query.data.split(":")[1])
    ok = context.bot_data["store"].delete_reminder(rid, query.from_user.id)
    await query.answer("נמחק" if ok else "כבר נמחק")
    await query.edit_message_text("התזכורת נמחקה 🗑" if ok else "התזכורת כבר לא קיימת")


async def digest_job(context: ContextTypes.DEFAULT_TYPE) -> None:
    store = context.bot_data["store"]
    today = date.today()
    start = f"{today.isoformat()} 00:00"
    end_today = f"{(today + timedelta(days=1)).isoformat()} 00:00"
    end_week = f"{(today + timedelta(days=7)).isoformat()} 00:00"
    for user in store.users_subscribed("subscribed_digest"):
        uid = user["user_id"]
        todays = store.reminders_due(uid, start, end_today)
        upcoming = store.reminders_due(uid, end_today, end_week)
        if not todays and not upcoming:
            continue  # silence over noise
        lines = [f"בוקר טוב {user['name']}! ☀️ {_weekday_he(today)} {today.strftime('%d/%m')}"]
        if todays:
            lines.append("\n📌 היום:")
            lines += [f"• {r['due_at'][11:16]} — {r['text']}" for r in todays]
        if upcoming:
            lines.append("\n📅 בהמשך השבוע:")
            lines += [f"• {r['due_at'][5:16]} — {r['text']}" for r in upcoming]
        if user["subscribed_quiz"]:
            lines.append("\n🌍 שאלת הגיאוגרפיה מגיעה אחר הצהריים!")
        try:
            await context.bot.send_message(uid, "\n".join(lines))
        except Exception:
            logger.exception("digest failed for %s", uid)
    store.set_meta("last_digest_run", datetime.now().isoformat(timespec="seconds"))
