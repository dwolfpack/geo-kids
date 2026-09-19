# Personal Income Booster — Design

## Problem

The operator wants a standing system that watches the AI landscape (Claude,
GPT, Grok, Gemini) for ways to raise **personal** income, designs a concrete
solution for anything promising, and asks for a go/no-go before any work
starts.

Doing this by hand fails for three reasons:

1. **The signal-to-noise ratio is terrible.** A first-page search for "make
   money with AI" in Sept 2026 returns mostly affiliate funnels, Gumroad
   course pitches, and recycled listicles with no named operator and no
   verifiable number. Any naive scraper produces a firehose of slop.
2. **Generic ideas are worthless.** "Build AI agents for businesses, $5k-50k
   per implementation" is true and useless. An opportunity is only actionable
   when scored against *this* operator's capabilities, time, and capital.
3. **Ideas without an execution path die.** The gap between "this is a good
   idea" and "money arrived" is where every side-hustle attempt fails. The
   system has to carry an approved idea into executed work, not just report it.

## Operator profile (drives everything)

Captured in `income-booster/config/profile.yaml`. As configured:

- **Executes on:** domain expertise (non-technical) + sales/marketing/distribution
- **Does NOT execute on:** writing code personally
- **Time:** 5-10 hrs/week
- **Horizon:** fast cash — revenue inside 30 days
- **Approval channel:** Gmail digest, reply to approve

The decisive consequence: **the operator is not the builder.** They supply
domain knowledge and the ability to find and close buyers; an agent supplies
the build. This inverts the usual rubric. An opportunity requiring 40 hours of
the operator's hands-on coding scores *near zero* even if the market is hot.
An opportunity where the agent can build unattended and the operator only has
to sell scores high.

## Goals

- Scan a curated source set on a schedule and surface AI-income opportunities
  that survive an explicit credibility filter.
- Score survivors deterministically against the operator profile, so ranking is
  reproducible and auditable rather than vibes.
- For anything clearing threshold, produce a one-page **solution design**: the
  offer, the buyer, the price, the first-five-customers plan, the agent-executable
  build steps, a 14-day timeline, and kill criteria.
- Email a ranked digest; accept `APPROVE <id>` / `REJECT <id> <reason>` by reply.
- On approval, hand the proposal to an executor agent that does the build work
  inside hard guardrails.
- Record outcomes and feed them back into the rubric, so the system gets more
  accurate about *this* operator over time.

## Non-goals

- **Not a trading or investment system.** No market positions, no financial
  advice, no capital allocation. Income means earned income.
- **No autonomous spending.** The system never spends money. Every cost is
  surfaced in the proposal and paid by the operator by hand.
- **No autonomous outreach to real people.** It drafts; the operator sends.
  A system that cold-emails strangers unattended is a spam cannon and a
  reputational liability.
- **Not a passive-income machine.** The system finds and designs work. Someone
  still has to do the work. Any source claiming otherwise is filtered out as
  slop, by design.
- **No tax, legal, or entity advice.** Flagged for human/professional review.

## Architecture

State lives in git, not in a container. Scan sessions are ephemeral — the
container is reclaimed after inactivity — so the ledger must be committed or
the system has amnesia. This is the single most important architectural
constraint.

```
Routine (cron, fresh session)
  │
  ├─ 1. SCAN      .claude/skills/income-scan
  │               sources.yaml → WebSearch/WebFetch → raw candidates
  │
  ├─ 2. GATE      lib/score.mjs (hard rejects, pre-scoring)
  │               slop filter + corroboration requirement
  │
  ├─ 3. SCORE     lib/score.mjs (weighted rubric vs profile.yaml)
  │               deterministic, 0-100, reproducible
  │
  ├─ 4. DEDUPE    lib/ledger.mjs → ledger/opportunities.jsonl
  │               canonical-URL key + fuzzy title match
  │
  ├─ 5. DESIGN    .claude/skills/income-propose
  │               score ≥ threshold → proposals/<id>.md
  │
  ├─ 6. ASK       Gmail digest, ranked, with IDs
  │
  └─ 7. COMMIT    git commit + push (state survives the container)

Separate Routine
  └─ SWEEP        .claude/skills/income-inbox-sweep
                  read replies → APPROVE/REJECT → ledger state
                  → spawn income-executor agent on approval
```

### A. Sources and credibility tiers

`config/sources.yaml`. Tiering is what makes this work at all:

- **Tier A — primary / demand-side.** Vendor changelogs and pricing pages
  (Anthropic, OpenAI, Google, xAI), new-capability announcements, marketplace
  launches, and — most valuable — *actual demand signals*: job boards, RFPs,
  Upwork/Contra/Fiverr search results, "who's hiring" threads. Someone posting
  a budget is worth more than a hundred blog posts.
- **Tier B — practitioner reports.** HN, Indie Hackers, specific subreddits,
  engineering blogs. Credible when a named person reports a real number.
- **Tier C — aggregators.** Listicles and roundups. Never scored on their own;
  usable only as a *pointer* to a Tier A/B source. Tier C alone is an auto-reject.

### B. The slop filter (hard gates, pre-scoring)

A candidate is rejected outright, no score computed, if **any** hold:

| Gate | Rationale |
|---|---|
| No named, identifiable operator behind the claim | Anonymous income claims are unfalsifiable |
| No verifiable number (revenue, rate, budget, contract) | "Lucrative" is not data |
| Only Tier C corroboration | Listicle chains cite each other, not reality |
| "Passive income", "guaranteed earnings", "while you sleep" framing | Reliable scam marker; FTC enforced against these in 2025-26 |
| Primary funnel is a paid course about making money | The product is the pitch, not the income |
| Requires upfront spend above `profile.capital_cap_usd` | Out of budget by definition |
| Requires impersonation, fake reviews, or credential collection | Fraud |
| Requires ToS-violating scraping or detection evasion | Bans and liability |
| Requires the operator to personally write code | Contradicts this operator's profile |
| Requires recruiting others who pay to join | MLM |

