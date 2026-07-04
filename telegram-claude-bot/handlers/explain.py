"""/explain — kid-appropriate Hebrew explanations, age-tuned, 10-minute follow-up window."""
import logging
import time

import anthropic
from telegram import Update
from telegram.ext import ContextTypes

from handlers.common import allowed, refuse
from services import claude

logger = logging.getLogger(__name__)

WINDOW_SECONDS = 10 * 60


def _system_prompt(age: int) -> str:
    return (
        f"אתה מסביר לילד/ה בגיל {age} בעברית פשוטה וברורה. "
        "כללים: משפטים קצרים. דימוי אחד מחיי היומיום. בלי מילים לועזיות מסובכות. "
        "בנושאים קשים או מפחידים — עדין ומרגיע, בלי פרטים קשים. "
        "לעולם אל תבקש פרטים אישיים. "
        "סיים תמיד בהזמנה קצרה לשאול עוד שאלה."
    )


def in_explain_mode(context: ContextTypes.DEFAULT_TYPE) -> bool:
    return time.monotonic() < context.user_data.get("explain_until", 0)


async def answer_kid(update: Update, context: ContextTypes.DEFAULT_TYPE, question: str) -> None:
    store = context.bot_data["store"]
    user = store.get_user(update.effective_user.id)
    age = user["age"] if user and user["age"] else 8
    context.user_data["explain_until"] = time.monotonic() + WINDOW_SECONDS
    history = context.user_data.setdefault("explain_history", [])
    history.append({"role": "user", "content": question})
    history[:] = history[-10:]
    await update.effective_chat.send_action("typing")
    try:
        reply = claude.ask(update.effective_user.id, history, _system_prompt(age), max_tokens=600)
    except anthropic.APIError:
        logger.exception("explain call failed")
        return await update.message.reply_text("משהו השתבש, נסו שוב עוד רגע 🙂")
    history.append({"role": "assistant", "content": reply})
    await update.message.reply_text(reply)


async def cmd_explain(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not allowed(update):
        return await refuse(update)
    question = " ".join(context.args) if context.args else ""
    if not question:
        context.user_data["explain_until"] = time.monotonic() + WINDOW_SECONDS
        context.user_data["explain_history"] = []
        return await update.message.reply_text("מצב הסבר לילדים פעיל 🧒 מה השאלה?")
    context.user_data["explain_history"] = []
    await answer_kid(update, context, question)
