# Personal Income Booster Implementation Plan

> **For agentic workers:** implement task-by-task, in order. Steps use checkbox
> (`- [ ]`) syntax for tracking. If `superpowers` is installed, use
> `superpowers:subagent-driven-development`; otherwise work the tasks directly.
> Design doc: `docs/superpowers/specs/2026-09-19-personal-income-booster-design.md`

**Goal:** A standing system that scans for AI-income opportunities weekly,
filters slop, scores survivors against the operator profile, designs a proposal
for anything that clears the bar, asks by email, and hands approvals to an
executor agent.

**Architecture:** Node 22, zero runtime dependencies (fresh containers have no
install step). State is JSONL committed to git, because scan containers are
ephemeral. Ranking lives in code (`lib/score.mjs`), not in prompts, so it is
reproducible.

**Tech stack:** Node 22 (present), Claude Code skills + one subagent, Routines
for scheduling, Gmail for the approval gate.

## Global constraints

- No runtime npm dependencies. Ever. A scan must work in a cold container.
- The ledger is append-only. Rejections are data, not garbage.
- The executor agent never spends money, never contacts a person, never
  publishes under the operator's name.
- `profile.yaml` is the only place operator facts live. No duplication into
  prompts.
- Run tests with `node --test "income-booster/test/*.test.mjs"` (the glob form —
  bare directory discovery fails in this environment).

---

## Task 1: Core library and config — ✅ DONE

- [x] `config/profile.yaml`, `config/rubric.yaml`, `config/sources.yaml`
- [x] `lib/yaml.mjs` — dependency-free YAML subset parser, 7 tests
- [x] `lib/score.mjs` — gates + weighted scoring, normalized 0-100
- [x] `lib/ledger.mjs` — append-only JSONL, URL + fuzzy-title dedupe
- [x] `bin/ib.mjs` — `eval` / `list` / `set-state` / `digest` / `stats`
- [x] `test/` — 21 tests passing, including the velocity-trap regression case

## Task 2: Skills and executor agent — ✅ DONE

- [x] `.claude/skills/income-scan/SKILL.md`
- [x] `.claude/skills/income-propose/SKILL.md`
- [x] `.claude/skills/income-inbox-sweep/SKILL.md`
- [x] `.claude/agents/income-executor.md`

## Task 3: Fill in the operator domains — ⚠️ BLOCKED ON OPERATOR

**This is the highest-leverage remaining task and only the operator can do it.**

`profile.operator.domains` is empty. Every `operator_fit` score is a guess until
it is filled, and `operator_fit` carries weight 2.5 — joint-highest in the
rubric. The scan runs without it but produces generic results, which is exactly
the failure mode the system exists to avoid.

- [ ] **Step 1:** Operator names 1-3 specific domains in `config/profile.yaml`.
      Specific means "K-12 geography education and Israeli school procurement",
      not "education". The test: could someone outside that domain write the same
      sentence? If yes, it is too broad to be an advantage.
- [ ] **Step 2:** Re-run `node income-booster/bin/ib.mjs eval` on the seeded
      candidates and compare scores. Expect meaningful movement in
      `operator_fit`; if nothing moves, the domains are still too generic.

## Task 4: Wire the weekly Routine — needs operator approval to create

Two Routines, both firing fresh sessions in this environment:

- [ ] **Step 1:** Scan Routine. Cron `0 5 * * 1` (Mondays 08:00 Asia/Jerusalem).
      Prompt: standalone, since a fresh session starts with no context —
      "Run the income-scan skill for the geo-kids repo on branch
      `claude/intelligent-ptolemy-an3x09`. Read income-booster/config/profile.yaml
      first. Commit the ledger. Email the digest to the address in
      profile.notifications.email. Send nothing if no candidate clears threshold."
- [ ] **Step 2:** Sweep Routine. Cron `0 5 * * 3` (Wednesdays), running
      `income-inbox-sweep` to catch replies and launch approved work.
- [ ] **Step 3:** Confirm the first firing produced a ledger commit. A Routine
      that silently no-ops is worse than none, because it manufactures
      confidence.

## Task 5: Enable Tavily — optional, recommended

- [ ] **Step 1:** Enable the `tavily` plugin; add `TAVILY_API_KEY` to `.env`.
- [ ] **Step 2:** Add a `fetch_full_text: true` note to `sources.yaml` tiers so
      the scanner reads page bodies rather than search snippets. The
      sustained-vs-spike judgement is usually only visible in the body.

## Task 6: Close the feedback loop — after the first executed play

Without this the system is an idea generator that never learns.

- [ ] **Step 1:** On any opportunity reaching `measured`, record actual hours and
      actual dollars against the proposal's estimates in the ledger entry.
- [ ] **Step 2:** Monthly, compare predicted vs actual per dimension. The usual
      finding is systematic optimism on `days_to_first_dollar`.
- [ ] **Step 3:** Adjust `rubric.yaml` weights or anchors, and record the change
      with its reason. Never adjust weights to justify a decision already made.
