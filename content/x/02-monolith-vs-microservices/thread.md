Everyone tells you microservices will make testing harder. Nobody tells you exactly how, so you find out the expensive way, one incident at a time.

In the monolith, a bug had a home address. Something's wrong, you look at the one codebase, the one deploy, the one log stream. Annoying, but findable.

Split that same system into twelve services and the bug doesn't live anywhere anymore. It lives in the gap between two services that both, individually, swear they're doing exactly what they were told.

I call it "it works on my service" syndrome. Every team can show you a green dashboard. The system is still on fire. Nobody owns the seam where two green dashboards meet.

Contract testing helps, but it only helps for the contracts you thought to write. The failures that actually hurt me were the ones where both sides honored the contract and the contract was still wrong for the real traffic pattern.

Environment sprawl is the other quiet killer. Staging for service A is three versions behind staging for service B. You "reproduce" a bug that only exists because of that mismatch, chase it for a day, then realize it's not a bug, it's drift.

None of this means monoliths were better. It means the failure modes moved. A monolith fails loud and in one place. A distributed system fails quiet and in the space between places, and quiet failures are the ones that eat your week.

If you're moving a team from one to the other, the hardest testing conversation isn't about tools. It's convincing people that "my part works" was never actually the bar.
