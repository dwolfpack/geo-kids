No script I wrote ever caught a wrong capital city name. Every single one was caught by a person reading it out loud and going "wait, that's not right."

Building geo-kids meant writing Hebrew names for 195 countries, capitals, continents, all of it. Not translated from English, actually written, because a literal translation reads like a dictionary and my kid needed something that reads like a story.

The capital of Kiribati is South Tarawa. I had the Hebrew wrong. Nothing in the data structure flags that, because from a schema's point of view, wrong-but-present looks identical to correct. Same for Seychelles. Same for the Hebrew name I had for Bamako, capital of Mali.

These aren't bugs a validator can find, because a validator only knows what "should be there" in shape, not in truth. Every field was filled in, every type was correct, every entry passed the schema check clean. And several of them were just wrong.

There's a specific kind of QA problem hiding in there: content correctness versus content completeness. My script confirms completeness beautifully. Correctness needed an actual person who reads Hebrew and has an ear for what sounds off.

I found a hyphenation bug the same way, buried in a fact sentence about a country, the kind of small break that looks fine until you read it at natural speed and it catches in your throat.

I test software for a living and I still needed a human pass, sentence by sentence, on data I wrote myself. If that's true for my own hundred and ninety five entries, it's true for whatever dataset you're trusting a script to fully cover right now.
