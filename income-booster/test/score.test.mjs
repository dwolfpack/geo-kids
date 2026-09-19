// Run: node --test income-booster/test/
import { test } from "node:test";
import assert from "node:assert/strict";
import { evaluate, score, gate, loadConfig, scoreBounds } from "../lib/score.mjs";
import { findDuplicate, canonicalUrl, titleKey, nextId } from "../lib/ledger.mjs";

const { profile, rubric } = loadConfig();

// A well-evidenced play that leans on domain knowledge and selling, where the
// agent does the building. This is the shape the system exists to find.
const strong = {
  id: "t-strong",
  title: "Fixed-fee AI intake triage for boutique immigration firms",
  upfront_cost_usd: 0,
  operator_hours_per_week: 6,
  requires_operator_coding: false,
  evidence: {
    named_operator: true,
    verifiable_number: true,
    corroboration_tiers: ["A", "B"],
    velocity_claim_only: false,
    revenue_observed_days: 120,
  },
  scores: {
    demand_evidence: 4, days_to_first_dollar: 4, operator_fit: 5,
    agent_leverage: 4, moat: 3, operator_build_burden: 1, risk: 1,
  },
};

// The operator's own example: "Shopify store built with a Grok bot in an hour."
const velocityTrap = {
  id: "t-velocity",
  title: "Build a Shopify store with a Grok bot in an hour",
  upfront_cost_usd: 120,
  operator_hours_per_week: 5,
  requires_operator_coding: false,
  matched_exclusions: ["dropshipping and print-on-demand"],
  evidence: {
    named_operator: true,        // a Medium author, so technically named
    verifiable_number: true,     // "$87 in 24 hours"
    corroboration_tiers: ["C"],  // only aggregators and course funnels
    velocity_claim_only: true,
    revenue_observed_days: 1,
  },
  scores: {
    demand_evidence: 3, days_to_first_dollar: 4, operator_fit: 1,
    agent_leverage: 4, moat: 0, operator_build_burden: 2, risk: 3,
  },
};

test("score is deterministic and normalized to 0-100", () => {
  const a = score(strong, rubric);
  const b = score(strong, rubric);
  assert.deepEqual(a, b);
  assert.ok(a.normalized >= 0 && a.normalized <= 100);
  assert.equal(a.raw, 42);
  assert.equal(a.normalized, 82);
});

test("bounds derive from weights alone", () => {
  assert.deepEqual(scoreBounds(rubric.weights), { min: -17.5, max: 55 });
});

test("a well-evidenced, high-fit play is promoted", () => {
  const r = evaluate(strong, profile, rubric);
  assert.equal(r.gate.passed, true, `unexpected gate failures: ${r.gate.failures}`);
  assert.equal(r.promote, true);
  assert.equal(r.state, "proposed");
});

test("the velocity trap is rejected, and every reason is recorded", () => {
  const r = evaluate(velocityTrap, profile, rubric);
  assert.equal(r.promote, false);
  assert.equal(r.state, "rejected");
  const joined = r.gate.failures.join(" | ");
  assert.match(joined, /no independent Tier A\/B corroboration/);
  assert.match(joined, /velocity claim only/);
  assert.match(joined, /launch spike, not a business/);
  assert.match(joined, /dropshipping/);
  // It is still scored, so the ledger can compare score-vs-gate over time.
  assert.ok(r.score > 0);
});

test("negative weights make operator build burden actually bite", () => {
  const heavy = { ...strong, id: "t-heavy", scores: { ...strong.scores, operator_build_burden: 5 } };
  const light = score(strong, rubric).normalized;
  assert.ok(score(heavy, rubric).normalized < light - 10,
    "8 extra weighted points of burden should drop the score meaningfully");
});

test("a play needing the operator to code is gated out", () => {
  const coder = { ...strong, id: "t-code", requires_operator_coding: true };
  assert.match(gate(coder, profile, rubric).failures.join(" "), /personally write code/);
});

