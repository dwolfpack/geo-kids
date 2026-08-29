My daughter asked me why Kiribati's flag looked "wrong" in the geography game I built for her. It wasn't wrong. It was Tuvalu's flag. I'd typo'd a two-letter country code.

That bug taught me something I already knew but needed re-taught: the scariest bugs don't crash anything. Nothing threw an error. Nothing logged a warning. The app loaded a real flag from a real image URL and rendered it perfectly. It was just the wrong flag, sitting there, confidently, looking exactly as correct as the right one would have.

This is the whole case for manual and exploratory testing, and it's why I've never bought the idea that it's just "the step before you automate it." A script checking that flag would only catch the bug if you already knew to write an assertion for "is this the correct flag for this specific country," which means you already knew about the bug before you looked for it. What actually caught mine was a six-year-old looking at a picture and going "that's not right."

Automated checks are great at confirming what you already suspect. They're terrible at surfacing what you never thought to ask. Exploratory testing is the discipline of poking at a system with no script in hand, just curiosity and a bit of domain knowledge, until something feels off. It's undervalued because it doesn't produce a green checkmark. It produces a shrug, or a "huh, wait," or a kid pointing at a screen.

Nineteen years in QA and the bugs I remember most aren't the ones a test suite caught. They're the ones a human noticed because something looked subtly, silently wrong.

What's the last "no error, just wrong" bug you caught by just looking?
