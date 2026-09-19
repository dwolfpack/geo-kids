// Deterministic gating and scoring. Given a candidate opportunity scored 0-5 on
// each rubric dimension by the scanning agent, this produces a reproducible
// 0-100 score and a pass/fail gate result.
//
// Determinism is the point: the agent's job is to assign the 0-5 dimension
// scores with evidence, and this file's job is to turn those into a ranking the
// same way every time. Ranking logic never lives in a prompt.

import { loadYaml } from "./yaml.mjs";

export const DIMENSIONS = [
  "demand_evidence",
  "days_to_first_dollar",
  "operator_fit",
  "agent_leverage",
  "moat",
  "operator_build_burden",
  "risk",
];

export function loadConfig(dir = new URL("../config/", import.meta.url).pathname) {
  return {
    profile: loadYaml(dir + "profile.yaml"),
    rubric: loadYaml(dir + "rubric.yaml"),
  };
}

// Score range depends only on the weights, so normalization is stable as long
// as the weights are. Positive weights at 5 give the max; negative at 5 the min.
export function scoreBounds(weights) {
  let max = 0, min = 0;
  for (const d of DIMENSIONS) {
    const w = weights[d] ?? 0;
    if (w > 0) max += w * 5; else min += w * 5;
  }
  return { min, max };
}

export function score(candidate, rubric) {
  const w = rubric.weights;
  const breakdown = {};
  let raw = 0;
  for (const d of DIMENSIONS) {
    const s = candidate.scores?.[d];
    if (typeof s !== "number" || s < 0 || s > 5) {
      throw new Error(`score: candidate ${candidate.id} missing/invalid dimension '${d}' (got ${JSON.stringify(s)})`);
    }
    const contribution = (w[d] ?? 0) * s;
    breakdown[d] = { value: s, weight: w[d] ?? 0, contribution: round2(contribution) };
    raw += contribution;
  }
  const { min, max } = scoreBounds(w);
  const normalized = Math.round(((raw - min) / (max - min)) * 100);
  return { raw: round2(raw), normalized, breakdown };
}

// Hard gates. These are checked BEFORE scoring matters: a gate failure cannot be
// outweighed by a high score. Returns every failure, not just the first, so the
// ledger records the complete reason a candidate was dropped.
export function gate(candidate, profile, rubric) {
  const failures = [];
  const g = rubric.gates;
  const s = candidate.scores ?? {};
  const ev = candidate.evidence ?? {};

  // --- Evidence quality -----------------------------------------------------
  const tiers = ev.corroboration_tiers ?? [];
  if (g.require_independent_corroboration) {
    const allowed = g.allowed_corroboration_tiers ?? ["A", "B"];
    if (!tiers.some((t) => allowed.includes(t))) {
      failures.push(`no independent Tier ${allowed.join("/")} corroboration (got: ${tiers.join(",") || "none"})`);
    }
  }
  if (!ev.named_operator) failures.push("no named, identifiable operator behind the income claim");
  if (!ev.verifiable_number) failures.push("no verifiable number (revenue, rate, budget, or contract value)");

  // --- The velocity trap ----------------------------------------------------
  // "Built it in an hour" measures the tool, not the market. When that is all
  // the evidence amounts to, demand_evidence is capped and the candidate cannot
  // clear the demand gate.
  const cap = g.velocity_claim_caps_demand_at;
  if (ev.velocity_claim_only && typeof cap === "number" && (s.demand_evidence ?? 0) > cap) {
    failures.push(`velocity claim only: demand_evidence ${s.demand_evidence} exceeds cap ${cap} — no sustained revenue evidence`);
  }
  const needDays = g.require_sustained_revenue_days;
  if (typeof needDays === "number" && ev.revenue_observed_days != null && ev.revenue_observed_days < needDays) {
    failures.push(`revenue observed for only ${ev.revenue_observed_days}d (need >=${needDays}d) — launch spike, not a business`);
  }

  // --- Profile constraints --------------------------------------------------
  if (typeof g.min_demand_evidence === "number" && (s.demand_evidence ?? 0) < g.min_demand_evidence) {
    failures.push(`demand_evidence ${s.demand_evidence} below minimum ${g.min_demand_evidence}`);
  }
  if (typeof g.max_risk === "number" && (s.risk ?? 5) > g.max_risk) {
    failures.push(`risk ${s.risk} above maximum ${g.max_risk}`);
  }
  const cost = candidate.upfront_cost_usd ?? 0;
  const capUsd = profile.constraints?.capital_cap_usd ?? Infinity;
  if (cost > capUsd) failures.push(`upfront cost $${cost} exceeds capital cap $${capUsd}`);

  const hrs = candidate.operator_hours_per_week ?? 0;
  const hrsCap = profile.constraints?.hours_per_week ?? Infinity;
  if (hrs > hrsCap) failures.push(`needs ${hrs}h/wk of operator time, budget is ${hrsCap}h/wk`);

  // Exclusions are matched by the scanning agent, which sets matched_exclusions
  // after comparing the candidate against profile.exclusions verbatim.
  for (const x of candidate.matched_exclusions ?? []) {
    failures.push(`matches operator exclusion: "${x}"`);
  }

  // If the operator cannot code and the play needs them to, it is dead on
  // arrival regardless of how good the market looks.
  if ((profile.capabilities?.software_build ?? 0) === 0 && candidate.requires_operator_coding) {
    failures.push("requires the operator to personally write code");
  }

  return { passed: failures.length === 0, failures };
}

export function evaluate(candidate, profile, rubric) {
  const gateResult = gate(candidate, profile, rubric);
  let scoreResult = null;
  // Still score gated-out candidates when possible: the ledger keeps them for
  // audit, and comparing score-vs-gate over time is how the filter gets tuned.
  try { scoreResult = score(candidate, rubric); } catch { /* incomplete scores */ }

  const promote = gateResult.passed && scoreResult != null &&
    scoreResult.normalized >= rubric.promote_threshold;

  return {
    id: candidate.id,
    promote,
    state: promote ? "proposed" : (gateResult.passed ? "scored" : "rejected"),
    score: scoreResult?.normalized ?? null,
    raw: scoreResult?.raw ?? null,
    breakdown: scoreResult?.breakdown ?? null,
    gate: gateResult,
  };
}

function round2(n) { return Math.round(n * 100) / 100; }