Corroboration rule: at least **one Tier A or Tier B** source, independent of
the discovering source, must confirm the demand before scoring.

### C. Scoring rubric

`config/rubric.yaml`. Each dimension 0-5, weighted, normalized to 0-100.
Weights shown are the fast-cash / non-technical / distribution-strong profile:

| Dimension | Weight | Meaning |
|---|---|---|
| `demand_evidence` | +3.0 | Is someone already paying for this, with a number attached? |
| `days_to_first_dollar` | +2.5 | Inverted scale; ≤14 days = 5 |
| `operator_fit` | +2.5 | Leans on domain expertise + selling, the operator's actual strengths |
| `agent_leverage` | +2.0 | Share of the work an agent can do unattended |
| `moat` | +1.0 | Repeatable, not a one-off; hard for the next person to copy |
| `operator_build_burden` | **−2.0** | Hours the operator must personally put in *beyond selling* |
| `risk` | **−1.5** | Capital at risk, reputational, legal, platform-ban exposure |

Promotion to a proposal requires **all** of:

- `score >= rubric.promote_threshold` (default 65)
- `demand_evidence >= 3` — never propose on an unvalidated market
- `risk <= 2`
- zero hard-gate hits

Two negative weights are the point. Most "AI income" advice is written for
builders; without an explicit penalty on the operator's own build hours, the
system would keep proposing work this operator cannot do.

### D. Opportunity state machine

```
discovered → gated → scored → proposed → awaiting_approval
   → approved → executing → live → measured → {scaled | killed}
                     └→ rejected (with reason, feeds rubric tuning)
```

Every transition is an append to `ledger/opportunities.jsonl`. Append-only:
the history of what was rejected and why is the training data for tuning
weights, so nothing is ever overwritten.

### E. Approval gate

Digest email, ranked, each entry carrying `id`, score, the one-line offer,
days-to-first-dollar, what the operator must personally do, and cost. Reply
grammar, parsed by the sweep Routine:

```
APPROVE ib-2026-09-19-a
REJECT  ib-2026-09-19-b not my domain
HOLD    ib-2026-09-19-c ask me again in two weeks
```

Unrecognized replies are left for human reading rather than guessed at.

### F. Executor agent

`.claude/agents/income-executor.md`. Takes one approved proposal and executes
the build. Hard limits, non-negotiable, stated in the agent definition:

- Never spends money. Surfaces cost; the operator pays.
- Never sends email, posts publicly, or contacts a real person. Drafts only.
- Never publishes under the operator's name or an invented brand without
  explicit per-artifact confirmation.
- Never commits credentials; secrets go in `.env`, already gitignored.
- Stops and asks when the proposal's assumptions turn out false, rather than
  improvising a different business.
- Reports against the proposal's kill criteria honestly, including "this isn't
  working".

### G. Feedback loop

`measured` entries record actual hours spent and dollars earned against the
proposal's estimate. A monthly tuning pass compares predicted vs actual and
adjusts weights. Without this the system is an idea firehose that never learns
this operator is, say, systematically too optimistic about days-to-first-dollar.

## Key risks

- **Slop leakage.** The gates are heuristic. Mitigation: corroboration
  requirement, and rejected candidates stay in the ledger for audit so the
  filter can be tightened against real misses.
- **Idea fatigue.** A daily digest of mediocre opportunities trains the
  operator to ignore it. Mitigation: hard promotion threshold, `max_proposals_per_digest`
  default 3, and silence is an acceptable output — no proposals beats filler.
- **Sunk-cost drift.** Approved plays that aren't working get defended.
  Mitigation: kill criteria are written into the proposal *before* approval,
  when they are cheap to accept.
- **Scanning the same ground forever.** Mitigation: `sources.yaml` rotation and
  a `seen` index, so the scanner spends its budget on new ground.

## Appendix: the velocity trap (worked example)

The operator raised a real candidate during design: *"I saw a Shopify store
made with a Grok bot in an hour."* Tracing it is instructive, because this
class of candidate is the most common thing the scanner will encounter.

What the evidence trail actually contains:

- A Medium post, "I Built a Shopify Store in 1 Hour with AI — Made $87 in 24 Hours"
- A Udemy course selling "Build a Profitable eCommerce Store in 1 Hour Using AI"
- Several vendor blogs for AI store-builder products
- **No follow-up revenue data for any of it**

Scored: `demand_evidence` capped at 1 (velocity claim, no sustained revenue),
`moat` 0 (anyone with an hour can copy it, and thousands have), `risk` 3 (ad
spend, platform dependency, dropshipping-adjacent). It also trips two hard
gates: the operator's `exclusions` list bars dropshipping, and the surrounding
funnel is a paid course about making money. **Verdict: rejected pre-scoring.**

This yields the system's central design principle, and it is worth stating
plainly because it inverts the usual framing:

> **Build velocity is not the opportunity.** AI collapsing build cost to near
> zero does not create an advantage — it *destroys* one, because it collapses
> for everyone simultaneously. When anyone can build the thing in an hour, the
> thing is worth nothing. The scarce inputs become the ones AI did not
> commoditize: a market you understand better than outsiders, and the ability
> to reach buyers in it.

Which is precisely this operator's profile. So the rubric does not reward "AI
can now build X fast". It rewards "AI can now build X fast **and** the operator
has an unfair advantage in selling X to a specific market". The velocity is the
enabler, never the edge. Every proposal must name the unfair advantage
explicitly, in a required `## Why you and not anyone else` section — if that
section is weak, the proposal is not sent.
