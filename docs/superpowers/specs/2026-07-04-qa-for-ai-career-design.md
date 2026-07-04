# QA for AI — Next Chapter Design

**Date:** 2026-07-04
**Author:** Claude (drafted overnight for Dror Wolf)
**Status:** ⚠️ DRAFT FOR REVIEW — brainstormed autonomously while Dror slept. Assumptions and open questions are flagged throughout; nothing here is locked until Dror approves.

---

## 1. The Idea in One Paragraph

Dror's next professional chapter: **QA Manager for the AI era** — helping companies ship AI-powered software faster *and* at higher quality by bringing QA discipline into the AI-assisted software development lifecycle (AI-SDLC). The bet: companies are adopting AI coding tools and AI features at breakneck speed, but their quality practices were designed for human-written code and deterministic behavior. The gap between "how fast we ship now" and "how confident we are in what we ship" is widening — and whoever closes that gap is extremely valuable.

**Working assumptions (verify in the morning):**
- Dror has QA management experience to build on (the request says "next chapter *as* QA Manager"). Combined with his OD consulting background, the unique angle is *organizational* quality transformation, not just test tooling.
- Target: consulting/fractional engagements rather than a single full-time role — but both paths are designed for below.

---

## 2. Why This, Why Now (the market case)

Two simultaneous shifts create the demand:

**Shift 1 — AI writes the code.** Teams using Claude Code, Copilot, Cursor etc. produce far more code per engineer. Review capacity, test coverage habits, and "who understands this code" assumptions all break. Volume of change outpaces traditional QA gates.

**Shift 2 — The product itself is AI.** LLM features are non-deterministic, prompt-sensitive, and fail in novel ways (hallucination, prompt injection, drift after model upgrades). Classic pass/fail testing doesn't cover "the answer is fluent but wrong."

Most companies are handling both shifts with vibes. The people who understand QA deeply *and* use AI tools daily *and* can lead organizational change are rare. Dror's three-way intersection — **QA management × OD consulting × hands-on AI building** (this repo is the proof) — is precisely that rare profile.

---

## 3. What "Higher Quality AI-SDLC" Means (the content of the offer)

The substance Dror would bring into companies, organized as a framework he can name and own. Working name: **"Confidence at AI Speed"** (rename freely).

### Pillar A — QA for AI-generated code
- Review strategies when AI writes most of the diff (risk-based review depth, AI-assisted code review as a second layer, review budgets).
- Test strategy shift: humans write the *contracts and edge-case intent*; AI generates the test volume; mutation testing / property-based testing to keep AI-written tests honest.
- Guardrails in CI: static analysis, security scanning, and "AI wrote this" provenance tracking.
- Definition-of-Done updates for AI-assisted teams.

### Pillar B — QA of AI features (testing the non-deterministic)
- Eval suites for LLM features: golden datasets, LLM-as-judge with calibration, regression evals on model/prompt changes.
- Red-teaming basics: prompt injection, jailbreaks, PII leakage.
- Monitoring in production: drift detection, feedback loops, incident playbooks for "the model started answering differently."

### Pillar C — The organizational layer (Dror's OD superpower — the differentiator)
- Quality culture change: moving teams from "QA as gate" to "quality as shared, AI-amplified practice."
- Role redesign: what do QA engineers *become* (eval engineers, quality coaches, risk analysts)?
- Metrics that leaders can steer by: escaped-defect trends vs. AI adoption, eval coverage, review depth vs. change volume.
- Adoption management: rolling out AI tools with quality guardrails from day one instead of retrofitting.

Pillars A and B exist in the market separately. **Pillar C is what almost nobody else brings** — most AI-quality consultants are tool people, not organizational change people.

### 3.1 The Maturity Model (makes the audit scoreable — added in review pass)

The framework only sells if a buyer can be *scored* against it. Each pillar is assessed on a 5-level maturity scale, giving the audit a concrete deliverable (a 3×5 heat-map plus top-3 gaps):

| Level | A: AI-generated code | B: AI features | C: Organization |
|---|---|---|---|
| 1 Ad-hoc | AI code merged like human code, no policy | "We tried the demo, it looked fine" | Nobody owns AI quality |
| 2 Aware | Informal "look harder at AI diffs" norms | Manual spot-checks of outputs | QA anxious, roles unclear |
| 3 Defined | Risk-based review policy, provenance tracked | Golden dataset exists, run before releases | AI-quality owner named, DoD updated |
| 4 Managed | Gates in CI, mutation/property tests on AI-written tests | Evals in CI, model-change regression suite | Metrics reviewed by leadership, QA roles redesigned |
| 5 Optimizing | Review depth auto-tuned by risk signals | Production monitoring feeds eval growth | Quality culture measurably improves adoption speed |

Rule of thumb for the sales narrative: most AI-adopting companies today are Level 1–2 on B and C while *believing* they're at 3. The audit surfaces that gap with evidence.

### 3.2 Anatomy of an Engagement (so a buyer can picture it)

1. **Audit (2 weeks, fixed price):** interviews (eng lead, QA, 2 devs, PM) + artifact review (10 recent AI-heavy PRs, incident list, existing tests/evals) → scored heat-map + top-3 gaps + 90-day plan. Deliverable is valuable even if they stop here.
2. **Transformation (90 days, fractional 1–2 days/week):** stand up the highest-leverage gate (usually: eval suite for the flagship AI feature + review policy for AI diffs), coach the QA team into the new roles, install the metrics dashboard.
3. **Retainer (optional):** monthly health check + eval review + advisory.

---

## 4. Three Strategic Options

