# Product lens: 2026-11-20 (first cycle)

**The decision I want from Landon this week:** restart Spain's rhythm for **Dec 12** (kit out by **Dec 5**) and answer the Kosovo host. Both are things you can do yourself, by hand, in under two hours. No new features until the Dec 12 gathering has run.

**One-line read of the evidence:** we have a stalled loop, not a missing feature. The host's kits came later each month (10 → 4 → 2 → 1 day before the gathering) and then stopped. No October or November kit, no field update since September, no join requests since September, and the host dashboard had 0–1 visitors a month. Eight member features shipped into that group this week. All of them depend on a monthly kit that isn't going out.

Facts are marked (F), interpretations (I), guesses (G). With 22 members, one person is 4.5%.

---

## 1. Outcome check

**Is "households gathering to pray each month" the right north star?** Yes on direction. It is the mission, and it can't be gamed with page views. Keep it. With one live group, though, it measures **one host's rhythm**, and it currently measures it badly. Three fixes:

| Gap | Why it matters | Fix (cheap first) |
|---|---|---|
| **No kit, no gathering on record.** Oct and Nov have no kit row, so the metric silently reads "no data" when the truth may be "the group didn't meet". | It hides the most important failure. | Count a month with no kit as **0**. Add a guard metric: **live groups that sent their kit ≥5 days before the gathering**. Today that's 0 of 1 for Oct, Nov and (so far) Dec. |
| **App signs undercount real gatherings.** All 4 "We gathered" marks ever recorded came from **1 member** (F). The group is set up as "virtual", has an external chat link (F), and its 22 members live in 8 cities across 4 states (the largest cluster is 11 people in one city) (F). People may gather and pray without touching the app. | The baseline could be wrong by 10×. We can't tell whether the group is dying or just not tapping buttons. | **Host-reported headcount**: one text after each gathering ("How many households were at a table?"). North star = the larger of app signs and host headcount, with both reported. |
| **Members ≠ households.** A membership row is a person. Couples may be one row or two. | Inflates or deflates the share. | Ask in the member survey (section 5). Report "members" until we know. |

Also: member visits are tracked only since Nov 17, RSVPs only since this week, and automatic emails are off. So most input levers have **no baseline yet**, not a bad one.

**Baseline (Spain, the only live group):**
- Most recent gathering with a kit (Sep 12): **1 of 22 members (4.5%)** showed a sign of gathering.
- Oct 10 and Nov 14: **0** (no kit sent).
- Dec 12 so far: 1 "in", a test answer by the co-host. Real baseline: 0.
- Kit email → member opens the group page within 7 days: 5 of 20 (25%).
- Supply: 1 live group, 1 pending for ~5.5 months, 0 tracked Start a Group submissions from 49 viewers. The database confirms no submissions since June, so this is not a tracking bug (F).

---

## 2. Opportunity solution tree (draft)

```
Households gathering to pray each month
├─ O1 Host: "Life on the field got full and the monthly kit slipped."
├─ O2 Member: "I didn't know if we were still meeting, or when."
├─ O3 Raised hands: "I asked to join / start a group and nobody got back to me."
├─ O4 Prospective host: "I'd love a table for my country, but a year of hosting feels like a lot to sign up for alone."
├─ O5 Member: "I want to know our prayers reach real people."
└─ O6 Member: "I'd like to feel part of the group between gatherings."
```

**O1. Host: "Life on the field got full and the monthly kit slipped."**
- Evidence: kits went out 10, 4, 2 and 1 day before the gathering, then none for Oct and Nov (F). Field updates: Aug 1, Sep 1, then 0 (F). Host dashboard: about 1 unique visitor a month, 0 in October (F; may be the co-host). Automatic emails were never turned on (F). *Why* it slipped is a guess (G): time, energy, unclear expectations, or the host thinking someone else had it.
- Confidence the problem is real: **high**. Confidence in the cause: **low**.
- Solutions: (a) co-host sends the Dec kit by hand after asking the host; (b) Landon pre-drafts the next 6 kits so the host only adds prayer requests; (c) the host turns on automatic emails so reminders don't depend on them.

**O2. Member: "I didn't know if we were still meeting, or when."**
- Evidence: two silent months (F). Only 25% open the kit within a week, about 20 hours after it arrives (F). No reminder or RSVP emails have ever gone out (F). No new join requests since September (F). That members feel unsure is a guess (G).
- Confidence: **medium** on the problem, **low** on the cause.
- Solutions: (a) a short "we're back on Dec 12" note from the host before the kit; (b) automatic "Are you in?" email; (c) "add all gatherings to my calendar" file.

