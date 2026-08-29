A script can tell you a field is empty. It can't tell you a name is wrong.

While expanding geo-kids from 100 to 195 countries, I wrote a little validation script to check the data — no dependencies, just Node reading files, making sure every country had all its fields and no code was duplicated. It's genuinely useful. It also completely missed a bunch of real bugs.

Albania was just... missing. An entire country, silently absent, and nothing complained because nothing knew to look for it.

Kiribati's capital was wrong in Hebrew. So was Seychelles. Bamako and the Central African Republic had names that were technically words but not the right words — the kind of mistake a native Hebrew speaker catches in one second and a validator never will, because it doesn't know what "right" sounds like.

That's the part of QA nobody automates well. Schema checks catch structure. They don't catch "this is wrong but grammatically fine." For that you still need a human who actually knows the language reading every single line.

#qa #manualtesting #hebrew #geokids
