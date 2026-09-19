// Append-only opportunity ledger, stored as JSONL in the repo.
//
// Two decisions worth stating:
//
// 1. It lives in git, not in the container. Scan sessions run in ephemeral
//    containers that get reclaimed; anything not committed is gone. Git is also
//    free audit history and free conflict detection.
// 2. It is append-only. Rejections are never deleted — the record of what was
//    rejected and why is exactly the data needed to tune the rubric, and to stop
//    the scanner from re-surfacing the same dead idea every Monday.

import { readFileSync, writeFileSync, existsSync, appendFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

// Overridable via IB_LEDGER so tests (and one-off analyses) can run against a
// throwaway ledger instead of the real, committed one.
export const LEDGER_PATH = process.env.IB_LEDGER ||
  new URL("../ledger/opportunities.jsonl", import.meta.url).pathname;

export const STATES = [
  "discovered", "gated", "scored", "proposed", "awaiting_approval",
  "approved", "executing", "live", "measured", "scaled", "killed", "rejected",
];

export function readLedger(path = LEDGER_PATH) {
  if (!existsSync(path)) return [];
  return readFileSync(path, "utf8")
    .split("\n")
    .filter((l) => l.trim())
    .map((l, i) => {
      try { return JSON.parse(l); }
      catch (e) { throw new Error(`ledger: malformed JSON on line ${i + 1}: ${e.message}`); }
    });
}

export function append(entry, path = LEDGER_PATH) {
  if (!entry.id) throw new Error("ledger: entry needs an id");
  if (!STATES.includes(entry.state)) {
    throw new Error(`ledger: unknown state '${entry.state}' (expected one of ${STATES.join(", ")})`);
  }
  mkdirSync(dirname(path), { recursive: true });
  appendFileSync(path, JSON.stringify({ ts: new Date().toISOString(), ...entry }) + "\n");
  return entry;
}

// Current state = the last appended entry per id.
export function current(path = LEDGER_PATH) {
  const byId = new Map();
  for (const e of readLedger(path)) byId.set(e.id, { ...(byId.get(e.id) ?? {}), ...e });
  return [...byId.values()];
}

// --- Dedupe ----------------------------------------------------------------
// Two candidates are the same opportunity if they share a canonical source URL,
// or if their titles are near-identical. The second check matters because the
// same idea gets republished across a dozen aggregators with different URLs.

export function canonicalUrl(url) {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "").toLowerCase();
    const path = u.pathname.replace(/\/+$/, "").toLowerCase();
    return host + path; // query strings are tracking noise
  } catch { return String(url ?? "").trim().toLowerCase(); }
}

const STOP = new Set(["the","a","an","to","for","with","in","on","of","and","how","i","my","your","using","use","make","made","money","ai"]);

export function titleKey(title) {
  return String(title ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w && !STOP.has(w))
    .sort()
    .join(" ");
}

function jaccard(a, b) {
  const A = new Set(a.split(" ").filter(Boolean));
  const B = new Set(b.split(" ").filter(Boolean));
  if (!A.size || !B.size) return 0;
  let inter = 0;
  for (const x of A) if (B.has(x)) inter++;
  return inter / (A.size + B.size - inter);
}

// Minimum distinctive tokens before fuzzy title matching is trusted. Stopword
// stripping can reduce a short title to one or two tokens, and Jaccard on tiny
// sets returns 1.0 for titles that merely share a single generic word — which
// would silently collapse unrelated opportunities into one. Below this length we
// require a URL match instead.
const MIN_TITLE_TOKENS = 3;

// Returns the existing entry this candidate duplicates, or null.
export function findDuplicate(candidate, existing, threshold = 0.8) {
  const urls = new Set((candidate.sources ?? []).map((s) => canonicalUrl(s.url ?? s)));
  const tk = titleKey(candidate.title);
  for (const e of existing) {
    for (const s of e.sources ?? []) {
      if (urls.has(canonicalUrl(s.url ?? s))) return e;
    }
    const etk = titleKey(e.title);
    const longEnough = tk.split(" ").filter(Boolean).length >= MIN_TITLE_TOKENS &&
                       etk.split(" ").filter(Boolean).length >= MIN_TITLE_TOKENS;
    if (longEnough && jaccard(tk, etk) >= threshold) return e;
  }
  return null;
}

export function nextId(dateStr, existing) {
  const prefix = `ib-${dateStr}-`;
  const used = new Set(existing.filter((e) => e.id?.startsWith(prefix)).map((e) => e.id));
  for (let i = 0; i < 26; i++) {
    const id = prefix + String.fromCharCode(97 + i);
    if (!used.has(id)) return id;
  }
  throw new Error(`ledger: more than 26 opportunities for ${dateStr}`);
}
