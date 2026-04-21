# Content Schema Reference

All session content is markdown with YAML frontmatter. The validator (`scripts/validate-content.mjs`) enforces this schema.

## Session File Schema

**Path pattern:** `content/modules/<NN-module-slug>/<lang>/<NN-session-slug>.md`

**Required frontmatter fields:**

| Field | Type | Notes |
|---|---|---|
| `module` | integer | 1–99 |
| `session` | integer | 1–99 within the module |
| `slug` | string | lowercase kebab-case, matches filename without `NN-` prefix and `.md` |
| `title` | string | display title in the session's language |
| `duration_min` | integer | 5–20 |
| `default_mode` | string | One of `A`, `B`, `C` |
| `lang` | string | One of `en`, `he` |
| `glossary_terms` | list of strings | Each must exist in `content/glossary/<lang>.md` as an H2 heading |
| `prereq_sessions` | list of strings | Session slugs that must be completed first; empty list `[]` if none |

**Required body sections (H2, in order):**

1. `## Hook`
2. `## Core idea`
3. `## Show me`
4. `## Your turn`
5. `## Wrap-up`

## Module File Schema

**Path:** `content/modules/<NN-module-slug>/<lang>/module.md`

**Required frontmatter:**

| Field | Type | Notes |
|---|---|---|
| `module` | integer | |
| `title` | string | |
| `summary` | string | 1–2 sentences |
| `lang` | string | `en` or `he` |

**Required body sections:**

1. `## Overview`
2. `## Go Deeper` — must contain at least 3 markdown list items, each with a link.

## Glossary File Schema

**Path:** `content/glossary/<lang>.md`

Each entry is an H2 heading (the term, exactly as referenced from session frontmatter) followed by a single paragraph (the definition, one or two sentences).

## Parity Rule

For every `content/modules/<module>/en/<file>.md` there MUST be a corresponding `content/modules/<module>/he/<file>.md`, and vice versa. The validator fails if parity is broken.
