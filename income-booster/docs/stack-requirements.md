# Stack requirements — MCPs, skills, connectors

Checked against what is actually connected on this account as of 2026-09-19,
rather than a wish list.

## Connectors — already live, nothing to do

| Connector | Role in this system | Status |
|---|---|---|
| **Gmail** | The approval gate. Sends the digest, reads `APPROVE`/`REJECT` replies. | ✅ connected |
| **Google Drive** | Pipeline tracker and deliverable storage. A Sheet is a perfectly good CRM for the first 20 prospects — do not build a CRM. | ✅ connected |
| **Google Calendar** | Blocks the operator's 8 weekly hours; books discovery calls once outreach lands. | ✅ connected |
| **Canva** | Landing pages, one-pagers, pitch assets. Directly useful: a service offer needs something to look at. | ✅ connected |
| **GitHub** | Durable state. Ledger, proposals, and work products survive container recycling only because they are committed. | ✅ connected |
| **Figma** | Only if a proposal needs real UI design. Not on the critical path. | ✅ connected |

Built-in `WebSearch` / `WebFetch` cover the scanning itself. Both are available
with no setup.

## Worth adding

| What | Why | How |
|---|---|---|
| **Tavily** (plugin, in your catalog, not enabled) | `WebSearch` returns ranked links; Tavily crawls and extracts full page content and follows a site. The slop filter needs to read the *body* of a page to judge it — whether a number is sustained or a launch spike is rarely in the snippet. This is the single highest-value addition. | Enable the `tavily` plugin; needs a Tavily API key in `.env` |
| **A payment link** | You cannot get paid without one. Not an MCP problem: create a Stripe or Paddle payment link by hand, once, and paste it into proposals. | Manual, ~10 minutes |

## Deliberately not added

- **Stripe / payments MCP** — the executor agent is barred from spending or
  moving money. Automating the money path would mean relaxing that rule, which
  is not worth it for a link you create once.
- **LinkedIn / Twitter MCPs** — do not exist in usable form, and the agent is
  barred from posting anyway. Distribution stays in your hands by design: this
  is the part where being a real human with real credibility is the whole point.
- **A CRM (Notion, Airtable, HubSpot)** — premature. A Google Sheet holds 20
  prospects fine. Revisit at 50.
- **Slack** — no team, no need.

## Skills

Authored for this system, in `.claude/`:

| Skill / agent | Role |
|---|---|
| `income-scan` | Scan, gate, score, record. The weekly entry point. |
| `income-propose` | Turn a promoted candidate into a decidable one-pager. |
| `income-inbox-sweep` | Parse email decisions, update ledger, launch execution. |
| `income-executor` (agent) | Execute one approved proposal inside hard guardrails. |

Existing skills that proposals will reach for: `anthropic-skills:canvas-design`
(pitch assets), `anthropic-skills:docx` / `pdf` / `xlsx` (client deliverables),
`dataviz` (anything with a chart), `anthropic-skills:web-artifacts-builder`
(landing pages).

## The one real gap: `superpowers`

This repo already follows the `superpowers` convention —
`docs/superpowers/specs/` and `docs/superpowers/plans/` exist from the
195-country expansion work, and that plan references
`superpowers:subagent-driven-development`.

**The plugin is not installed on this account.** It is not in your plugin
catalog (checked), so it cannot be enabled from the marketplace UI. The design
and plan documents here follow its conventions by hand, and the implementation
plan is written so that either a `superpowers` executor or a plain agent can
work it task-by-task.

To get the real thing — brainstorming, subagent-driven execution, verification
gates — install it as a community plugin:

```
/plugin marketplace add obra/superpowers
/plugin install superpowers
```

Nothing here depends on it. It would make the execute phase more rigorous.
