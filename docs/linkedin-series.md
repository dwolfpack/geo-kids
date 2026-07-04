# LinkedIn Series: "Building With AI, Out Loud"

**Date:** 2026-07-04 · **Status:** DRAFT — post drafts ready for Dror's voice-pass before publishing.

**Strategy:** This series is the marketing engine for the QA-for-AI chapter (see `docs/superpowers/specs/2026-07-04-qa-for-ai-career-design.md`). Arc: start with relatable "non-developer builds real things with AI" stories, gradually pivot to "…and here's what it taught me about quality," landing on the new professional positioning. Every post is a true story from this repo.

**Cadence:** 2/week (e.g., Sun + Wed, Israel time). **Language:** suggest English for reach with occasional Hebrew versions for the local market — Dror to decide. **Format rules:** first 2 lines must work before "…see more"; one idea per post; end with a question, not a pitch; no AI-hype vocabulary ("game-changer", "mind-blown").

---

## The Arc (10 posts, ~5 weeks)

### Phase 1 — Credibility through building (posts 1–4)

**Post 1 — "I'm an OD consultant. Last month I shipped four apps."**
Hook: the identity contrast. Story: geography game for the kids, vocabulary game, a Telegram bot, a CV site — no dev team, evenings only, AI pair. Point: the barrier between "people who build software" and everyone else just collapsed. Question: "What would you build if code stopped being the obstacle?"

**Post 2 — "My kids are my QA team."**
Hook: "My 8-year-old found a bug in production in 4 minutes." Story: watching kids play the Hebrew geography game; what they broke, what confused them, what a spec never captures. Point: user testing is a mindset, not a budget line. Question: who tests *your* assumptions?

**Post 3 — "The prompt that failed for 45 minutes"**
Hook: honest failure post (these outperform wins). Story: a real stuck moment from our sessions — vague ask → garbage output → the fix was writing requirements like a proper brief. Point: AI didn't need better prompts, it needed better *thinking* — same as any team. (We'll pick the concrete story from session logs before publishing.)

**Post 4 — "I built a bilingual curriculum to teach my family AI"**
Hook: "The most important app I'm building has no code in the hard part." Story: the family AI curriculum — why session 3 is 'AI can be confidently wrong' and session 4 is privacy. Point: AI literacy is a family skill now; organizations are just big families. Question: does your company teach this, or assume it?

### Phase 2 — The pivot to quality (posts 5–8)

**Post 5 — "AI made me 10x faster. It made my mistakes 10x faster too."**
THE PIVOT POST. Hook above. Story: shipping fast with AI until something quietly broke; the moment I added a validator script that now blocks every bad file. Point: velocity without verification is just speed toward the cliff — introduce the AI-SDLC quality gap. Question: "Your team ships 3x more code since Copilot. Did your review process change at all?"

**Post 6 — "A 100-line script reviews my content better than I do"**
Story: `validate-content.mjs` — contracts (schema), automation (CI-able), bilingual parity checks. Point: quality = explicit contracts + relentless automation, and AI makes writing those guards nearly free. This is QA thinking applied to *content*, showing the discipline transfers anywhere.

**Post 7 — "How do you test something that answers differently every time?"**
Hook: the question every team with an LLM feature is quietly avoiding. Story: designing evals for my own bot's answers (golden questions, LLM-as-judge, catching a model-upgrade regression). Point: introduce evals in plain language — determinism died, confidence didn't have to. *(Depends on building the eval demo — asset #2 in the career design. Reorder if needed.)*

**Post 8 — "QA people: AI isn't coming for your job. It's coming for your job description."**
Story/point: what QA becomes in the AI-SDLC — from gatekeeper to eval engineer, risk analyst, quality coach. The org-design angle nobody else covers (OD muscle on display). Question: "QA folks — what's changed in your day since AI tools arrived?"

### Phase 3 — The new chapter (posts 9–10)

**Post 9 — "What 20 years of watching organizations change taught me about AI adoption"**
The synthesis post: OD lens on AI rollouts — why tool adoption fails without role clarity, psychological safety around 'AI wrote my code', and metrics that don't punish honesty. Positions the three-way intersection explicitly.

**Post 10 — "My next chapter: helping companies ship AI-speed software they can trust"**
The announcement. Recap the journey (posts 1–9 in three sentences), name the offer (fractional AI-quality leadership / AI-SDLC audit), one concrete example of what an engagement looks like, clear CTA: "If your team is shipping faster than it can verify — my DMs are open."

---

## Ready-to-post draft: Post 1

> I'm an organizational consultant. Last month I shipped four working apps.
>
> No dev team. No budget. Evenings, after the kids went to bed.
>
> A geography game in Hebrew, because my kids kept asking about flags.
> A vocabulary game with islands and sticker books.
> A Telegram bot our family actually talks to.
> This site you're reading my CV on.
>
> I didn't learn to code. I learned to work with an AI that codes — which turns out to be a completely different skill: describing what you want precisely, checking what you got skeptically, and knowing when "done" isn't.
>
> Sound familiar? It's the same skill we've always called good management.
>
> The wall between "people who build software" and the rest of us didn't get lower this year. It fell.
>
> What would you build if code stopped being the obstacle?

*(Drafts for posts 2–10 will be written one week ahead of publishing so they include the freshest real material — several depend on artifacts we're building, e.g. post 7 needs the eval demo.)*

---

## Operating notes

- **Truth rule:** every post is a real, checkable story from this repo. Nothing invented.
- **Family privacy:** kids never named, no faces, no school details — consistent with our own curriculum's session 4.
- **Engagement:** Dror replies to every comment in the first 2 hours (LinkedIn's algorithm window); we can draft reply talking-points per post.
- **Measurement:** track per post — impressions, comments from target roles (VP Eng, QA leads, CTOs), DMs, profile views. Posts 5–8 comments are a *lead list*.
- **Repurposing:** each Phase-2 post later becomes a section of the "Confidence at AI Speed" one-pager and workshop deck.
