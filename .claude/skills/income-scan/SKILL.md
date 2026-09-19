---
name: income-scan
description: Scan the web for AI-income opportunities, filter slop, score against the operator profile, and record results in the ledger. Use when running a scheduled income scan, when the operator asks what new AI income opportunities exist, or when evaluating a specific income idea they bring you.
---

# Income scan

You are looking for ways the operator can earn more money using AI, and you are
looking on behalf of a **specific person**, not a generic audience. Read
`income-booster/config/profile.yaml` first. Everything depends on it.

## The one thing to get right

Most AI-income content measures the wrong variable. It reports **how fast a tool
can build something** ("I made a Shopify store in an hour") and implies that
this is an opportunity. It is not. When anyone can build the thing in an hour,
the thing is worth nothing — build velocity collapsed for everyone at once.

What AI did *not* commoditize is what you are hunting for:

- a market the operator understands better than outsiders do
- the ability to reach buyers in that market
- a buyer who already has a budget and a problem

So the question is never "what can AI build now?" It is **"what can AI build now
that this operator could sell, to buyers they can actually reach, where their
domain knowledge is the reason they win?"**

## Procedure

1. **Read config.** `profile.yaml`, `sources.yaml`, `rubric.yaml`. If
   `profile.operator.domains` is empty, say so prominently in your output —
   `operator_fit` scores are guesses without it, and the whole scan is weaker.

2. **Check the ledger before searching.** `node income-booster/bin/ib.mjs list`.
   Do not spend scan budget rediscovering things already recorded, and read the
   `rejected` entries: they tell you what this operator does not want.

3. **Scan demand first, content second.** Work `sources.yaml` in tier order, and
   prioritise `kind: demand` sources. One job post with a budget outweighs any
   amount of commentary. Expand `{domain}` in `queries` for each of the
   operator's domains. Skip `excluded_domains` entirely.

4. **Build candidates.** For each distinct opportunity, write an object into a
   JSON array at `/tmp/claude-*/scratchpad/candidates.json`:

```json
[{
  "title": "short distinctive name",
  "offer": "one sentence: what is sold, to whom, for how much",
  "sources": [{ "url": "...", "tier": "A", "what_it_shows": "..." }],
  "upfront_cost_usd": 0,
  "operator_hours_per_week": 6,
  "days_to_first_dollar_est": 21,
  "requires_operator_coding": false,
  "matched_exclusions": [],
  "evidence": {
    "named_operator": true,
    "verifiable_number": true,
    "corroboration_tiers": ["A", "B"],
    "velocity_claim_only": false,
    "revenue_observed_days": 90
  },
  "scores": {
    "demand_evidence": 4, "days_to_first_dollar": 4, "operator_fit": 5,
    "agent_leverage": 4, "moat": 3, "operator_build_burden": 1, "risk": 1
  },
  "score_rationale": { "demand_evidence": "quote the rubric anchor you matched, plus the specific evidence" }
}]
```

   Rules for the fields that matter:

   - `evidence.velocity_claim_only`: **true** whenever the claim is about build
     speed rather than sustained earnings. Be honest here; this field is the
     main defence against slop.
   - `evidence.revenue_observed_days`: how long revenue was actually observed.
     A first-day or first-week number is a launch spike — friends, the author's
     own audience, curiosity traffic. Set it to `1` or `7` accordingly and let
     the gate do its job.
   - `evidence.corroboration_tiers`: tiers of sources *independent of* the one
     that surfaced the idea. Tier C only means the candidate dies, correctly.
   - `matched_exclusions`: compare against `profile.exclusions` verbatim and
     copy the matching string in. Do not paraphrase.
   - `scores`: use the anchors in `rubric.yaml`. Quote the anchor you matched in
     `score_rationale`. Never round up to be encouraging — an inflated score
     costs the operator real hours.

5. **Evaluate.** `node income-booster/bin/ib.mjs eval <candidates.json>`. This
   gates, scores, dedupes, and appends to the ledger. Do not hand-edit the
   ledger; do not second-guess the output. If you think a gate is wrong, say so
   in your report and propose a config change — do not route around it.

6. **Propose.** For each candidate that came back `PROPOSED`, invoke the
   `income-propose` skill.

7. **Commit.** The container is ephemeral; uncommitted state is lost.
   ```
   git add income-booster/ledger income-booster/proposals
   git commit -m "income-scan: <n> candidates, <m> promoted"
   git push -u origin <branch>
   ```

8. **Report** with the digest: `node income-booster/bin/ib.mjs digest`.

## Calibration

Finding nothing is a valid and common outcome. A week with no proposal means the
filter worked. Never pad the digest to look productive — the operator has 8
hours a week, and a mediocre proposal that consumes them is worse than silence,
because it also costs you their trust in the next digest.
