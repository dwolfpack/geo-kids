---
name: income-propose
description: Turn a promoted income opportunity into a one-page executable proposal with offer, buyer, pricing, first-customers plan, agent-executable build steps, timeline, and kill criteria. Use after income-scan promotes a candidate, or when the operator asks you to design a solution for a specific opportunity.
---

# Income proposal

Write `income-booster/proposals/<id>.md` for one promoted opportunity. The
operator will read this on their phone and reply APPROVE or REJECT. It has to be
decidable in two minutes.

## Standard to hold

The proposal must be executable by an agent *without further research*. If
approved, `income-executor` works only from this document. Vagueness here
becomes a stalled agent later.

Every claim about demand must carry a source link. If you cannot source it, say
"unvalidated assumption" explicitly rather than smoothing it over.

## Required structure

```markdown
# <id> — <title>

**Score:** N/100 · **First dollar:** ~N days · **Your time:** ~N hrs/wk · **Cost:** $N

## The offer
One paragraph. What is sold, to whom, at what price, and what the buyer gets.
Concrete enough to put on a landing page.

## Why you and not anyone else
The unfair advantage, named specifically. Which domain knowledge, which buyer
access. If this section is weak, STOP — do not send the proposal. An opportunity
anyone could execute is not an opportunity for this operator, it is a commodity.

## The buyer
Who pays. How many exist. How the operator reaches them — named channels,
specific communities, actual companies. "Small businesses" is not a buyer.

## Pricing
The number, and why a buyer says yes to it. Anchor against what they pay today
for the same outcome.

## First five customers
A numbered list of concrete actions. Who to contact, in what order, with what
message. This is the part that actually determines success, so it gets more
detail than the build.

## What the agent builds
Numbered, agent-executable steps. Each one a discrete deliverable, with the
tools and MCPs it needs. Flag anything requiring an account, a credential, or a
payment — those are the operator's to do, and they block the agent.

## What you personally do
An honest hours-per-week figure, broken down. Selling and review only. If build
hours leak in here, the scoring was wrong and this proposal should not exist.

## Timeline
Day-by-day for 14 days, and where the first dollar realistically lands.

## Kill criteria
The specific, measurable conditions under which this is abandoned — written now,
while they are cheap to accept. e.g. "If fewer than 2 of 20 targeted
prospects reply by day 10, kill it." Without this, a dud gets defended for
months on sunk cost.

## Costs and risks
Every dollar. Every platform dependency. Every way this damages the operator's
reputation if it goes badly.

## Sources
Links, each with one line on what it evidences.
```

## After writing

Set the state and commit:

```
node income-booster/bin/ib.mjs set-state <id> awaiting_approval -m "proposal written"
```

Do not email the operator from this skill — the scan's digest step does that
once, for all proposals together. Never send anything on their behalf beyond the
digest to their own address.
