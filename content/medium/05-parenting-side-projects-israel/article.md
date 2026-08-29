# What My Kids Taught Me About Product Thinking

### On building a geography game for them, staying hands-on after moving into management, and working in Israeli tech through a hard stretch

My first version of the difficulty levels was, I thought, obviously correct. Five tiers, roughly thirty countries each for the first three, five each for the last two, all sorted by population. Bigger countries, easier tier. Smaller countries, harder tier. It's a clean, objective, defensible way to rank 195 things. I was proud of it for about a week, which is how long it took my son to get thoroughly stuck on a "beginner" flag because the country in question, despite having a huge population, was one he had simply never heard of.

That was the moment I actually understood something I'd been telling engineers for years without fully living it myself: your most objective number is not automatically the right proxy for the thing your user actually experiences. Population is a real, measurable, indisputable fact about a country. It has almost nothing to do with whether a seven-year-old recognizes it. I rebuilt the tiers from scratch around actual kid-recognizability instead — roughly even groups of about thirty-nine countries each — and the game got noticeably better within a day, not because the data changed, but because I'd finally measured the right thing.

## Building something with your kids changes what "user" means

I've spent my whole career being the person who asks "but what does the user actually experience," usually in a meeting, usually about someone else's feature. Building geo-kids put me on the other side of that question in the most literal way possible, because my users were sitting next to me on the couch, telling me in real time, with zero patience for hedging, exactly where the product failed them. A seven-year-old will not write you a polite bug report. He'll just stop playing and ask for something else, and if you're paying attention, that's the most honest quality signal a product manager will ever get.

It also recalibrated my patience, which I did not expect. Watching a six-year-old get something wrong four times in a row, and needing me to explain the same thing a fifth time without any trace of frustration in my voice, turns out to be excellent training for managing a junior engineer through their fifth wrong assumption about a bug, or for staring at a flaky test failure for the sixth time without deciding the whole suite is cursed. Patience with a small child and patience with imperfect software or imperfect people draw from the same well. I didn't know that until I had to refill it nightly.

## Staying hands-on after the title changes

Somewhere along the way in a testing career, if it goes reasonably well, you stop testing and start managing the people who test. That's a real and necessary shift, and I don't regret making it. But there's a specific kind of dullness that creeps in when the last time you actually built something end to end, alone, with your own hands, was years ago — and I think a lot of engineering managers feel this without naming it.

Building geo-kids alone, with no framework, no build step, no team to delegate the boring parts to, forced me back into the actual texture of the work: writing the validation script myself, fixing my own hyphenation bug, discovering my own bad assumption about the difficulty tiers because there was nobody else to catch it for me. It reminded me, concretely, what I'm actually asking my team to do every day, and it's made me a noticeably more useful manager, because I have fresh, specific memories of exactly where the tedious parts of quality work actually live, rather than an increasingly abstract idea of it from a few years back.

## Doing this while the country is not okay

I want to write about this honestly rather than skip past it, because it's been part of the backdrop the entire time I've been building this. I've been adding countries to a children's geography game, one at a time, choosing kind and warm descriptions of places most of them will never visit, during a period when Israel has been going through one of the hardest stretches in its recent history. Reserve duty has pulled colleagues out of sprints with a few days' notice, sometimes for weeks at a stretch, and the team simply absorbs it, because that's what you do here. Meetings get rescheduled around miluim call-ups the way other workplaces reschedule around a doctor's appointment — routinely, without much drama, because everyone's had it happen to them or is bracing for it to.

There's something I can't fully explain about spending evenings building a small, gentle thing for my kids — a game about the flags and capitals and languages of the whole world — while the news in the background is what it's been. I don't think it was escapism, exactly. It felt more like a stubborn insistence on building something anyway, something calm and correct and cared-for, in a period when a lot of things around it weren't any of those. My kids don't know that context. They just know Kiribati has a flag with a bird and a sunrise on it, and that's exactly as it should be.

## The actual lesson

If there's a single thread through building this thing with my kids, it's that the discipline I bring to work — checking your assumptions, reading the actual data instead of trusting the field's presence, re-validating after every change, being honest about what you don't know yet — isn't a professional posture I put on for the office. It's just how I think, and it turns out to be exactly as useful for a Wednesday night side project about flags as it is for a testing strategy at scale. The tools transfer. So does the patience. I'm grateful for both, especially this year.