test("cost above the capital cap is gated out", () => {
  const pricey = { ...strong, id: "t-pricey", upfront_cost_usd: 5000 };
  assert.match(gate(pricey, profile, rubric).failures.join(" "), /exceeds capital cap/);
});

test("time above the weekly budget is gated out", () => {
  const busy = { ...strong, id: "t-busy", operator_hours_per_week: 30 };
  assert.match(gate(busy, profile, rubric).failures.join(" "), /budget is 8h\/wk/);
});

test("missing dimension scores throw rather than scoring as zero", () => {
  const partial = { id: "t-partial", scores: { demand_evidence: 4 } };
  assert.throws(() => score(partial, rubric), /missing\/invalid dimension/);
});

// --- digest ---------------------------------------------------------------

test("digest includes awaiting_approval, not just proposed", async () => {
  // Regression: writing a proposal advances state to awaiting_approval. If the
  // digest only matched `proposed`, every real proposal would be omitted and the
  // scheduled email would go out empty — a silent, weekly failure.
  const { execFileSync } = await import("node:child_process");
  const { mkdtempSync, writeFileSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");

  const dir = mkdtempSync(join(tmpdir(), "ib-digest-"));
  const ledger = join(dir, "opportunities.jsonl");
  writeFileSync(ledger, [
    JSON.stringify({ ts: "2026-09-19T00:00:00Z", id: "ib-x-a", state: "proposed", title: "Written later", score: 70 }),
    JSON.stringify({ ts: "2026-09-19T00:01:00Z", id: "ib-x-b", state: "proposed", title: "Has a proposal", score: 80 }),
    JSON.stringify({ ts: "2026-09-19T00:02:00Z", id: "ib-x-b", state: "awaiting_approval", title: "Has a proposal", score: 80 }),
  ].join("\n") + "\n");

  const cli = new URL("../bin/ib.mjs", import.meta.url).pathname;
  const out = execFileSync(process.execPath, [cli, "digest"], {
    encoding: "utf8", env: { ...process.env, IB_LEDGER: ledger },
  });
  assert.match(out, /ib-x-b/, "awaiting_approval proposal must appear in the digest");
  assert.match(out, /ib-x-a/, "proposed candidates must also appear");
});

// --- dedupe ---------------------------------------------------------------

test("canonical urls ignore www, trailing slash, and tracking params", () => {
  assert.equal(canonicalUrl("https://www.Example.com/Post/?utm_source=x"),
               canonicalUrl("https://example.com/post"));
});

test("title keys ignore filler words and word order", () => {
  assert.equal(titleKey("AI intake triage for clinics"), titleKey("Clinics: triage intake with AI"));
  // Stopwords and punctuation drop out entirely.
  assert.equal(titleKey("How I Made Money With AI"), "");
});

test("short title keys do not fuzzy-match, to avoid false duplicates", () => {
  // Both reduce to the single token "triage". Without the length guard these
  // would score 1.0 similarity and be wrongly merged.
  const existing = [{ id: "ib-1", title: "AI triage", sources: [] }];
  assert.equal(findDuplicate({ title: "Triage with AI", sources: [] }, existing), null);
});

test("duplicates are caught by url and by near-identical title", () => {
  const existing = [{ id: "ib-1", title: "Fixed-fee AI intake triage for immigration firms",
                      sources: [{ url: "https://news.ycombinator.com/item?id=1" }] }];
  assert.equal(findDuplicate({ title: "unrelated thing", sources: [{ url: "https://news.ycombinator.com/item?id=1" }] }, existing)?.id, "ib-1");
  assert.equal(findDuplicate({ title: "Fixed fee AI intake triage for immigration firms!", sources: [] }, existing)?.id, "ib-1");
  assert.equal(findDuplicate({ title: "Hebrew voice agents for dental clinics", sources: [{ url: "https://other.com/x" }] }, existing), null);
});

test("ids increment within a day", () => {
  assert.equal(nextId("2026-09-19", []), "ib-2026-09-19-a");
  assert.equal(nextId("2026-09-19", [{ id: "ib-2026-09-19-a" }, { id: "ib-2026-09-19-b" }]), "ib-2026-09-19-c");
});
