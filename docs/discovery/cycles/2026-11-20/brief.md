# Discovery brief: 2026-11-20 (first cycle)

## Decisions we need from you
1. **Restart December by hand?** Text the Spain host this weekend; you draft the Dec 12 meal for them to review and send by Dec 5 (or send it yourself as co-host with their OK). **We recommend yes.** It is the single biggest lever on the outcome (E1).
2. **Fix the two trust problems now?** (a) Stop login tokens reaching Mixpanel (an S-sized code change), (b) set the Supabase service-role key in Netlify, then apply the 005 lockdown in that order. **We recommend yes to both, this week.**
3. **Pause new member features until Dec 12 has run?** **We recommend yes.** Spend the next three weeks on the rhythm and on answering people who are waiting.

**Outcome**: households gathering: **1 of 22 at the Sep gathering, 0 in Oct and Nov**, because no meal went out. Baseline cycle, so no week-on-week change yet.

## Ready to build (validated or de-risked)
| Bet | Upside | Confidence + evidence | Residual risk + mitigation | Cost |
|---|---|---|---|---|
| Stop tokens reaching Mixpanel (send paths without tokens, strip query strings, turn off or mask session replay) | Trust for every host and member | 0.9: verified in code (`autocapture: true`, `record_sessions_percent: 100`, tracked `path` includes `/host/<token>`) and in event data | Low: analytics lose nothing we use. Rotate host tokens later if needed. | S |
| Service-role key in Netlify, then apply 005 | Closes open database policies | 0.9: edge logs show production runs as `anon`; all tables have open policies | Applying 005 first would take the site down. Stage it: set key → redeploy → confirm in logs → apply 005 | S |
| Upgrade Next.js to a patched release | Removes reachable advisories | 0.8: `npm audit` critical on `next@16.2.7` | Regression risk; test the member, host and start flows | M |

## Ready to test (needs your OK)
| Bet | Riskiest assumption | Experiment | Threshold (set now) | Kill switch | Duration |
|---|---|---|---|---|---|
| **Restart Dec 12** | The host stalled on effort, not willingness | You draft, host reviews and sends (E1) | Meal out ≥ 5 days early, < 5 min host effort, **≥ 5 of 22** gather | Stop if the host is uneasy; ask what would help | Text by Nov 24 → read Dec 15 |
| **Host headcount** | Host will answer a one-line text | Text the day after each gathering (E2) | A number within 48 h, twice | n/a | 2 gatherings |
| **Answer everyone waiting** | The Kosovo host is still interested | Call this week; answer the 2 June join requests (E3) | First gathering agreed within 60 days, or close kindly after 14 days' silence | n/a | 2 weeks |
| **"Talk to Landon first"** on Start a Group | People leave because they're unsure, not uninterested | Flagged link that emails you and counts taps (E4) | ≥ 5 taps from the next 40 real visitors | Flag off | 30 days |

## Customer problems we found
- **Hosts**: sending the monthly meal is the hardest job in the product: a blank 9-field "New kit" form every month, no reminder, no draft or preview. Meals went out 10, 4, 2 and 1 day before the gathering, then stopped; the host's dashboard visits stopped in October. The host screens then show every missed month ("No meal sent" ×10, "Meal not sent" in rust on every tab, "0/2 opened").
- **Members**: after two silent months they can't tell whether the group is still meeting or what to cook; last month's meal sits at the top of Home. Only 1 member has ever marked "We gathered". The group is spread across 8 cities in 4 states, so real gatherings may happen without the app.
- **People who raised a hand**: a host has waited ~5 months (with a complete first meal drafted on day one); 2 join requests from June were never answered. The admin notice goes to one inbox with unchecked send errors and no reminder; the waiting host saw a normal dashboard and was promised an approval email the code never sends.
- **Prospective hosts**: 49 people viewed Start a Group, 0 submitted, 3 typed anything. About 16 questions over 4.5 phone screens, the country isn't carried over from a country page, and the form says "immediately" while the confirmation says "review". Interest is rising (17, 15, 10 visitors in Sep–Nov).

## Risks and health
- **High**: login tokens in Mixpanel with 100% session replay; production on the anon key with open policies (see Ready to build).
- **Medium**: email failures go unnoticed (several send paths ignore Resend errors, the hourly loop never retries, `kit_email_sent` counts attempts not deliveries); approve links are GETs that mail scanners can click; no unsubscribe link; local/test builds write to the production database and Mixpanel (including the 300+ writes from testing on Nov 19).
- **Fine**: public pages 200 in < 0.7 s; admin and cron endpoints refuse without credentials; the hourly loop ran 24/24 hours (sent nothing: automatic emails are off).

## Research for you (≤ 30 min)
- A 3-question text to the Spain host, a 5-question anonymous member survey, and a 15-minute call script for the waiting host: exact wording in `product.md` §5.
- A 5-second test of the "meal ready to send" mockup with the host: `mockup-host-meal-ready.html`.

## Parked, and why
- Sending the app email, promoting chat, eating together and photos: nothing to come back to until a meal goes out; re-measure after Dec 12.
- Pre-drafted meal library, host reminder emails, admin queue, short Start a Group: promising, but each waits on what E1 and E3 teach us about *why* things stalled.

---
Full notes: `evidence.md`, `product.md`, `design.md` (friction log, 25 rows), `engineering.md` (instrumentation gaps G1–G9, experiment safety), mockups `mockup-host-meal-ready.html` and `mockup-start-honest.html`.
