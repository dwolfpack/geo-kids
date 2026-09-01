---
name: humanize
description: Rewrites AI-sounding, stiff, or robotic text so it reads like it was written by a person — varying sentence rhythm, cutting hedges and filler transitions, using plainer words and contractions, trading generic claims for concrete detail, and giving the writing an actual point of view. Use this whenever the user asks to "humanize" text, make something "sound less like AI" or "less robotic," "make this sound natural," "fix the AI voice," or hands over a draft (an email, essay, post, doc, comment, or pasted paragraph — from the conversation, a file, or a clipboard paste) and asks for it to sound more human, less generic, or less like ChatGPT/Claude wrote it. Also trigger when the user pastes a chunk of writing and just says something like "can you clean this up" or "make this better" alongside cues that it currently reads stiffly or formulaically. Always preserve the original meaning, facts, and claims — this changes style, not substance.
---

# Humanize

Rewrite text so it sounds like a specific person wrote it, not a language
model. The meaning, facts, and claims in the input must survive untouched —
only the voice changes.

## Why AI writing reads as AI writing

Generated text has a recognizable fingerprint: sentences land at nearly the
same length, every claim gets hedged, transitions repeat ("moreover,"
"additionally," "it's worth noting"), the piece ends with a tidy summary
nobody asked for, and every section is exactly as long and as symmetrical as
every other section. None of that is wrong sentence-by-sentence — it's the
*uniformity* that gives it away. Real writing is lumpier: a two-word
sentence next to a long tangled one, an opinion stated flatly instead of
hedged into mush, a paragraph that's short because the point was short.

Keep that in mind rather than treating the checklist below as independent
boxes to tick — the goal is a piece that reads like one person's uneven,
committed voice, not a smoother version of the AI voice.

## What to do

1. **Read the whole input first** and identify the core claims, facts,
   numbers, and structure that must not change. If you rewrite a sentence
   and it now asserts something the original didn't (or drops something it
   did), that's a bug — fix it before moving on.

2. **Rewrite for rhythm.** Break up runs of same-length sentences. Let a
   short sentence hit hard after a longer one. Combine two robotically
   separate sentences into one when that's how a person would actually say
   it, and split an overloaded one when it's straining.

3. **Cut the hedging and filler scaffolding.** Strip phrases like "it's
   important to note that," "in conclusion," "furthermore," "additionally,"
   "on the other hand, it's worth considering." State the thing. If a
   sentence works with the hedge deleted, delete it.

4. **Use plainer words and contractions.** "Use" beats "utilize," "help"
   beats "facilitate," "don't" beats "do not." Say it the way you'd say it
   out loud to someone, not the way a policy memo would say it.

5. **Trade abstraction for detail where you can do it without inventing
   facts.** Generic phrasing ("various challenges," "a range of benefits")
   is a tell. If the input already contains a specific example, number, or
   name, foreground it instead of summarizing it away. Do not invent new
   specifics that weren't in the source — that's fabrication, not
   humanizing.

6. **Break structural symmetry.** If every paragraph is three sentences, or
   every list item is a complete parallel clause, vary it. Not everything
   needs to be a bulleted list — sometimes the human move is to just write
   the sentence. Don't force a list into prose or prose into a list if the
   structure genuinely fits the content; break symmetry where it's
   artificial, not everywhere.

7. **Let it take a position.** Flat "there are pros and cons on both sides"
   framing is an AI tell when the source material actually leans somewhere.
   If the input has a clear point of view (or you can infer a reasonable
   one without adding new claims), let the rewrite commit to it instead of
   both-sidesing everything into mush. If the input is genuinely neutral or
   the user's context gives no basis for a stance, don't manufacture one.

8. **Drop reflexive em-dash and bullet overuse.** One or two em-dashes in a
   piece read as natural; six read as a tic. Same with bullets — use them
   when a list is genuinely a list, not as a default way to present three
   sentences.

## What not to change

- Don't add information, examples, statistics, or claims that weren't in
  the source.
- Don't soften or strengthen a claim's substance — only its delivery.
- Don't change quoted material, code, names, numbers, or technical terms.
- Don't change the language the input is written in.
- If the input has a required format (an email needs a greeting and
  sign-off, a cover letter needs an address block), keep that scaffolding —
  humanize the prose inside it, not the container.

## Handling the input

- If the user pastes text directly, work with that.
- If they reference a file, read it, rewrite its contents, and either show
  the rewrite inline or write it back out — match whatever the user asked
  for (a diff, a full replacement, a new file). If it's ambiguous, ask.
- For a long document, rewrite the whole thing rather than a sample unless
  the user asked for a specific section.

## Output

Return the rewritten text plainly — no "Here's a more human version!"
preamble, no meta-commentary about what you changed unless the user asked
for that. If the user seems to want to see what changed (not just the
result), a brief note on the two or three biggest moves is more useful than
a line-by-line diff explanation.
