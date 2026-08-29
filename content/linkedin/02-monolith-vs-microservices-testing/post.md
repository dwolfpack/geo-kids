"It works on my service" is the new "it works on my machine," and it's a much harder sentence to argue with.

I've tested both worlds: the big monolith where one deploy meant one system, and the constellation of microservices where a single user action touches six teams' code before it finishes. People talk about that migration as an architecture decision. From where I sit, it's a testing strategy decision wearing an architecture costume.

In a monolith, a regression is usually visible end to end. You run the flow, something's broken, you can see the whole stack trace in one place, one team owns the fix. Painful sometimes, but honest.

Split that same flow across services and the failure mode changes completely. Each team's tests pass. Each service is "green." And the thing still breaks in production because service A changed a response field that service B silently depended on and nobody wrote a contract for. Nobody lied. Nobody skipped testing. The seam between two honest, well-tested services was the untested part.

The bugs get harder to reproduce, too. Instead of "run this one flow," it's "reproduce this specific interleaving of three services under this specific load, in this specific environment," and by the time you've got a repro, someone's already shipped the next change underneath you. Environment sprawl becomes its own QA problem: staging never quite matches prod, and "works in staging" starts meaning less every quarter.

None of this means microservices are wrong. It means the risk moves. It stops living inside the code and starts living in the handshakes between teams, and if your test strategy doesn't move with it, you'll have a hundred green pipelines and one very confused on-call engineer.

Where do most of your production surprises actually live: inside a service, or between two of them?
