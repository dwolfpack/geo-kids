#!/usr/bin/env node
// income-booster CLI. The scanning agent produces candidate JSON; this turns it
// into gated, scored, deduped ledger entries. Keeping this in code rather than in
// a prompt means ranking is reproducible and reviewable.
//
//   ib eval <candidates.json>      gate + score + dedupe, append to ledger
//   ib list [--state S] [--json]   show current state of each opportunity
//   ib set-state <id> <state> [-m] record a transition
//   ib digest [--max N]            render the approval digest as markdown
//   ib stats                       rejection reasons, for tuning the rubric

import { readFileSync } from "node:fs";
import { evaluate, loadConfig } from "../lib/score.mjs";
import { append, current, findDuplicate, nextId, STATES } from "../lib/ledger.mjs";

const USAGE = `
income-booster — scan, score, and propose AI income opportunities.

  ib eval <candidates.json>       gate + score + dedupe, append to ledger
  ib list [--state S] [--json]    show current state of each opportunity
  ib set-state <id> <state> [-m]  record a transition
  ib digest [--max N]             render the approval digest as markdown
  ib stats                        rejection reasons, for tuning the rubric
`;

const [cmd, ...args] = process.argv.slice(2);
const flag = (name, dflt) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? dflt : (args[i + 1] ?? true);
};
const today = () => new Date().toISOString().slice(0, 10);

function cmdEval(file) {
  if (!file) die("usage: ib eval <candidates.json>");
  const { profile, rubric } = loadConfig();
  const candidates = JSON.parse(readFileSync(file, "utf8"));
  const list = Array.isArray(candidates) ? candidates : [candidates];
  const existing = current();
  const results = [];

  if (!(profile.operator?.domains ?? []).length) {
    warn("profile.operator.domains is empty — operator_fit scores are unverified guesses. Fill it in.");
  }

  for (const c of list) {
    const dup = findDuplicate(c, existing);
    if (dup) {
      results.push({ id: dup.id, title: c.title, verdict: "duplicate", of: dup.id });
      continue;
    }
    const id = c.id ?? nextId(today(), existing);
    const r = evaluate({ ...c, id }, profile, rubric);
    const entry = {
      id, state: r.state, title: c.title, offer: c.offer ?? null,
      score: r.score, raw: r.raw, breakdown: r.breakdown,
      gate_failures: r.gate.failures, sources: c.sources ?? [],
      evidence: c.evidence ?? {}, upfront_cost_usd: c.upfront_cost_usd ?? 0,
      operator_hours_per_week: c.operator_hours_per_week ?? null,
      days_to_first_dollar_est: c.days_to_first_dollar_est ?? null,
    };
    append(entry);
    existing.push(entry);
    results.push({ id, title: c.title, verdict: r.state, score: r.score,
                   failures: r.gate.failures });
  }

  for (const r of results) {
    const head = `${r.id}  ${String(r.score ?? "--").padStart(3)}  ${r.verdict.toUpperCase()}`;
    console.log(`${head}  ${r.title ?? ""}`);
    for (const f of r.failures ?? []) console.log(`        ✗ ${f}`);
    if (r.of) console.log(`        = duplicate of ${r.of}`);
  }
  const promoted = results.filter((r) => r.verdict === "proposed").length;
  console.log(`\n${results.length} candidate(s): ${promoted} promoted, ` +
    `${results.filter((r) => r.verdict === "rejected").length} rejected, ` +
    `${results.filter((r) => r.verdict === "duplicate").length} duplicate.`);
}

function cmdList() {
  const want = flag("state");
  let rows = current();
  if (want) rows = rows.filter((r) => r.state === want);
  rows.sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
  if (flag("json")) return console.log(JSON.stringify(rows, null, 2));
  if (!rows.length) return console.log("(no opportunities)");
  for (const r of rows) {
    console.log(`${r.id}  ${String(r.score ?? "--").padStart(3)}  ${(r.state ?? "").padEnd(17)} ${r.title ?? ""}`);
  }
}

