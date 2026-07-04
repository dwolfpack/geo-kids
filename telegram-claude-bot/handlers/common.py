"""Shared helpers: family allowlist and registration checks."""
import logging
import os

from telegram import Update

logger = logging.getLogger(__name__)

_family_ids: set[int] | None = None


def family_ids() -> set[int]:
    global _family_ids
    if _family_ids is None:
        raw = os.environ.get("FAMILY_IDS", "").strip()
        _family_ids = {int(x) for x in raw.split(",") if x.strip()}
        if not _family_ids:
            logger.warning("FAMILY_IDS empty — bot is open to anyone who finds it!")
    return _family_ids


def allowed(update: Update) -> bool:
    ids = family_ids()
    if not ids:
        return True
    uid = update.effective_user.id if update.effective_user else None
    if uid in ids:
        return True
    logger.info("refused non-family user %s", uid)
    return False


async def refuse(update: Update) -> None:
    if update.effective_message:
        await update.effective_message.reply_text("סליחה, אני בוט משפחתי פרטי 🙂")
