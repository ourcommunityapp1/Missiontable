# Opportunity solution tree

Outcome → customer problems (opportunities) → solutions → assumption tests. Updated 2026-11-20 (cycle 1). Evidence is in `cycles/2026-11-20/`.

```
Households gathering to pray each month  (baseline: 1 of 22 in Sep, 0 in Oct and Nov)
│
├─ O1  Host: "Putting together the monthly meal is a big job and I fell behind."
│     Evidence: meals went out 10, 4, 2, 1 days before, then stopped (Oct, Nov). The host's
│     dashboard visits went Jul → Aug → Sep → none in Oct. "New kit" is a blank 9-field form
│     every month. No reminder exists for the meal itself.            Confidence: high (behaviour)
│     ├─ S1.1 Landon drafts December's meal for the host to review and send   ← test first (E1)
│     ├─ S1.2 Meal reminder email to the host 7 and 3 days before
│     ├─ S1.3 "Start from a previous meal" pre-fill; a library of drafted meals
│     └─ S1.4 Host home tab with one next step, no scorekeeping (design)
│
├─ O2  Member: "I don't know if we're still doing this, or what to cook."
│     Evidence: two silent months; last month's meal sits at the top of Home; 1 of 22 answered
│     "Are you in?"; automatic emails are off.                        Confidence: medium
│     ├─ S2.1 A "we're back" note with December's meal (rides on E1)
│     ├─ S2.2 Automatic "Are you in?" once the meal has gone out (host's OK)
│     └─ S2.3 "This month at a glance" for members (design)
│
├─ O3  Prospective host / member: "I raised my hand and nobody answered."
│     Evidence: a host has waited ~5 months (a full first meal drafted the day they applied);
│     2 join requests unanswered since June; the admin notice goes to one inbox with no queue,
│     no reminder and unchecked send errors; the waiting host saw a normal dashboard and a
│     promise of an approval email that doesn't exist.               Confidence: high
│     ├─ S3.1 Call the waiting host this week; answer the 2 old requests   ← do now (E3)
│     ├─ S3.2 Admin queue: daily pending digest, checked sends, POST approve page, "you're live" email
│     └─ S3.3 Honest "under review" state on the host dashboard
│
├─ O4  Prospective host: "Starting a group looks like a lot, and I'm not sure what happens next."
│     Evidence: 49 viewed Start a Group in 6 months, 0 submitted, 3 typed anything; ~16 questions
│     over ~4.5 phone screens; the form says "immediately", the confirmation says "review".
│     Visits are rising (1–5/month Jun–Aug → 17, 15, 10 Sep–Nov).    Confidence: medium (tracking verified)
│     ├─ S4.1 "Talk to Landon first" link (fake door / concierge)   ← test (E4)
│     ├─ S4.2 Short form (country pre-filled, 3–5 fields), honest next steps
│     └─ S4.3 Landon personally invites 5 missionary families (after E1 shows why Spain stalled)
│
├─ O5  Everyone: "Can I trust this with my information?"
│     Evidence (verified in code and logs): page addresses with host and member login tokens go
│     to Mixpanel, with 100% session replay; production runs on the public anon key with open
│     database policies (005 lockdown not applied); approve links are GETs that mail scanners
│     can click; no unsubscribe link; next@16.2.7 has reachable advisories.  Confidence: high
│     ├─ S5.1 Strip tokens from analytics; turn off or mask session replay   ← build now
│     ├─ S5.2 Set the service-role key in Netlify, verify, then apply 005
│     └─ S5.3 Upgrade Next to a patched release
│
└─ O6  Member: "Once I'm here, I'd like to feel close to the field and the group between gatherings."
      Evidence: chat, invitations, table photos, the app all at 0 so far (2 days old); field
      videos drew 1 reaction. What pulls people back: "You and 1 other are in", other members'
      prayers, a real family's video.                                Confidence: low (too early)
      └─ Parked until the monthly rhythm runs again (measure after Dec 12)
```
