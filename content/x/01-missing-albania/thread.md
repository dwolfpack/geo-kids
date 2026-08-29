🧵 A country went missing from my kids' geography game and nothing told me. No error, no crash, no red text in the console. Just a hole where Albania used to be.

I was expanding geo-kids from 100 countries to all 195 UN-recognized ones. Manually. Continent by continent. Europe felt easy, I've been there, I know these countries.

Turns out "I know these countries" is exactly the confidence that gets you. I finished Europe, moved on to Africa, and three days later my daughter asked why the flag quiz skipped a red one with a black eagle.

Albania. Just not there. Not broken, not malformed, not throwing an error. Just absent, the way a name falls out of a sentence and you don't notice until someone reads it back to you.

This is the bug I've been telling junior testers about for years and apparently still needed to relearn: the scariest defects aren't the ones that crash. They're the ones that leave everything looking fine.

A script checking "does every entry have all its fields" would never have caught this, because the entry didn't exist to have fields. You can only catch an absence by knowing what should be there and counting.

So that's what I built next: a tiny validator that checks the country list against the real UN count, not against itself. Boring. Necessary. The kind of thing you only think of after you've already been embarrassed by a seven year old.

Manual testing gets treated like the thing you do before "real" testing. But a person noticing "wait, where's the eagle flag" is still the best bug detector I've ever deployed, and I've deployed a lot of things.
