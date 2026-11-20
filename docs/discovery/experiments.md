# Experiments

Each experiment states its success threshold **before** it starts. Designs from cycle 2026-11-20; details in `cycles/2026-11-20/` (product §4, design §4, engineering §5).

## Proposed (need Landon's OK; none touch real users until approved)

### E1. Restart the December gathering by hand (bet 2)
- **Hypothesis**: if the host only has to review and send a meal Landon drafted, the December meal goes out on time and members come back.
- **Riskiest assumption**: the host stalled on effort, not on willingness or life circumstances.
- **Method**: concierge. Landon texts the host first; drafts the Dec 12 meal; host reviews and sends (or OKs Landon sending as co-host) by Dec 5.
- **Audience**: Spain (22 members).
- **Success threshold**: meal sent ≥ 5 days before Dec 12, host effort < 5 minutes, and **≥ 5 of 22 members** show a gathering sign (or the host reports ≥ 5 households).
- **Measurement**: Q5/Q6 in `queries.sql`; kit → member opens funnel in Mixpanel; host headcount (E2).
- **Kill switch**: if the host isn't comfortable, stop and ask what would help instead.
- **Dates**: text by Nov 24; meal out by Dec 5; read results Dec 15.

### E2. Host headcount text (bet 4)
- **Method**: the day after each gathering, Landon texts the host "About how many households gathered?".
- **Threshold**: a number back within 48 hours, 2 gatherings in a row.
- **Measurement**: logged by hand in `decisions.md` (count only).

### E3. Call the waiting host (bet 5)
- **Method**: Landon calls or emails the Kosovo host this week (call script in product §5); answers the 2 June join requests.
- **Threshold**: host agrees a first gathering within 60 days; otherwise close the group kindly after 14 days without reply.

### E4. "Talk to Landon first" on Start a Group (bet 7)
- **Method**: fake door / concierge behind a flag: a link that opens an email to Landon and records a tap.
- **Threshold**: ≥ 5 taps from the next 40 real visitors (≥ 12%) within 30 days.
- **Kill switch**: flag off; remove link.

## Running
_None yet._

## Finished
_None yet._
