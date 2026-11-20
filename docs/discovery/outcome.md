# Outcome

**North star: households gathering to pray each month.**
For each live group's most recent gathering, count the distinct members who showed any sign of gathering: said "We're in", marked "We gathered", or shared their table. Report the total and the share of members.

Why this one: Mission Table exists so believers eat and pray for the nations together. A household at the table, month after month, is the mission happening. Page views, installs and messages are only useful when they lead here.

## Input metrics (the levers)
| Lever | Measure (see `queries.sql`) |
|---|---|
| Members show up in the app | Members who opened their group page in the last 30 days (Q3, Q4) |
| They answer "Are you in?" | Answers ÷ members, per gathering (Q5) |
| They come back after | "We gathered" marks and table posts per meal (Q6) |
| The field feels close | Praying reactions and comments per field update (Q7) |
| The group talks between gatherings | Messages per week, distinct people posting (Q8) |
| People eat together | Invitations, accepted guests (Q9) |
| One tap away | Members with the home-screen app (Q10) |
| Hosts keep the rhythm | Meals sent on time, automatic emails on (Q6, Q11) |
| More tables | Groups started, join requests answered quickly (Q2, Q12) |

## Baseline (2026-11-20)
- **Sep 12 gathering: 1 of 22 members (4.5%)** showed a sign of gathering. **Oct 10 and Nov 14: 0** (no meal was sent).
- One live group (Spain), 22 members across 8 cities in 4 states; one host waiting since June.

## Measurement fixes agreed in cycle 1
- A gathering with **no meal sent counts as 0**, not as missing.
- Guard metric: **meal sent ≥ 5 days before the gathering** (last four: 10, 4, 2, 1 days, then none).
- Add a **host-reported headcount** the day after each gathering ("about how many households gathered?"). Members of a spread-out, virtual group may gather without touching the app, so app signals alone can undercount several-fold.
