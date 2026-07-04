# AI-SDLC Quality Assessment

**Instrument v0.1 — Dror Wolf · "Confidence at AI Speed" framework**
Companion to the maturity model in `docs/superpowers/specs/2026-07-04-qa-for-ai-career-design.md` (§3.1).

A 2-week diagnostic that scores an engineering organization on three pillars,
five maturity levels each, and produces a heat-map + top-3 gaps + 90-day plan.

---

## How to run it

1. **Interviews (5 × 45 min):** engineering lead, QA lead/engineer, two developers who use AI tools daily, product manager.
2. **Artifact review:** the 10 most recent AI-heavy PRs; test suite structure; any eval/golden datasets; last 5 production incidents; CI pipeline config; Definition of Done.
3. **Scoring:** each question below is scored 1–5 against the level anchors. Pillar score = median of its questions (median resists one shiny exception). Evidence beats claims: a "we do X" answer without an artifact scores at most 2 on that question.
4. **Output:** heat-map (3 pillars × score), top-3 gaps ranked by risk × effort, and a 90-day remediation plan.

**Scoring discipline:** for every answer, ask "show me." The gap between the claimed score and the evidenced score is itself a finding — it measures how well leadership's picture matches reality.

---

## Pillar A — Quality of AI-generated code

**A1. Policy.** Is there any explicit policy for AI-generated code?
1 = none, merged like any code · 3 = written risk-based review policy (deeper review for auth/payments/data paths) · 5 = policy enforced by tooling, review depth auto-tuned by risk signals

**A2. Review reality.** In the 10 sampled PRs, does review depth match change risk?
1 = large AI diffs rubber-stamped · 3 = risky files visibly get substantive comments · 5 = review-depth metrics tracked and periodically audited

**A3. Test integrity.** Who guards the tests when AI writes them?
1 = AI-written tests merged unread · 3 = humans own test *intent* (edge cases, contracts), AI fills volume · 5 = mutation testing / property-based testing verifies the test suite actually catches faults

**A4. Provenance.** Can you tell which code was AI-generated?
1 = no idea · 3 = informal conventions (PR labels) · 5 = tracked and correlated with defect data to tune the process

**A5. Comprehension debt.** "Who understands this module?" for recent AI-built code:
1 = nobody; the prompt author left it to the machine · 3 = every merge has a named human who can explain it · 5 = comprehension checks are part of DoD and sampled in retros

## Pillar B — Quality of AI features (the non-deterministic product)

**B1. Evals.** How are LLM-feature changes verified?
1 = "we tried it, looked fine" · 3 = golden dataset run before releases · 5 = evals in CI, gating merges like unit tests

**B2. Model-change safety.** What happens when the provider upgrades/deprecates a model?
1 = find out from users · 3 = manual regression pass on a checklist · 5 = automated eval diff + staged rollout

**B3. Judgment quality.** If you use LLM-as-judge or human review of outputs, is the judge itself validated?
1 = no judge at all · 3 = rubric exists, spot-checked against human ratings · 5 = judge calibration measured and drift-monitored

**B4. Adversarial robustness.** Prompt injection, jailbreaks, PII leakage:
1 = never considered · 3 = one-time red-team exercise with fixes · 5 = continuous adversarial suite + incident playbook

**B5. Production feedback.** How do you learn what the model does to real users?
1 = no output monitoring · 3 = user feedback channel reviewed weekly · 5 = production samples feed eval-set growth on a defined cadence

## Pillar C — The organization

**C1. Ownership.** Who owns AI quality?
1 = nobody / everybody · 3 = named owner with mandate · 5 = owner has budget, metrics, and a seat in release decisions

**C2. Role clarity.** Do QA people know what their job is becoming?
1 = anxiety and avoidance · 3 = new roles defined (eval engineer, quality coach), transition started · 5 = team visibly operating in new roles, hiring profile updated

**C3. Metrics.** What does leadership see?
1 = velocity only · 3 = quality metrics reviewed alongside velocity (escaped defects vs. AI adoption, eval coverage) · 5 = leaders steer by them; metrics don't punish honesty (near-miss reporting is rewarded)

**C4. Definition of Done.** Has DoD changed since AI tools arrived?
1 = unchanged since pre-AI · 3 = updated for AI-assisted work (named comprehension owner, eval requirement) · 5 = DoD compliance sampled and enforced, exceptions tracked

**C5. Learning loop.** When AI-related quality incidents happen:
1 = blame the tool or the person, move on · 3 = blameless postmortems that reach process changes · 5 = incident learnings feed policy, evals, and training on a cadence

---

## Report skeleton

1. **Executive summary** — one page: heat-map, the single sentence per pillar, the claimed-vs-evidenced gap.
2. **Findings per pillar** — score, evidence quotes/artifacts, what Level N+1 looks like for *this* team.
3. **Top-3 gaps** — ranked by (production risk × ease of fix). Each with a concrete first step that shows value in <2 weeks.
4. **90-day plan** — sequenced, with owners; deliberately small (three workstreams max — transformation dies of scope).
5. **Appendix** — full scoring table, interview method, anonymized quotes.

---

## v0.1 limitations (be honest in the room)

- Anchors are calibrated from public practice + first-principles, not yet from a benchmark base of scored companies. Every audit run recalibrates them — early clients are told this and priced accordingly.
- Pillar B assumes an LLM feature exists; for teams only *building with* AI (no AI in product), weight A and C and say so in the report.
