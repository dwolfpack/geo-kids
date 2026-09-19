// Minimal YAML subset parser.
//
// The config files are hand-edited by the operator, so YAML (with comments) is
// the right format for them. But this system runs in fresh, ephemeral containers
// with no install step, so it cannot depend on a YAML package. Hence this.
//
// Supported: comments, nested maps by indentation, `key: value`, `key:` with a
// nested block, `- item` block lists, `- {k: v}` block lists of flow maps,
// inline flow lists `[a, b]` and flow maps `{a: 1, b: 2}` (nestable), folded
// (`>`, `>-`) and literal (`|`, `|-`) block scalars, quoted/bare scalars,
// numbers, booleans, null.
//
// NOT supported, and throws rather than silently misparsing: anchors/aliases,
// multiple documents, complex keys, tagged values. One known limitation: a `#`
// inside a block scalar is treated as a comment, because comment stripping
// happens during tokenization.

function stripComment(line) {
  let out = "", qt = null;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (qt) {
      out += c;
      if (c === qt && line[i - 1] !== "\\") qt = null;
    } else if (c === '"' || c === "'") {
      qt = c; out += c;
    } else if (c === "#" && (i === 0 || /\s/.test(line[i - 1]))) {
      break;
    } else out += c;
  }
  return out.trimEnd();
}

// Split on `sep` only at bracket depth 0 and outside quotes, so that
// `{a: [1, 2], b: 3}` splits into two members rather than three.
function splitTop(s, sep) {
  const parts = [];
  let buf = "", depth = 0, qt = null;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (qt) {
      buf += c;
      if (c === qt && s[i - 1] !== "\\") qt = null;
      continue;
    }
    if (c === '"' || c === "'") { qt = c; buf += c; continue; }
    if (c === "[" || c === "{") depth++;
    if (c === "]" || c === "}") depth--;
    if (c === sep && depth === 0) { parts.push(buf); buf = ""; continue; }
    buf += c;
  }
  if (buf.trim()) parts.push(buf);
  return parts;
}

function scalar(raw) {
  const v = raw.trim();
  if (v === "" || v === "null" || v === "~") return null;
  if (v === "true") return true;
  if (v === "false") return false;
  if ((v.startsWith('"') && v.endsWith('"') && v.length > 1) ||
      (v.startsWith("'") && v.endsWith("'") && v.length > 1)) {
    return v.slice(1, -1).replace(/\\"/g, '"');
  }
  if (v.startsWith("[") && v.endsWith("]")) {
    return splitTop(v.slice(1, -1), ",").map(scalar);
  }
  if (v.startsWith("{") && v.endsWith("}")) {
    const obj = {};
    for (const member of splitTop(v.slice(1, -1), ",")) {
      const ci = member.indexOf(":");
      if (ci === -1) throw new Error(`yaml: flow map member missing ':' → ${member.trim()}`);
      obj[member.slice(0, ci).trim().replace(/^["']|["']$/g, "")] = scalar(member.slice(ci + 1));
    }
    return obj;
  }
  if (/^-?\d+$/.test(v)) return parseInt(v, 10);
  if (/^-?\d*\.\d+$/.test(v)) return parseFloat(v);
  return v;
}

const BLOCK_SCALAR = /^([>|])([-+]?)$/;

export function parseYaml(text) {
  const lines = [];
  for (const rawLine of text.split("\n")) {
    const content = stripComment(rawLine);
    if (!content.trim()) { lines.push({ blank: true, indent: -1, content: "", raw: rawLine }); continue; }
    lines.push({ blank: false, indent: content.match(/^ */)[0].length, content: content.trim(), raw: rawLine });
  }
  // Keep blanks only for block scalars; the map/list walker skips them.
  let pos = 0;
  const skipBlanks = () => { while (pos < lines.length && lines[pos].blank) pos++; };

  // Consume an indented block as a folded or literal string.
  function readBlockScalar(style, chomp, parentIndent) {
    const collected = [];
    let baseIndent = null;
    while (pos < lines.length) {
      const l = lines[pos];
      if (l.blank) { collected.push(""); pos++; continue; }
      if (l.indent <= parentIndent) break;
      if (baseIndent === null) baseIndent = l.indent;
      collected.push(l.raw.slice(baseIndent).replace(/\s+$/, ""));
      pos++;
    }
    while (collected.length && collected[collected.length - 1] === "") collected.pop();
    let out;
    if (style === "|") {
      out = collected.join("\n");
    } else {
      // Folded: blank lines become paragraph breaks, other newlines become spaces.
      out = collected.reduce((acc, line, i) => {
        if (i === 0) return line;
        if (line === "" || collected[i - 1] === "") return acc + "\n" + line;
        return acc + " " + line;
      }, "");
    }
    return chomp === "-" ? out.replace(/\n+$/, "") : (style === "|" ? out + "\n" : out);
  }

  function parseBlock(indent) {
    skipBlanks();
    if (pos >= lines.length) return null;

    if (lines[pos].content.startsWith("- ") || lines[pos].content === "-") {
      const arr = [];
      for (;;) {
        skipBlanks();
        if (pos >= lines.length || lines[pos].indent !== indent) break;
        if (!(lines[pos].content.startsWith("- ") || lines[pos].content === "-")) break;
        const item = lines[pos].content.replace(/^-\s*/, "");
        pos++;
        if (item === "") {
          // `-` alone: a nested block belongs to this item.
          skipBlanks();
          arr.push(pos < lines.length && lines[pos].indent > indent ? parseBlock(lines[pos].indent) : null);
        } else {
          arr.push(scalar(item));
        }
      }
      return arr;
    }

    const obj = {};
    for (;;) {
      skipBlanks();
      if (pos >= lines.length || lines[pos].indent !== indent) break;
      const { content } = lines[pos];
      if (content.startsWith("- ")) break; // a list at this level ends the map
      const ci = content.indexOf(":");
      if (ci === -1) throw new Error(`yaml: expected 'key: value' at: ${content}`);
      const key = content.slice(0, ci).trim().replace(/^["']|["']$/g, "");
      const rest = content.slice(ci + 1).trim();
      pos++;
      const bs = rest.match(BLOCK_SCALAR);
      if (bs) {
        obj[key] = readBlockScalar(bs[1], bs[2], indent);
      } else if (rest === "") {
        skipBlanks();
        obj[key] = (pos < lines.length && lines[pos].indent > indent) ? parseBlock(lines[pos].indent) : null;
      } else {
        obj[key] = scalar(rest);
      }
    }
    return obj;
  }

  skipBlanks();
  const root = parseBlock(pos < lines.length ? lines[pos].indent : 0);
  skipBlanks();
  if (pos < lines.length) {
    throw new Error(`yaml: unexpected indentation at line: ${lines[pos].content}`);
  }
  return root ?? {};
}

import { readFileSync } from "node:fs";
export function loadYaml(path) { return parseYaml(readFileSync(path, "utf8")); }
