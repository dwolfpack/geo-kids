# Personal Income Booster

A standing system that watches the AI landscape for ways to raise your income,
designs a concrete solution for anything that survives scrutiny, and asks you
before any work starts.

- **Design:** `docs/superpowers/specs/2026-09-19-personal-income-booster-design.md`
- **Plan:** `docs/superpowers/plans/2026-09-19-personal-income-booster.md`
- **Stack:** `docs/stack-requirements.md`

## The premise

You are not the builder. You bring domain expertise and the ability to reach
buyers; an agent brings the build. The rubric is weighted for that, with explicit
*penalties* on hours you would personally have to spend on non-selling work.

It follows that build velocity is never the opportunity. "AI can make a Shopify
store in an hour" is not an edge — it collapsed for everyone at once, which is
what makes it worthless. The edge is a market you understand and can reach.

## Daily use

You do one thing: read a Monday email and reply.

```
APPROVE ib-2026-09-19-a
REJECT  ib-2026-09-19-b not my domain
HOLD    ib-2026-09-19-c ask me again in two weeks
```

Rejection reasons are worth writing properly — recurring ones become
`exclusions` in `config/profile.yaml`, which is how the digest gets sharper.

Some weeks the email will not arrive. That is the system working: nothing cleared
the bar, and a mediocre proposal would cost you 8 hours you cannot refund.

## CLI

```bash
node income-booster/bin/ib.mjs list                 # pipeline state
node income-booster/bin/ib.mjs list --state proposed
node income-booster/bin/ib.mjs eval candidates.json # gate + score + record
node income-booster/bin/ib.mjs digest               # render the email
node income-booster/bin/ib.mjs stats                # why things get rejected
node --test "income-booster/test/*.test.mjs"        # 21 tests
```

## Layout

```
config/    profile.yaml (you edit this), rubric.yaml, sources.yaml
lib/       yaml.mjs, score.mjs, ledger.mjs   — zero dependencies
bin/ib.mjs CLI
ledger/    opportunities.jsonl — append-only, committed to git
proposals/ one markdown file per promoted opportunity
work/      executor agent output, per opportunity
```

## Two things to know

**State lives in git.** Scan sessions run in containers that get reclaimed.
Anything uncommitted is gone, which is why every skill ends by committing.

**Scoring lives in code, not prompts.** `lib/score.mjs` turns the agent's 0-5
evidence judgements into a ranking the same way every time. The agent gathers
evidence; it does not get to decide what wins.

## First run

1. Fill in `config/profile.yaml` → `operator.domains`. Nothing else matters as
   much; `operator_fit` is a guess until you do.
2. Review `config/rubric.yaml` weights. They encode real opinions about what
   matters — disagree with them in the file, not in your head.
3. Approve creation of the weekly Routines (see the plan, Task 4).
