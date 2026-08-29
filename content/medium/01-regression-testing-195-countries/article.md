# What 195 Countries Taught Me About Regression Testing

### A side project for my kids turned into the clearest lesson on data integrity I've had in twenty years of QA

I didn't set out to write an essay about regression testing. I set out to add more countries to a geography game.

A few years ago I built a small web app for my kids — vanilla JavaScript, no framework, no build step, just HTML, CSS, and a big array of country data. You see a flag, you guess the country, you learn the capital, a fun fact, maybe something about the local language. It started with 100 countries. My older one got bored of guessing the same 100 flags in the same rotation, so I decided to expand it to all 195 UN-recognized countries.

That decision, which sounded like an afternoon of data entry, turned into the best case study I've had in years for why regression testing is not a phase you finish. It's a discipline you either have or you don't, and it doesn't care whether your "production system" is a Fortune 500 platform or a hobby project running on GitHub Pages for an audience of two children.

## The array that could silently lie to you

Every country in the game lives as one object in a big array: a code, a name in Hebrew and English, a capital, a continent, population, language, a landmark, a fun fact. The `code` field is an ISO alpha-2 country code, and it does double duty — it's also what builds the URL for the flag image. Get South Korea's code wrong and you don't get an error. You get a flag. Just the wrong flag. The page loads fine. Nothing crashes. Your test suite, if you're checking "does an image render," passes with flying colors while showing your kid the flag of the wrong country and confidently telling them it's correct.

That's the part that stuck with me. In twenty years of testing software, the bugs that scare me most were never the ones that threw an exception. Those get caught, logged, escalated, fixed before lunch. The bugs that scare me are the ones that produce a plausible, well-formatted, entirely wrong answer. A 500 error is honest. A wrong flag rendered with total confidence is a liar. And liars are exactly what silently corrupt data does at any scale — whether it's a country code, a currency conversion, or a customer's shipping address.

## Building the safety net before I trusted myself

Going from 100 countries to 195 meant touching data by hand, batch by batch, continent by continent — Africa, then Oceania, then the Americas, then back to clean up Europe. I am not a careless person, but I am a person, and doing repetitive structured data entry across nearly 200 records guarantees mistakes. I have caught myself doing this exact thing at work: an engineer swears the data is clean because they "were careful," and careful is not a testing strategy. It's a feeling.

So before I trusted my own eyes, I wrote a small Node script — no dependencies, just the standard `fs`, `path`, and `vm` modules — that walks the entire country array and checks two boring, essential things: does every entry have every required field, and is every country code unique. Later I extended it to also cross-check the difficulty tiers defined separately in the game's HTML against the actual country list, so a country couldn't quietly vanish from every difficulty level, or get duplicated across two of them, without the script screaming about it.

This is the same principle I push on every QA team I've managed: cheap, deterministic checks that run every single time, checking the boring invariants that humans stop noticing after the tenth review pass. Nobody gets excited about "does every record have a capital field." But that's exactly the kind of check that catches the bug nobody would have thought to look for, because it's not interesting enough to think about on purpose.

## The bugs the script couldn't see

Here's the honest part: the validation script caught structural problems, but it didn't catch a missing Albania entry sitting quietly at the wrong array boundary. It didn't catch a broken hyphenation in a Hebrew sentence that made a fact read strangely. It didn't know that Kiribati's capital, South Tarawa, had the wrong Hebrew transliteration, or that Seychelles and the Central African Republic's capital, Bamako's neighbor to explain properly, had names a native Hebrew speaker would wince at on sight.

Those were caught by reading. By me, sitting there, reading almost 200 entries out loud to see if they sounded like something an adult would actually say to a curious seven-year-old. A script checks that a field is not empty. A script does not know that "not empty" and "correct" are different claims entirely. This is the argument I've made in performance reviews for junior testers who want to automate everything on day one: automation checks what you tell it to check, and the gap between "what I told it to check" and "what actually matters" is where your worst bugs live.

## Regression discipline is a habit, not a milestone

The part of this project I'm proudest of isn't the count of 195. It's that I re-validated after every batch. I didn't write all the new country data and then run one big check at the end hoping for the best. Africa went in, got validated, got reviewed. Oceania went in, got validated, got reviewed. This is unglamorous and it is also the entire difference between a data set you can trust and one you're crossing your fingers about.

I see teams skip this constantly, and I understand why — validating in small increments feels slower than doing one triumphant final pass. It isn't slower. It's faster, because a bug caught in a batch of thirty entries takes minutes to isolate. A bug caught in a merged set of 195 takes an afternoon of bisection, assuming you notice it at all before your five-year-old does, mid-game, asking why the capital of a country he's never heard of is spelled in a way that "sounds funny, abba."

Scale doesn't create the need for discipline. It just makes the absence of discipline more expensive. A 195-row array and a 195-million-row production database fail the same way when nobody's checking: quietly, plausibly, and right in front of the person who trusted the number on the screen.
