# Telegram Family Bot — Upgrades Design

**Date:** 2026-07-04
**Author:** Claude (drafted overnight for Dror Wolf)
**Status:** ⚠️ DRAFT FOR REVIEW — designed autonomously while Dror slept. No code written yet; implementation starts only after Dror approves.

---

## 1. Purpose

Evolve `telegram-claude-bot` from a demo ("Claude echoes in Telegram") into a **family bot the household actually uses daily**. Three jobs, picked by Dror from the brainstorm:

1. **Daily geography quiz** — one question a day per player, drawing on the geo-kids country data; keeps the kids' geography learning alive between game sessions.
2. **"Explain to my kid" mode** — anyone forwards/types a question or concept; the bot answers in kid-appropriate Hebrew (age-tunable).
3. **Daily family digest** — a scheduled morning message with schedule/reminders. (Scoped as *manual-input reminders* for v1 — see §6; calendar integration is a v2 open question.)

## 2. Current State

`telegram-claude-bot/bot.py` — single file, ~85 lines: python-telegram-bot polling, per-chat in-memory history (lost on restart), one Claude call per message, model `claude-opus-4-6`, no persistence, no scheduling, no per-user identity.

Good bones: async handlers, history trimming, error handling around the API call. Everything below builds on it rather than rewriting.

## 3. Architecture

Keep it a small, single-process Python app — no framework, no database server. Restructure into a package:

```
telegram-claude-bot/
  bot.py            # entry point: builds app, registers handlers + jobs
  handlers/
    chat.py         # existing free-chat with Claude (refactored, unchanged behavior)
    quiz.py         # /quiz + answer flow + daily push
    explain.py      # /explain mode
    digest.py       # /remind, /reminders + morning digest job
  services/
    claude.py       # single Claude client wrapper (model, retries, token caps)
    store.py        # persistence (SQLite via stdlib sqlite3)
    geodata.py      # loads countries from ../geo-kids data file
  data/
    bot.db          # SQLite: users, quiz history, streaks, reminders
  tests/
```

**Key decisions:**

- **Persistence: SQLite (stdlib).** In-memory state loses streaks and reminders on every restart, which kills the daily-habit features. SQLite needs no server, one file, trivially backed up. Chat history for free-chat can *stay* in memory (losing it is harmless).
- **Scheduling: python-telegram-bot's built-in `JobQueue`** (`pip install "python-telegram-bot[job-queue]"`). No cron, no extra process; daily jobs registered at startup.
- **Family identity:** a `users` table keyed by Telegram user id, with `name`, `role` (adult/kid), `age`, `quiz_level` (1–5, matching geo-kids difficulty levels), `subscribed_quiz`, `subscribed_digest`. Registered via `/join` (one-time, asks 2 questions). An allowlist of family Telegram ids in `.env` keeps strangers out — **the bot must refuse non-family users** (it holds an Anthropic API key).
- **Model:** switch free-chat and explain to a cheaper default (Haiku-class) and reserve the big model for nothing yet — a family bot's traffic doesn't need Opus. Configurable via `.env`.

## 4. Feature: Daily Geography Quiz

**Data source:** geo-kids already ships ~100 countries with 5 difficulty levels (Hebrew names, capitals, flags/emoji, continent). `geodata.py` reads the same JSON the game uses — one source of truth; new countries added to the game appear in the quiz automatically. (Implementation note: verify the exact file path/shape in `geo-kids/` before coding; if the data is embedded in JS, extract to JSON shared by both.)

**Flow:**
- Each subscribed kid gets one question at a configured hour (default 16:00, post-school): e.g. "מה בירת יפן?" with 4 inline-keyboard answer buttons (Telegram `InlineKeyboardMarkup` — tap to answer, no typing).
- Question type rotates: capital → flag-emoji → continent → "which is bigger" style. Difficulty follows the kid's `quiz_level`; 5 correct in a row at a level suggests moving up (asks the kid, doesn't force).
- Immediate feedback with one fun fact (generated once by Claude and **cached in SQLite** so repeat questions cost nothing).
- **Streaks:** consecutive-day counter with milestone celebrations (3, 7, 14, 30). Parents can query `/scores` for a family leaderboard.
- `/quiz` also works on demand for extra questions (capped at 5/day so it stays a treat).

**Anti-goals:** no pressure mechanics — a missed day sends nothing guilt-inducing; streak simply resets with "התחלנו רצף חדש!".

## 5. Feature: "Explain to My Kid" (/explain)

**Flow:** `/explain` puts the chat in explain-mode for one question (or `/explain למה השמיים כחולים`). The bot answers in Hebrew, pitched to the asking user's registered age (or `/explain8 ...` to force a level). Follow-ups within 10 minutes stay in kid-mode; then reverts to normal chat.

**System prompt sketch:** Hebrew-first, short sentences, one concrete everyday analogy, no scary detail on hard topics, ends with an invitation to ask more. For kids' own accounts, the safety framing from the family curriculum applies (never asks for personal info).

**Why a mode and not just "ask Claude":** consistent quality (tuned system prompt beats ad-hoc), works for *parents* forwarding kid questions, and models good AI use for the family — same philosophy as the curriculum project.

## 6. Feature: Morning Digest

**v1 scope (deliberately small):** manual reminders only.
- `/remind מחר 07:30 להביא כובע לטיול` — natural-language-ish parsing by Claude into structured `{when, text, who}` (one cheap API call), stored in SQLite.
- `/reminders` lists; tapping one deletes it.
- At 07:00 the bot sends each subscriber (or a family group chat — configurable) a digest: today's reminders + this week's upcoming ones + the day's quiz teaser. No reminders → no message (silence over noise).

**v2 (open question, not designed yet):** Google Calendar read integration. Deferred because OAuth + calendar-sharing decisions need Dror awake.

## 7. Error Handling & Cost Control

- All Claude calls go through `services/claude.py`: 1 retry with backoff, `max_tokens` cap, per-user daily message budget (default 50) with a friendly Hebrew "נגמרו ההודעות להיום" message.
- Job failures (quiz/digest) log and skip — never crash the process; polling restarts cleanly because state is in SQLite.
- Bot answers only allowlisted user ids; others get a polite refusal, logged.

## 8. Testing

- `services/` (store, geodata, quiz-question generation, reminder parsing fallback) covered by plain pytest — no Telegram mocking needed since handlers stay thin.
- Handler logic tested with python-telegram-bot's test utilities for the two stateful flows (quiz answer, explain-mode timeout).
- Manual test checklist in README for the scheduled jobs (run with a 1-minute schedule locally).

## 9. Build Order (each step ships something usable)

1. Refactor to package + SQLite + `/join` + allowlist (no behavior change).
2. Quiz: on-demand `/quiz` first, then the daily push + streaks.
3. `/explain`.
4. Digest v1.

Estimated: each step is an evening-sized session with Claude.

## 10. Open Questions for Dror

1. Where does the bot run 24/7? (Currently: your PC. Daily pushes need an always-on host — a ~$4/mo VPS, a Raspberry Pi, or fine to accept "only when PC is on" for now?)
2. Quiz push time — 16:00 OK? Per-kid times?
3. Digest to individuals or one family group chat?
4. Kids' ages/levels for seeding `users` (or let `/join` collect it).
5. Green-light Google Calendar for digest v2?
6. OK to downgrade default model to Haiku-class for cost?
