Exploratory testing gets treated like the warm-up before the real testing starts. After twenty years doing it, I think it's the actual skill, and everything else is bookkeeping around it.

I just finished expanding my kids' game from 100 to 195 countries. I did it in continent-sized batches, on purpose, the same way I'd want a real feature rolled out: small chunks, validate, then move to the next chunk instead of dumping all 195 at once and hoping.

Each batch got a plan first, roughly what I'm adding and why, then a pass with my own validation script checking schema completeness and no duplicate country codes. That part's mechanical and I'm glad it's mechanical, it's not where the interesting bugs live.

The interesting bugs lived in the parts no script can see: does this Hebrew sentence read naturally, does this capital name sound right out loud, does this fact actually match the tone of the other 194 facts around it. That's judgment, not verification.

Exploratory testing, properly done, isn't "clicking around without a plan." It's forming a hypothesis about where the system is weak, based on experience, and going looking for exactly that weakness on purpose.

My hypothesis every single batch was "the small countries are where I'll be sloppy," and I was right every time.

Regression discipline mattered more than I expected on a one-person project. Every batch got re-validated before I moved to the next continent, specifically because "I'll catch it later" is how a missing Albania survives three days undetected.

QA isn't the gate before shipping. It's closer to risk communication, telling yourself or your team what you actually know versus what you're hoping is fine. On a solo side project, you're the only one who'll notice if you stop being honest about that difference.
