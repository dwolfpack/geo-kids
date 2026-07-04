# Overnight Session Progress — 2026-07-04

Dror asked for 4 tasks, executed autonomously while he sleeps. This log is updated after each step so nothing is lost if context runs out.

## Tasks

1. **AI curriculum — build the next module** (Module 1: First Conversations, EN+HE, per docs/superpowers/specs/2026-04-21-ai-intro-curriculum-design.md and docs/content-schema.md)
2. **New project: "QA for AI"** — design doc for Dror's next career chapter as QA Manager in the AI world (helping companies expedite higher-quality AI-SDLC). Deliverable: design/spec doc via superpowers brainstorming (user approval deferred — Dror asleep; doc marked DRAFT FOR REVIEW).
3. **Telegram bot upgrades — design doc** for telegram-claude-bot (current: simple echo-Claude bot, bot.py). Ideas approved by Dror: family schedule digest, "explain to my kid in Hebrew", daily geography quiz tied to geo-kids.
4. **LinkedIn post series** — suggest a series of posts about what Dror + Claude are building together.

## Status

- [x] Task 1: Module 1 content — DONE. EN+HE glossaries, module.md + 5 sessions per language (12 content files). Validator passes ("✓ All content valid (14 files checked)"). Test stub removed. Committed.
- [x] Task 2: QA-for-AI career design — DONE. `docs/superpowers/specs/2026-07-04-qa-for-ai-career-design.md`. Recommends fractional "Head of AI Quality" (Option 1) with an AI-SDLC audit as door-opener; framework "Confidence at AI Speed" (3 pillars: QA of AI-generated code / QA of AI features / organizational layer); 90-day roadmap. **6 open questions in §7 need Dror's answers.**
- [x] Task 3: Telegram bot upgrades design — DONE. `docs/superpowers/specs/2026-07-04-telegram-bot-upgrades-design.md`. Package refactor + SQLite + JobQueue; daily geo quiz (reuses geo-kids data, streaks, inline buttons), /explain kid-mode in Hebrew, morning digest v1 (manual reminders). **6 open questions in §10 (hosting is the big one). No code written — awaiting approval per brainstorming gate.**
- [x] Task 4: LinkedIn series — DONE. `docs/linkedin-series.md`. 10-post arc "Building With AI, Out Loud": build-credibility (1–4) → pivot to quality (5–8) → new-chapter announcement (9–10). Post 1 fully drafted. Language (EN vs HE) is Dror's call.

## Review pass (engineer + QA-manager hats, same night)

Dror asked to "go over ideas and make them better." Findings and fixes:

1. **SECURITY: `telegram-claude-bot/.env` (live API keys) was not gitignored** — one `git add` from leaking. Fixed: root `.gitignore` now covers `.env`, `.env.local`, `*.db`.
2. **Bot design — deleted an unnecessary AI integration:** geo-kids data (verified: `COUNTRIES` array in index.html, 108 entries) already has curated `fact` per country; the "Claude generates fun facts" feature was removed. Added §7a Engineering Hardening: Asia/Jerusalem tz for jobs, SQLite WAL + schema_version, persisted quiz questions with idempotent callbacks, confirm-first reminder parsing, dead-man's-switch for daily jobs, data drift test, /explain eval suite.
3. **Career design — made the offer sellable:** added §3.1 maturity model (3 pillars × 5 levels — makes the audit scoreable), §3.2 engagement anatomy, §6a pricing hypotheses (₪), §6b risk register.
4. **LinkedIn — added per-post Definition of Done + fresh story bank** (the .env catch and the deleted-AI-feature story are both post material).
5. **Validator hardened + real bug fixed:** new checks (filename↔frontmatter session/slug/module consistency, duplicate session numbers), verified via seeded mutation; that test exposed a real bug — validator broke on CRLF line endings (any Windows checkout). Fixed; all content re-validates ✓.

## Morning checklist for Dror

1. Review + answer open questions in the QA-for-AI design (§7) — biggest decisions: consulting vs full-time, Israel vs global.
2. Review telegram bot design (§10) — say "go" and implementation starts (step 1: refactor + /join + SQLite).
3. Read Post 1 draft in linkedin-series.md — edit to your voice, publish when ready.
4. Module 1 is live in content/ and validated — read one EN + one HE session to approve tone before we build Module 2 or the website.

## Notes / decisions made autonomously

- Working on branch `geo-kids` (recent history shows mixed-project commits on this branch; not disrupting).
- Deleting `content/modules/01-first-conversations/en/00-test-stub.md` — it is a deliberately broken validator-test stub and fails validation + EN/HE parity.
- Glossary terms chosen for M1: EN — AI, Prompt, Chatbot, Hallucination, Model; HE equivalents.
- Task 2 & 3 outputs go to `docs/superpowers/specs/2026-07-04-*.md`; Task 4 to `docs/linkedin-series.md`.
