// The parser is a liability if it silently misparses, so its contract is tested
// directly rather than only through the config files.
import { test } from "node:test";
import assert from "node:assert/strict";
import { parseYaml } from "../lib/yaml.mjs";

test("nested maps, scalars, and types", () => {
  assert.deepEqual(parseYaml(`
a: 1
b: 2.5
c: true
d: false
e: null
f: bare string
g: "quoted: with colon"
h:
  i: nested
  j:
    k: deeper
`), { a: 1, b: 2.5, c: true, d: false, e: null, f: "bare string",
      g: "quoted: with colon", h: { i: "nested", j: { k: "deeper" } } });
});

test("block lists, flow lists, and flow maps", () => {
  assert.deepEqual(parseYaml(`
list:
  - one
  - two
flow: [a, b, 3]
maps:
  - { tier: A, n: 1 }
  - { tier: B, n: 2, tags: [x, y] }
`), { list: ["one", "two"], flow: ["a", "b", 3],
      maps: [{ tier: "A", n: 1 }, { tier: "B", n: 2, tags: ["x", "y"] }] });
});

test("folded scalars join lines with spaces; literal ones keep newlines", () => {
  const r = parseYaml(`
folded: >-
  one
  two
literal: |-
  line1
  line2
`);
  assert.equal(r.folded, "one two");
  assert.equal(r.literal, "line1\nline2");
});

test("single quotes preserve inner double quotes", () => {
  assert.deepEqual(parseYaml(`q: '"looking for" a rate'`), { q: '"looking for" a rate' });
});

test("comments are stripped, including trailing ones, but not inside quotes", () => {
  assert.deepEqual(parseYaml(`
# leading comment
a: 1   # trailing
b: "has # inside"
`), { a: 1, b: "has # inside" });
});

test("empty inline collections", () => {
  assert.deepEqual(parseYaml(`a: []\nb: {}`), { a: [], b: {} });
});

test("malformed input throws instead of guessing", () => {
  assert.throws(() => parseYaml("a: 1\n    bad_indent_no_colon"), /expected 'key: value'|unexpected indentation/);
  assert.throws(() => parseYaml("a: {no_colon_here}"), /flow map member missing/);
});
