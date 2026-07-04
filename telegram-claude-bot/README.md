# Family Claude Bot

Telegram bot for the Wolf family: free chat with Claude, a daily geography quiz
powered by the geo-kids game data, kid-friendly explanations in Hebrew, and a
morning reminders digest.

Design spec: `../docs/superpowers/specs/2026-07-04-telegram-bot-upgrades-design.md`

## Commands

| Command | What it does |
|---|---|
| `/join` | Register (name + age; age sets quiz difficulty) |
| `/quiz` | Geography question now (max 5/day; one is pushed daily at 16:00) |
| `/scores` | Family streak leaderboard |
| `/explain [question]` | Kid-mode: simple Hebrew explanation, age-tuned; follow-ups stay in kid-mode for 10 min |
| `/remind <when> <what>` | Add a reminder (parsed by Claude, confirmed with buttons) |
| `/reminders` | List reminders; tap to delete |
| `/reset` | Clear chat history |
| `/status` | (admin only) job health + user count |

Anything else you type is free chat with Claude.

## Setup

    pip install -r requirements.txt
    cp .env.example .env   # fill in tokens
    python bot.py

`.env` keys: `TELEGRAM_BOT_TOKEN`, `ANTHROPIC_API_KEY`, `FAMILY_IDS`
(comma-separated Telegram user ids — the bot refuses everyone else),
`ADMIN_ID` (gets watchdog alerts + /status), optional `CLAUDE_MODEL`,
`QUIZ_HOUR`, `DIGEST_HOUR`, `DAILY_MESSAGE_BUDGET`, `BOT_DB`.

## Architecture

- `handlers/` — thin Telegram handlers (chat, quiz, explain, digest)
- `services/` — `store.py` (SQLite, WAL, schema_version), `geodata.py`
  (question generation), `claude.py` (single API gateway: budget, retry)
- `data/countries.json` — extracted from `../geo-kids/index.html` by
  `scripts/extract_countries.py`; a pytest fails if it drifts from the game
- Daily jobs run via JobQueue in `Asia/Jerusalem`; a watchdog alerts the
  admin if a daily job stalls >26h

## Tests

    python -m pytest tests/

## Manual test checklist (scheduled jobs)

1. Set `QUIZ_HOUR`/`DIGEST_HOUR` to the next minute's hour locally, or call
   the job functions directly from a REPL.
2. `/join`, then wait for the pushed question; answer via buttons; answer
   again (must say "כבר ענית").
3. `/remind מחר 07:30 בדיקה` → confirm → check digest next morning.
4. Kill and restart the bot between question and answer — the answer must
   still be accepted (questions are persisted).