function cmdSetState(id, state) {
  if (!id || !state) die("usage: ib set-state <id> <state> [-m note]");
  if (!STATES.includes(state)) die(`unknown state '${state}'. Valid: ${STATES.join(", ")}`);
  const existing = current().find((e) => e.id === id);
  if (!existing) die(`no opportunity with id '${id}'`);
  const note = flag("m") ?? flag("note") ?? null;
  append({ id, state, title: existing.title, note });
  console.log(`${id}: ${existing.state} → ${state}${note ? ` (${note})` : ""}`);
}

function cmdDigest() {
  const { profile, rubric } = loadConfig();
  const max = Number(flag("max", profile.notifications?.max_proposals_per_digest ?? 3));
  // Both states belong in the digest: `proposed` is promoted-but-unwritten,
  // `awaiting_approval` is written and waiting on the operator. Filtering on
  // `proposed` alone silently produces an empty digest for every proposal that
  // actually has a document, which is the normal case.
  const DIGESTABLE = new Set(["proposed", "awaiting_approval"]);
  const rows = current()
    .filter((r) => DIGESTABLE.has(r.state))
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, max);

  if (!rows.length) {
    if (profile.notifications?.send_empty_digest) {
      console.log("# Income Booster — nothing cleared the bar this week\n\nNo candidate scored above " +
        `${rubric.promote_threshold}. Silence is a real result: it means the scan ran and found nothing worth your 8 hours.`);
    } else {
      console.error("(no proposals; send_empty_digest is false — sending nothing)");
      process.exit(3);
    }
    return;
  }

  console.log(`# Income Booster — ${rows.length} opportunit${rows.length === 1 ? "y" : "ies"} for review\n`);
  console.log(`Scanned ${new Date().toISOString().slice(0, 10)}. Reply with one line per decision:\n`);
  console.log("```\nAPPROVE <id>\nREJECT  <id> <reason>\nHOLD    <id> <when to re-ask>\n```\n");
  for (const r of rows) {
    console.log(`---\n\n## ${r.id} — ${r.title}  ·  score ${r.score}/100\n`);
    if (r.offer) console.log(`**Offer:** ${r.offer}\n`);
    console.log(`- **First dollar in:** ~${r.days_to_first_dollar_est ?? "?"} days`);
    console.log(`- **Your time:** ~${r.operator_hours_per_week ?? "?"} hrs/week (selling and review)`);
    console.log(`- **Upfront cost:** $${r.upfront_cost_usd ?? 0}`);
    if (r.breakdown) {
      const b = r.breakdown;
      console.log(`- **Why it scored:** demand ${b.demand_evidence?.value}/5, fit ${b.operator_fit?.value}/5, ` +
        `agent leverage ${b.agent_leverage?.value}/5, your build burden ${b.operator_build_burden?.value}/5, risk ${b.risk?.value}/5`);
    }
    console.log(`- **Full proposal:** \`income-booster/proposals/${r.id}.md\`\n`);
  }
}

function cmdStats() {
  const reasons = new Map();
  let rejected = 0, total = 0;
  for (const r of current()) {
    total++;
    if (r.state !== "rejected") continue;
    rejected++;
    for (const f of r.gate_failures ?? []) {
      const key = f.replace(/\d+/g, "N").replace(/".*?"/g, '"..."').slice(0, 70);
      reasons.set(key, (reasons.get(key) ?? 0) + 1);
    }
  }
  console.log(`${total} tracked, ${rejected} rejected.\n\nMost common rejection reasons:`);
  for (const [k, v] of [...reasons].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(v).padStart(3)}×  ${k}`);
  }
  console.log("\nA reason dominating this list is a signal to tighten sources.yaml,\n" +
    "not just to keep re-rejecting the same class of candidate.");
}

function die(msg) { console.error(`error: ${msg}`); process.exit(2); }
function warn(msg) { console.error(`warning: ${msg}`); }

switch (cmd) {
  case "eval": cmdEval(args[0]); break;
  case "list": cmdList(); break;
  case "set-state": cmdSetState(args[0], args[1]); break;
  case "digest": cmdDigest(); break;
  case "stats": cmdStats(); break;
  default:
    console.log(USAGE.trim());
    process.exit(cmd ? 2 : 0);
}