### Option 1 — Fractional "Head of AI Quality" (RECOMMENDED)
Engage with 1–3 companies at a time as a part-time senior leader who stands up their AI-SDLC quality practice: assess, design the framework rollout, coach the QA org through the transition, leave behind working evals/gates and a transformed team.

- **Why recommended:** highest leverage of the full skill stack (QA + OD + hands-on AI); recurring revenue; each engagement generates case studies for the next; naturally scoped (90-day transformation arcs).
- **Risks:** requires 1–2 anchor clients to start; sales cycle for fractional roles is relationship-driven — the LinkedIn series (Task 4) directly feeds this.

### Option 2 — Full-time QA Manager / Director at an AI-forward company
Take one senior in-house role owning quality for AI products or AI-assisted engineering org.

- **Pros:** stability, depth, one context; strong title for credibility ("led AI quality at X").
- **Cons:** uses the OD consulting muscle less; single point of failure; slower path to the "help companies (plural)" vision Dror stated. Could be a deliberate 1–2 year *credibility-building* step before Option 1.

### Option 3 — Productized training & assessment
Build a workshop + assessment product: "AI-SDLC Quality Audit" (2-week diagnostic with scored report) and a 1-day team workshop. Sell repeatedly, no long engagements.

- **Pros:** scales, feeds the pipeline, packages well with LinkedIn content.
- **Cons:** transactional, less transformation impact, price ceiling.

**Recommended combination:** Option 1 as the destination, with Option 3's *audit* as the foot-in-the-door offer (an audit that goes well converts into a fractional engagement). Option 2 stays a fallback if a great in-house offer appears.

---

## 5. Proof-of-Work Assets to Build (with Claude, in this repo)

Credibility in this space is demonstrated, not claimed. Candidate build list, roughly in order:

1. **The AI-SDLC Quality Assessment** — a structured diagnostic (questionnaire + scoring rubric + report generator). Doubles as the Option-3 product and the sales tool.
2. **A public eval-suite demo** — take one of Dror's own apps (e.g., the Telegram bot's Claude replies, or Word Islands content generation) and build a visible, well-documented eval harness for it. Blog/LinkedIn gold: "I built evals for my own AI app; here's what they caught."
3. **"Confidence at AI Speed" framework one-pager** — the framework from §3 as a polished PDF/slide for conversations.
4. **Workshop deck** — the 1-day "QA in the AI era" workshop (ties to idea #4 from the original brainstorm list).
5. **Case-study writeups** — every project in this repo reframed through a quality lens (how validate-content.mjs guards curriculum quality is genuinely a nice small example of "contracts + automation").

---

## 6. 90-Day Roadmap (draft)

- **Weeks 1–2:** Positioning locked (this doc reviewed & revised), LinkedIn profile rewritten to the new chapter, LinkedIn series begins (Task 4 feeds this).
- **Weeks 3–6:** Build asset #1 (assessment) and #2 (public eval demo). Publish 2 posts/week.
- **Weeks 5–8:** 10–15 conversations with ex-colleagues / network: not selling, *researching* ("how is your team handling quality with AI tools?"). These calibrate the offer and surface the first audit candidates.
- **Weeks 8–12:** Run 1–2 paid (or heavily discounted pilot) audits. Convert at least one into an ongoing engagement. Adjust pricing and framework from real data.

---

## 6a. Pricing Hypotheses (review-pass addition — validate in the weeks 5–8 conversations)

Anchors for Israel-market consulting (adjust after network research): audit ₪25–40k fixed; fractional transformation ₪30–50k/month at 1–2 days/week; retainer ₪8–15k/month. Pilot audits for the first two logos can be discounted 50% in exchange for a written case study and a reference call. Do not do free pilots — free work signals hobby, and this chapter's whole point is that it isn't one.

## 6b. Risk Register (review-pass addition)

| Risk | Likelihood | Mitigation |
|---|---|---|
| "QA Manager" title reads junior to CTO buyers | Medium | Sell "AI Quality Leadership / fractional Head of AI Quality"; the QA-manager framing is the *skill*, not the package |
| Big consultancies productize AI-SDLC audits first | Medium | Speed + Pillar C differentiation + building in public; they can't post from a real repo |
| Evals/tooling landscape shifts under the framework | High | Keep the framework tool-agnostic (maturity levels name *capabilities*, not products); refresh examples quarterly |
| Pipeline stalls after network exhausted | Medium | LinkedIn series is the compounding channel; posts 5–8 commenters are the lead list — work it deliberately |
| Chapter competes with family/curriculum time | High | Capacity question (§7 Q4) decides cadence *before* commitments are made, not after |

## 7. Open Questions for Dror (answer these, then we revise)

1. **Background check:** How many years of QA/QA-management experience, in what domains? This shapes how hard we can lean on the title.
2. **Employment vs. consulting:** Is the fractional/consulting direction (Option 1) right, or is a full-time role (Option 2) actually the goal?
3. **Market:** Israel-first, or global/remote from day one? (Affects language of content, pricing, network strategy.)
4. **Capacity:** Hours per week available for this chapter right now?
5. **Naming:** Does "Confidence at AI Speed" resonate, or should we brainstorm names?
6. **First asset:** Agree that the AI-SDLC Quality Assessment is build #1?

---

## 8. Relationship to the Other Tracks

- **LinkedIn series (Task 4)** is the marketing engine for this chapter — the "building in public with AI" posts establish exactly the hands-on credibility Pillar A/B require. The series doc includes a QA-for-AI thread for this reason.
- **This repo is the portfolio.** Every project here (games, bots, validators, evals-to-come) is evidence that Dror doesn't just talk about AI-SDLC — he runs one.
