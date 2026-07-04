"""Geography quiz: /quiz on demand, daily push, streaks, level-up suggestions."""
import html
import json
import logging
from datetime import datetime

from telegram import InlineKeyboardButton, InlineKeyboardMarkup, Update
from telegram.ext import ContextTypes

from handlers.common import allowed, refuse

logger = logging.getLogger(__name__)

DAILY_CAP = 5
LEVEL_NAMES = {1: "קל מאוד 🟢", 2: "קל 🟡", 3: "בינוני 🟠", 4: "קשה 🔴", 5: "מומחה 🟣"}


def _keyboard(qid: int, options: list[str]) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        [[InlineKeyboardButton(opt, callback_data=f"quiz:{qid}:{i}")]
         for i, opt in enumerate(options)]
    )


async def send_question(context: ContextTypes.DEFAULT_TYPE, user_id: int, header: str = "") -> None:
    store, geo = context.bot_data["store"], context.bot_data["geo"]
    user = store.get_user(user_id)
    if user is None:
        return
    q = geo.make_question(user["quiz_level"])
    qid = store.create_question(user_id, q)
    text = (header + "\n" if header else "") + f"🌍 {q['prompt']}"
    await context.bot.send_message(user_id, text, reply_markup=_keyboard(qid, q["options"]))


async def cmd_quiz(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not allowed(update):
        return await refuse(update)
    store = context.bot_data["store"]
    uid = update.effective_user.id
    if store.get_user(uid) is None:
        return await update.message.reply_text("קודם צריך להירשם — שלחו /join 🙂")
    if store.questions_today(uid) >= DAILY_CAP:
        return await update.message.reply_text("מספיק להיום 🙂 שאלה חדשה מחכה מחר!")
    await send_question(context, uid)


async def on_answer(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    query = update.callback_query
    store = context.bot_data["store"]
    _, qid_s, idx_s = query.data.split(":")
    qid, idx = int(qid_s), int(idx_s)

    q = store.get_question(qid)
    if q is None:
        return await query.answer("השאלה הזאת כבר לא קיימת 🤔")
    if query.from_user.id != q["user_id"]:
        return await query.answer("זו שאלה של מישהו אחר 🙂")
    if not store.answer_question(qid, idx):
        return await query.answer("כבר ענית על זו 🙂")

    await query.answer()
    options = json.loads(q["options"])
    correct = idx == q["correct_index"]
    result = store.record_result(q["user_id"], correct)
    geo = context.bot_data["geo"]
    fact = geo.countries[q["country_code"]]["fact"]

    lines = [f"🌍 {q['prompt']}"]
    if correct:
        lines.append(f"✅ נכון! {options[q['correct_index']]}")
        lines.append(f"💡 {fact}")
        lines.append(f"🔥 רצף: {result['current']} ימים (שיא: {result['best']})")
        if result["milestone"]:
            lines.append(f"🎉 וואו — {result['milestone']} ימים ברצף! כל הכבוד!")
    else:
        lines.append(f"❌ לא בדיוק. התשובה: {options[q['correct_index']]}")
        lines.append(f"💡 {fact}")
        lines.append("מחר יש הזדמנות חדשה 🙂")
    await query.edit_message_text("\n".join(lines))

    # level-up suggestion: 5 correct in a row at current level
    user = store.get_user(q["user_id"])
    if correct and user["quiz_level"] < 5 and store.correct_in_a_row_at_level(q["user_id"], 5):
        nxt = user["quiz_level"] + 1
        kb = InlineKeyboardMarkup([[
            InlineKeyboardButton("כן, קדימה! 💪", callback_data=f"lvl:{nxt}"),
            InlineKeyboardButton("עוד לא", callback_data="lvl:stay"),
        ]])
        await context.bot.send_message(
            q["user_id"],
            f"5 תשובות נכונות ברצף! 🌟 לעבור לרמה {LEVEL_NAMES[nxt]}?",
            reply_markup=kb,
        )


async def on_levelup(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    query = update.callback_query
    store = context.bot_data["store"]
    await query.answer()
    choice = query.data.split(":")[1]
    if choice == "stay":
        return await query.edit_message_text("סבבה, נשארים 🙂")
    store.set_user_field(query.from_user.id, "quiz_level", int(choice))
    await query.edit_message_text(f"עלינו רמה! עכשיו: {LEVEL_NAMES[int(choice)]} 🚀")


async def daily_quiz_job(context: ContextTypes.DEFAULT_TYPE) -> None:
    store = context.bot_data["store"]
    for user in store.users_subscribed("subscribed_quiz"):
        try:
            await send_question(context, user["user_id"], header="שאלת היום! 🌍")
        except Exception:
            logger.exception("daily quiz failed for %s", user["user_id"])
    store.set_meta("last_quiz_run", datetime.now().isoformat(timespec="seconds"))


async def cmd_scores(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not allowed(update):
        return await refuse(update)
    rows = context.bot_data["store"].scores()
    if not rows:
        return await update.message.reply_text("עוד אין תוצאות — שלחו /quiz להתחיל!")
    lines = ["🏆 לוח המשפחה:"]
    for r in rows:
        lines.append(
            f"{html.escape(r['name'])} — רצף {r['current']} (שיא {r['best']}), "
            f"{r['total_correct']}/{r['total_answered']} נכונות"
        )
    await update.message.reply_text("\n".join(lines))