**O3. Raised hands: "I asked to join / start a group and nobody got back to me."**
- Evidence: the Kosovo host submitted in June and is still pending (F). A complete first kit (recipe, scripture, prayer requests) was drafted for that group on the day it was submitted (F), which shows real intent at the time (I). Two Spain join requests from June were never answered (F).
- Confidence: **high**. These are facts, and the fix is in Landon's hands.
- Solutions: (a) a personal call or email this week, then approve and onboard or close kindly; (b) a 7-day answer promise for start requests, with a weekly admin reminder.

**O4. Prospective host: "I'd love a table for my country, but a year of hosting feels like a lot to sign up for alone."**
- Evidence: 49 people viewed `/start` in 6 months with 0 submissions (F). Monthly unique `/start` viewers rose from 1–5 (Jun–Aug) to 17, 15 and 10 (Sep–Nov) (F), some of whom may be Landon testing. The quote is a guess (G): we have never asked a single viewer why they left.
- Confidence: **low**. The interest is real; the reason is unknown.
- Solutions: (a) "Not ready? Ask Landon a question" link on `/start`; (b) Landon personally invites 5 missionary families or churches and offers to set the group up for them (the PRD's own growth plan is invite-driven); (c) a "try one month first" option.

**O5. Member: "I want to know our prayers reach real people."**
- Evidence: 2 field videos in total, with 1 praying reaction and 0 comments (F). Thin.
- Confidence: **low**.
- Solutions: (a) one 60-second phone video from the field before Dec 12; (b) Landon reposts a paragraph from the host's prayer letter, with permission.

**O6. Member: "I'd like to feel part of the group between gatherings."**
- Evidence: none yet. Chat, invitations, photos and the app have 0 use in 3 days (F), and the only visitors were the co-host testing. With half the members in one city, eating together is plausible (I).
- Confidence: **very low**. This opportunity was led by features, not by evidence.
- Solutions: already shipped. Measure only after a real gathering cycle.

---

## 3. Candidate bets (ranked)

Score = Upside × Confidence ÷ Risk. Most confidences are opinions (≤0.3) because nothing has been tested yet.

| # | Bet | Opp | Up | Conf | Risk | Cost | Score | Status | Evidence / note |
|---|---|---|---|---|---|---|---|---|---|
| 1 | **Restart Dec 12**: text the host today. Kit (by host or co-host) out by Dec 5, plus a "we're back" note | O1, O2 | 5 | 0.35 | 1 | S | **1.75** | Ready to test | The whole north star sits on this one group. No kit means a mechanical 0. Risk stays low *only if* the host is asked first |
| 2 | **Host headcount text** the day after each gathering | measurement | 2 | 0.6 | 1 | S | **1.20** | Ready to test | Fixes the biggest measurement gap. One text |
| 3 | **Answer every raised hand**: call the Kosovo host, answer the 2 June join requests, set a 7-day answer promise | O3 | 3 | 0.3 | 1 | S | **0.90** | Ready to test | Full first kit drafted in June. 5.5 months of silence may have cooled it |
| 4 | "Not ready? Ask Landon a question" link on `/start` (mailto, behind a flag) | O4 | 3 | 0.2 | 1 | S | 0.60 | Ready to test | Rising `/start` views, 0 submissions. Doubles as a fake door to learn *why* |
| 5 | Turn on automatic emails for Spain (host's OK) so "Are you in?" goes out for Dec 12 | O2 | 4 | 0.25 | 2 | S | 0.50 | Ready to test (after #1) | Untested in production. Emailing 22 people after 2 silent months without a kit would confuse them |
| 6 | Landon personally invites 5 missionary families or churches, offering to set up the group for them | O4 | 4 | 0.25 | 2 | S–M | 0.50 | Exploring | Risk: recruiting hosts into the same wall Spain hit. Do it *after* #1 tells us why Spain stalled |
| 7 | Pre-drafted kits (Dec–May) so the host only adds prayer requests and a field note | O1 | 4 | 0.25 | 2 | M | 0.50 | Exploring | Only worth it if the host says prep time is the blocker |
| 8 | "Add all gatherings to my calendar" file | O2 | 3 | 0.15 | 1 | S | 0.45 | Exploring | Guess |
| 9 | One 60-second field video before Dec 12 | O5 | 2 | 0.2 | 1 | S | 0.40 | Exploring | Past videos drew 1 reaction |
| 10 | Send the app email / push home-screen install | O6 | 1 | 0.1 | 2 | S | 0.05 | Parked | Nothing to come back to until the rhythm runs. Adds email noise |
| 11 | Promote chat, eating together and photos | O6 | 2 | 0.1 | 2 | S | 0.10 | Parked | Measure after Dec 12, don't push |

---

## 4. Riskiest assumptions and cheapest tests (thresholds set now)

**Bet 1: Restart Dec 12**
- Riskiest assumption (value/viability): *the host still wants to run a monthly table, and what's missing is capacity, not willingness.*
- Cheapest test: the 3-question host text (section 5), sent by Nov 23.
- Success: the host replies within 72 hours, the Dec kit is out by **Dec 5**, and **≥5 of 22 members** show a gathering sign (in, gathered, or table post) **or** the host reports **≥5 households**.
- Kill or pivot: no reply in 7 days, or the host says they can't continue. Then Landon decides whether to run Dec as interim host or pause the group gracefully with a note to members. ≤2 signs and ≤2 households with a kit sent on time means members, not the host, are the problem: pivot to O2.

**Bet 2: Host headcount**
- Riskiest assumption: *the host will answer with a number, reliably.*
- Test: one text on Dec 13.
- Success: a number within 48 hours. If headcount ≥3× the app signs, adopt "larger of the two" as the official north star.

**Bet 3: Answer raised hands**
- Riskiest assumption: *the Kosovo host still wants to host after 5 months of silence.*
- Test: the call script in section 5, this week.
- Success: they agree to a first gathering date within 60 days. Then approve and onboard. No reply in 14 days: close kindly and log it in `decisions.md`.
- The 2 June join requests get a kind yes or no within 48 hours, with no threshold. It's simply owed.

**Bet 4: "Ask Landon a question" on `/start`**
- Riskiest assumption: *`/start` viewers are real prospective hosts held back by doubt, not browsers or internal testing.*
- Test: first exclude internal traffic in Mixpanel, then ship the flagged link.
- Success: **≥3 questions from ≈30 real viewers (10%) within 30 days, and ≥1 turns into a call.**
- Kill: 0 clicks in 30 days. Then the problem is upstream (traffic quality), not the form.

---

## 5. Research Landon can run in ≤30 minutes

**A. Text to the Spain host (3 questions, about 5 minutes).** Send before anything else.
> Hi! Thinking of you all and praying for your work. Three quick questions about Mission Table, and no pressure at all:
> 1. Honestly, how are you doing with capacity this season? Is hosting the monthly table still something you want, or would it help if I carried more of it for a while?
> 2. When the kit went out each month, what took the most time or felt hardest?
> 3. Would you like me to send the Dec 12 kit this time (you'd just send me 2–3 prayer requests from the field)? And are you OK with me turning on the automatic "Are you in?" reminder emails?

**B. Member micro-survey (5 questions, anonymous form, sent by the host or co-host).** Opening line: "No wrong answers and no guilt: we want Mission Table to fit real life."
1. Since June, how many Mission Table gatherings has your household been part of? (0 / 1 / 2 / 3 / 4+)
2. When you do gather, how? (At home with my household / with others from the group / on a call / we haven't yet)
3. How many people are in your household at the table? (1 / 2 / 3–4 / 5+)
4. Where do you mostly hear from the group now? (Email / the Mission Table app / the group's text chat / I haven't heard much lately)
5. What would most help you be at a table on Dec 12? (A reminder the week before / the recipe earlier / someone nearby to eat with / hearing from the field / honestly just a busy season / other: ___)

Success for the survey itself: ≥8 of 22 responses in 5 days.

**C. Call script for the pending Kosovo host (15 minutes).**
1. *Own it:* "I'm sorry. You signed up in June and I never got back to you. That's on me, not you."
2. "Is a Kosovo table still on your heart, or has the season changed?" (If changed: thank them, ask if they'd like to join or co-host another table instead, and close kindly.)
3. "Who would be around your table? Roughly how many households, and are they in one place or spread out?"
4. "You drafted a first kit back in June. What would make the monthly kit easy to keep up for a year?"
5. "Do you have a contact in Kosovo who could send prayer requests each month? If not, I'll do my best to connect you."
6. *Next step:* "If you're in, I'll approve the group today and we'll pick a first gathering date together. Does a date in January or February work?"

Log only aggregates in the repo: still interested or not, expected households, first date.

---

## 6. Decisions I need from Landon

1. **Who sends the Dec 12 kit, and when?** My recommendation: text the host today (5A). If there's no clear yes within 72 hours, you send it as co-host by Dec 5, and turn on automatic emails only with the host's OK.
2. **Kosovo: approve and onboard, or close?** My recommendation: call this week (5C), approve if they're still in, and adopt a **7-day answer promise** for every start and join request from now on.
3. **Feature freeze until the Dec 12 gathering has run, and count host headcount in the north star.** My recommendation: yes to both. The constraint is the monthly rhythm and the number of live groups, not member features. Spend the next three weeks on bets 1–3, then judge the shipped features against a real gathering.
