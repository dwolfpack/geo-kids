"""Free chat with Claude, /join registration flow, /start, /reset, /status.

handle_message routes: join flow -> explain-mode follow-ups -> free chat.
"""
import logging
import os
from datetime import datetime, timedelta

import anthropic
from telegram import Update
from telegram.ext import ContextTypes

from handlers import explain
from handlers.common import allowed, refuse
from services import claude

logger = logging.getLogger(__name__)

MAX_HISTORY = 40
CHAT_SYSTEM = "You are a friendly family assistant. Reply in the language the user writes in. Be concise."


async def cmd_start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not allowed(update):
        return await refuse(update)
    await update.message.reply_text(
        "היי! אני הבוט המשפחתי 🤖\n"
        "/join — הרשמה (שם וגיל)\n"
        "/quiz — שאלת גיאוגרפיה 🌍\n"
        "/explain — הסבר לילדים 🧒\n"
        "/remind — תזכורת לדייג'סט של הבוקר ⏰\n"
        "/reminders — התזכורות שלי\n"
        "/scores — לוח המשפחה 🏆\n"
        "/reset — ניקוי שיחה\n"
        "או פשוט לכתוב לי כל דבר 🙂"
    )


async def cmd_reset(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not allowed(update):
        return await refuse(update)
    context.user_data.pop("history", None)
    context.user_data.pop("explain_history", None)
    await update.message.reply_text("השיחה נוקתה, מתחילים מחדש!")


async def cmd_join(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not allowed(update):
        return await refuse(update)
    context.user_data["join_state"] = "name"
    await update.message.reply_text("איזה כיף! איך קוראים לך?")


async def _join_flow(update: Update, context: ContextTypes.DEFAULT_TYPE, text: str) -> None:
    state = context.user_data["join_state"]
    store = context.bot_data["store"]
    if state == "name":
        name = text.strip()[:40]
        if not name:
            return await update.message.reply_text("לא הבנתי 🙂 איך קוראים לך?")
        context.user_data["join_name"] = name
        context.user_data["join_state"] = "age"
        return await update.message.reply_text(f"נעים מאוד {name}! בת/בן כמה את/ה?")
    # state == "age"
    try:
        age = int(text.strip())
        if not 3 <= age <= 120:
            raise ValueError
    except ValueError:
        return await update.message.reply_text("רק מספר 🙂 בת/בן כמה?")
    name = context.user_data.pop("join_name")
    context.user_data.pop("join_state")
    store.upsert_user(update.effective_user.id, name, age)
    await update.message.reply_text(
        f"מעולה {name}! נרשמת 🎉\n"
        "כל יום אחר הצהריים תגיע שאלת גיאוגרפיה 🌍 (אפשר גם /quiz עכשיו).\n"
        "בבקרים עם תזכורות — דייג'סט ☀️"
    )


async def cmd_status(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Admin: job health (dead-man's switch view) + user count."""
    admin = os.environ.get("ADMIN_ID", "")
    if not admin or str(update.effective_user.id) != admin:
        return
    store = context.bot_data["store"]
    lines = ["📊 Status:"]
    now = datetime.now()
    for key in ("last_quiz_run", "last_digest_run"):
        val = store.get_meta(key)
        stale = val is None or datetime.fromisoformat(val) < now - timedelta(hours=26)
        lines.append(f"{'⚠️' if stale else '✅'} {key}: {val or 'never'}")
    lines.append(f"👥 users: {len(store.users_subscribed('subscribed_quiz'))} quiz subs")
    await update.message.reply_text("\n".join(lines))


async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not allowed(update):
        return await refuse(update)
    text = update.message.text

    if context.user_data.get("join_state"):
        return await _join_flow(update, context, text)

    if explain.in_explain_mode(context):
        return await explain.answer_kid(update, context, text)

    history = context.user_data.setdefault("history", [])
    history.append({"role": "user", "content": text})
    history[:] = history[-MAX_HISTORY:]
    await update.effective_chat.send_action("typing")
    try:
        reply = claude.ask(update.effective_user.id, history, CHAT_SYSTEM)
    except anthropic.APIError:
        logger.exception("chat call failed")
        return await update.message.reply_text("משהו השתבש, נסו שוב עוד רגע 🙂")
    history.append({"role": "assistant", "content": reply})
    await update.message.reply_text(reply)
