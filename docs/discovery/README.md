# Discovery: how the product trio works

Mission Table has an always-on **product trio**: three Claude agents that act like a product manager, a product designer and a tech lead working together on continuous discovery.

| Agent | Owns | Main questions |
|---|---|---|
| `trio-product` (`.claude/agents/trio-product.md`) | The outcome; value and viability risk | Is this a real problem for members, hosts or future hosts? Will they want it? Does it fit the mission, Landon's time and our trust with members? |
| `trio-design` (`.claude/agents/trio-design.md`) | Usability and desirability | Can people figure it out on a phone? Does it pull them back? Does it honor the people at the table? |
| `trio-engineering` (`.claude/agents/trio-engineering.md`) | Feasibility, evidence and safety | Can we measure it? What's the cheapest safe test? What could break, leak or annoy? |

Each **cycle** (weekly, plus whenever someone runs the `product-trio` skill) they:
1. **Pull evidence**: read-only metrics (`queries.sql`, Mixpanel), health and risk checks.
2. **Look through three lenses at once**: product, design (walking the real app on a phone), engineering.
3. **Converge**: update the opportunity solution tree, score bets, judge running experiments, design new ones.
4. **Deliver** a five-minute brief as a PR (`Discovery brief: <date>`). Merging it keeps the trio's memory.

## The living documents
- `outcome.md`: what we're trying to move and how we measure it.
- `opportunities.md`: the opportunity solution tree (outcome → customer problems → solutions → assumption tests).
- `bets.md`: every candidate bet, scored and ranked.
- `experiments.md`: designs (threshold set before starting) and results.
- `decisions.md`: persevere / pivot / kill, with reasons.
- `cycles/<date>/`: evidence, each lens's notes, screenshots and the brief.

## Scoring a bet
**Score = Upside (1–5) × Confidence (0–1) ÷ Risk (1–5)**, Cost (S/M/L) breaks ties.
- **Upside**: how much the outcome moves if it works, for how many people.
- **Confidence**: how much real evidence says it works. Opinions score ≤ 0.3; a passed experiment can score ≥ 0.7.
- **Risk**: the worst plausible downside after mitigations, across the five risks below.

The five risks every bet is checked against:
1. **Value**: will members or hosts actually want it?
2. **Usability**: can they figure it out?
3. **Feasibility**: can we build and run it with what we have?
4. **Viability**: does it fit the mission, beliefs, Landon's time, cost and the law?
5. **Trust**: could it embarrass, overwhelm or expose people (privacy, guilt, spam)?

## Statuses
- **Validated**: an experiment cleared its threshold. Ready to build.
- **De-risked**: riskiest assumptions tested or mitigated; risk ≤ 2 and upside ≥ 3. Ready to build with monitoring.
- **Ready to test**: experiment designed with a threshold and a kill switch; needs Landon's OK when it touches real users.
- **Exploring**: the problem is real, the solution isn't clear yet.
- **Parked**: low score or off-mission.

## Ground rules
- The repo is public: aggregates and roles only, never personal data or member links.
- Read-only on production. The trio never changes data, settings or deploys, and never contacts members or hosts.
- Nothing merges without Landon. Prototypes live on branches behind flags that default off.
- Cheapest test first: data you already have → a mockup or 5-second test → a fake door → a concierge trial with one host → a flagged rollout to one group.
