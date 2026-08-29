Expanding a kids' geography game from 100 countries to all 195 UN-recognized ones sounds like a data entry task. It's not. It's a QA exercise wearing a spreadsheet costume, and it humbled me a few times.

Some of what I found while going country by country: Albania was simply missing, a whole entry that fell out somewhere between drafts, silent gap in the array, no error, just a country that quietly didn't exist in my kids' game. A Hebrew fact string had a hyphenation bug that split a word in a way that read fine in English and wrong in Hebrew. I had the wrong Hebrew name for Kiribati's capital, South Tarawa, and for Seychelles itself. I had the wrong Hebrew name for Bamako and for the Central African Republic. Every single one of these is a "a native Hebrew speaker catches this in one second, and a script never would" bug.

That last part is the real point. I wrote a small validation script that checks schema completeness and makes sure every country code is unique, because a duplicate or malformed code silently loads the wrong flag from the flag API and you'd never know. That script is genuinely useful and I lean on it constantly. It caught zero of the bugs I just listed. Not one. Because those weren't structural bugs, they were correctness-of-meaning bugs, and meaning is not something a schema check understands.

Nearly two hundred entries, each with a name, capital, continent, language, landmark, and a fact, in two languages, and the errors that mattered most were the human kind: a wrong name, a wrong word break, a fact that just wasn't quite right. Structure and truth are different kinds of correct, and you need a different tool, or a different person, for each.

How do you catch the errors that "pass" every automated check but are just wrong?
