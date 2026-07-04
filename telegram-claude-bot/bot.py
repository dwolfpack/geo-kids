"""Family bot entry point: wires handlers, daily jobs (Asia/Jerusalem), watchdog."""
import logging
import os
from datetime import datetime, time, timedelta
from zoneinfo import ZoneInfo

from dotenv import load_dotenv

load_dotenv()  # must run before services.claude reads env

from telegram.ext import (  # noqa: E402
    ApplicationBuilder, CallbackQueryHandler, CommandHandler, ContextTypes,
    MessageHandler, filters,
)

from handlers import chat, digest, explain, quiz  # noqa: E402
from services.geodata import GeoData  # noqa: E402
from services.store import Store  # noqa: E402

logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s", level=logging.INFO
)
logging.getLogger("httpx").setLevel(logging.WARNING)
logger = logging.getLogger(__name__)

TZ = ZoneInfo("Asia/Jerusalem")
QUIZ_HOUR = int(os.environ.get("QUIZ_HOUR", "16"))
DIGEST_HOUR = int(os.environ.get("DIGEST_HOUR", "7"))


async def watchdog_job(context: ContextTypes.DEFAULT_TYPE) -> None:
    """Dead-man's switch: alert the admin if a daily job hasn't run in >26h."""
    admin = os.environ.get("ADMIN_ID")
    if not admin:
        return
    store = context.bot_data["store"]
    now = datetime.now()
    for key in ("last_quiz_run", "last_digest_run"):
        val = store.get_meta(key)
        if val and datetime.fromisoformat(val) < now - timedelta(hours=26):
            alert_key = f"alerted_{key}"
            if store.get_meta(alert_key) != val:  # one alert per stall
                store.set_meta(alert_key, val)
                await context.bot.send_message(int(admin), f"⚠️ {key} hasn't run since {val}")


def main() -> None:
    token = os.environ["TELEGRAM_BOT_TOKEN"]
    app = ApplicationBuilder().token(token).build()

    store = Store(os.environ.get("BOT_DB", "data/bot.db"))
    # Seed job timestamps on first boot so the watchdog doesn't fire before day one.
    for key in ("last_quiz_run", "last_digest_run"):
        if store.get_meta(key) is None:
            store.set_meta(key, datetime.now().isoformat(timespec="seconds"))
    app.bot_data["store"] = store
    app.bot_data["geo"] = GeoData()

    app.add_handler(CommandHandler("start", chat.cmd_start))
    app.add_handler(CommandHandler("reset", chat.cmd_reset))
    app.add_handler(CommandHandler("join", chat.cmd_join))
    app.add_handler(CommandHandler("status", chat.cmd_status))
    app.add_handler(CommandHandler("quiz", quiz.cmd_quiz))
    app.add_handler(CommandHandler("scores", quiz.cmd_scores))
    app.add_handler(CommandHandler("explain", explain.cmd_explain))
    app.add_handler(CommandHandler("remind", digest.cmd_remind))
    app.add_handler(CommandHandler("reminders", digest.cmd_reminders))
    app.add_handler(CallbackQueryHandler(quiz.on_answer, pattern=r"^quiz:"))
    app.add_handler(CallbackQueryHandler(quiz.on_levelup, pattern=r"^lvl:"))
    app.add_handler(CallbackQueryHandler(digest.on_remind_confirm, pattern=r"^rem:"))
    app.add_handler(CallbackQueryHandler(digest.on_reminder_delete, pattern=r"^remdel:"))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, chat.handle_message))

    app.job_queue.run_daily(quiz.daily_quiz_job, time(QUIZ_HOUR, 0, tzinfo=TZ))
    app.job_queue.run_daily(digest.digest_job, time(DIGEST_HOUR, 0, tzinfo=TZ))
    app.job_queue.run_repeating(watchdog_job, interval=timedelta(hours=1), first=60)

    logger.info("Family bot started (quiz %02d:00, digest %02d:00 %s)", QUIZ_HOUR, DIGEST_HOUR, TZ)
    app.run_polling()


if __name__ == "__main__":
    main()
