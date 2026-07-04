#!/usr/bin/env node
// Zero-dependency content validator.
// Walks content/ and checks frontmatter + required sections + EN/HE parity + glossary references.

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

const ROOT = process.cwd();
const CONTENT = join(ROOT, "content");

const REQUIRED_SESSION_FIELDS = [
  "module", "session", "slug", "title",
  "duration_min", "default_mode", "lang",
  "glossary_terms", "prereq_sessions",
];
const REQUIRED_MODULE_FIELDS = ["module", "title", "summary", "lang"];
const ALLOWED_MODES = new Set(["A", "B", "C"]);
const ALLOWED_LANGS = new Set(["en", "he"]);
const SESSION_SECTIONS = ["## Hook", "## Core idea", "## Show me", "## Your turn", "## Wrap-up"];
const MODULE_SECTIONS = ["## Overview", "## Go Deeper"];

const errors = [];
const fail = (file, msg) => errors.push(`${relative(ROOT, file)}: ${msg}`);

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    if (entry === ".gitkeep") continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (entry.endsWith(".md")) out.push(full);
  }
  return out;
}

function parseFrontmatter(raw, file) {
  if (!raw.startsWith("---\n")) { fail(file, "missing frontmatter opening ---"); return null; }
  const end = raw.indexOf("\n---", 4);
  if (end === -1) { fail(file, "missing frontmatter closing ---"); return null; }
  const block = raw.slice(4, end);
  const body = raw.slice(end + 4).replace(/^\n/, "");
  const data = {};
  for (const line of block.split("\n")) {
    if (!line.trim() || line.trim().startsWith("#")) continue;
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*):\s*(.*)$/);
    if (!m) { fail(file, `frontmatter line not parseable: "${line}"`); continue; }
    const [, key, rawVal] = m;
    data[key] = parseValue(rawVal.trim());
  }
  return { data, body };
}

function parseValue(v) {
  if (v === "") return "";
  if (v.startsWith("[") && v.endsWith("]")) {
    const inner = v.slice(1, -1).trim();
    if (!inner) return [];
    return inner.split(",").map(s => s.trim().replace(/^["']|["']$/g, ""));
  }
  if (v.startsWith('"') && v.endsWith('"')) return v.slice(1, -1);
  if (v.startsWith("'") && v.endsWith("'")) return v.slice(1, -1);
  if (/^-?\d+$/.test(v)) return Number(v);
  return v;
}

function checkRequired(data, file, required) {
  for (const k of required) if (!(k in data)) fail(file, `frontmatter missing required field "${k}"`);
}

function checkSections(body, file, required) {
  let pos = 0;
  for (const h of required) {
    const idx = body.indexOf(h, pos);
    if (idx === -1) { fail(file, `missing required section "${h}" (or out of order)`); return; }
    pos = idx + h.length;
  }
}

function loadGlossary(lang) {
  const path = join(CONTENT, "glossary", `${lang}.md`);
  try {
    const raw = readFileSync(path, "utf8");
    return new Set([...raw.matchAll(/^##\s+(.+)$/gm)].map(m => m[1].trim()));
  } catch { return new Set(); }
}

const glossaries = { en: loadGlossary("en"), he: loadGlossary("he") };

const sessionsByRel = new Map();
const files = walk(CONTENT);

for (const file of files) {
  if (file.includes(`${sep}glossary${sep}`)) continue;
  const raw = readFileSync(file, "utf8");
  const parsed = parseFrontmatter(raw, file);
  if (!parsed) continue;
  const { data, body } = parsed;
  const isModule = file.endsWith(`${sep}module.md`);
  if (isModule) {
    checkRequired(data, file, REQUIRED_MODULE_FIELDS);
    checkSections(body, file, MODULE_SECTIONS);
    if (!ALLOWED_LANGS.has(data.lang)) fail(file, `lang must be one of ${[...ALLOWED_LANGS].join(", ")}`);
    const linkCount = (body.match(/\[.+?\]\(.+?\)/g) || []).length;
    if (linkCount < 3) fail(file, `Go Deeper needs at least 3 links; found ${linkCount}`);
  } else {
    checkRequired(data, file, REQUIRED_SESSION_FIELDS);
    checkSections(body, file, SESSION_SECTIONS);
    if (!ALLOWED_MODES.has(data.default_mode)) fail(file, `default_mode must be A, B, or C`);
    if (!ALLOWED_LANGS.has(data.lang)) fail(file, `lang must be en or he`);
    if (typeof data.duration_min !== "number" || data.duration_min < 5 || data.duration_min > 20)
      fail(file, `duration_min must be integer 5–20`);
    const terms = Array.isArray(data.glossary_terms) ? data.glossary_terms : [];
    const g = glossaries[data.lang] || new Set();
    for (const t of terms) if (!g.has(t)) fail(file, `glossary term "${t}" not found in glossary/${data.lang}.md`);
    const rel = relative(join(CONTENT, "modules"), file).split(sep);
    if (rel.length >= 3) {
      const [mod, lang, name] = rel;
      const key = `${mod}/${name}`;
      if (!sessionsByRel.has(key)) sessionsByRel.set(key, new Set());
      sessionsByRel.get(key).add(lang);
    }
  }
}

for (const [key, langs] of sessionsByRel) {
  if (!langs.has("en")) errors.push(`PARITY: ${key} missing EN counterpart`);
  if (!langs.has("he")) errors.push(`PARITY: ${key} missing HE counterpart`);
}

if (errors.length) {
  console.error(`\n✗ Validation failed with ${errors.length} problem(s):\n`);
  for (const e of errors) console.error("  - " + e);
  process.exit(1);
} else {
  console.log(`✓ All content valid (${files.length} files checked)`);
  process.exit(0);
}
