# Mission Table — Product Requirements Document (v1)

*Start or join a community of believers praying for the Great Commission.*

---

## 1. Summary

Mission Table helps believers in the USA engage the Great Commission tangibly. People **start or join a community** that commits, for one year, to gather once a month to share a meal from a specific country and pray for its people — both the unreached and the believers and missionaries already there. The site is **explore-first**: anyone can understand the whole thing at zero commitment, then either **join** an existing community or **start** their own.

This document specifies **v1**, scoped deliberately small so it can launch fast and cheap.

---

## 2. v1 Goal & Launch Plan

- **Launch with one live community: Spain.**
- Growth is **invite-driven** — Landon personally shares the platform with missionaries and churches who want to start their own community.
- **Country data** is seeded manually for Spain + 5–7 more countries (pulled from Joshua Project by hand). Every other country shows an **empty state** that still invites people to start the first community there.
- All approvals and routing are **manual ("manual-ish")** at launch; Landon is the sole admin.
- The **Spain community is created by Landon himself, via the live start-a-group flow** (he is the host) once the site is built — dogfooding the real flow rather than hand-seeding it.

**Success for v1:** the Spain community is joinable, the directory is browsable, and a new host can request to start a community that Landon approves and then personally onboards.

---

## 3. Users & Roles

| Role | Auth | What they do |
|---|---|---|
| **Visitor** | None | Explore the mission, browse continents/countries, read country pages |
| **Prospective member** | None (no accounts) | Submit a **join request** to a community; receive a confirmation + "what every month looks like" |
| **Host** | Private link (no login) | Run a community; receive join requests; add approved people to GroupMe manually; access a private host resource page |
| **Admin (Landon)** | Simple password | Approve start-a-group requests, set up/seed communities, take a community down |

**No member accounts and no progress tracking in v1.** "Never behind" is a *posture* communicated in copy, not a feature.

---

## 4. Non-Goals (explicitly out of scope for v1)

- Member accounts, logins, or profiles
- Tracking who attended or "where someone left off"
- In-app kit viewing for members (the host distributes the kit — see §8)
- Reminders or notifications
- Joshua Project **API** integration (data is manual first; crawlers/API are the *last* priority)
- Multi-country / custom-month journeys (a community = one country for one year)
- Special sensitive-country PII safeguards beyond optional discreet naming
- In-app group chat (GroupMe is the external chat)

---

## 5. Information Architecture

```
Home (explore: what it is + how it works)
 ├─ Browse → Continents (list) → Countries (alphabetical within each)
 │     └─ Country page
 │           ├─ If public community(ies) exist → community card(s) + Join CTA
 │           └─ If none → empty-state marketing + "Start a group" CTA
 ├─ Join flow → join-request form → confirmation + "your monthly rhythm" page
 ├─ Start a group flow → alignment → host commitment → config form → submitted
 ├─ Host private page (tokenized link)
 └─ Admin page (password)
```

Private communities are **not listed** in the directory; they are reached only by a **code/link** shared out-of-band.

---

## 6. Core Flows

### 6.1 Explore (front door)
Marketing-style home and country pages explain what Mission Table is, what a community does each month, and that you can join anytime without being "behind." **Join** and **Start** CTAs appear in multiple places — never a forced fork before the person understands the thing.

### 6.2 Join a community
1. Visitor finds a community via the directory (public), search by name, or a code/link (private).
2. Views the community's public details: country, gathering model, day, city/state (single-gathering only), and whether seats remain.
3. Submits a **join request** with:
   - Name, Email, Phone
   - City, State
   - A note to the host
   - **Commitment level** (single choice): *Just exploring* · *Will make a few* · *Will make most of them* · *Fully committed every month, barring anything serious*
4. Confirmation screen: "Give this host **48 hours** to add you to the group chat, where you'll receive more instructions," plus the **monthly rhythm** overview (§8).
5. The request is delivered to the host. The host adds the person to GroupMe **or not** — this *is* the approval, but it is never called "approving." Hosts are coached to be careful who they admit and what they share.

### 6.3 Start a community
1. **Align** — what Mission Table is and isn't; mission + doctrinal baseline (§10). Shared with the Join front door.
2. **Commit** — plain statement of what hosting requires for a year; the host affirms it.
3. **Configure** — the community settings (§7).
4. **Field connection** (§9).
5. **Submit** → routed to Admin (Landon) for manual approval → on approval, the community goes live, the host receives their private host-page link, and Landon reaches out personally.

---

## 7. Community Configuration

| Field | When | Notes |
|---|---|---|
| Community name | Always | Optional **discreet/coded** name for sensitive countries |
| Country | Always | One country for the full year; works even with no seeded data |
| Visibility | Always | **Public** (listed) or **Private** (code/link only) |
| Gathering model | Always | **Single gathering** (one place) or **Family Gathering** (every household hosts its own table — in person, *not virtual*) |
| Day of month | Always | Fixed number (e.g., the 15th) **or** ordinal weekday (e.g., 2nd Saturday) |
| Start date | Always | First gathering; must match the chosen day pattern |
| Host name(s) | Always | First names/handle; shown publicly |
| Host contact (email, phone) | Always | Private; used for routing requests + onboarding |
| Group chat link (GroupMe) | Always | Private; the host uses it to add approved people |
| Address | Single only | **Hidden** publicly; shared by host after adding someone |
| City / State | Single only | Public on the card, for discovery |
| Start time + time zone | Single only | Family Gathering: each household sets its own time |
| Capacity | Public + single only | Tracked only when a community is **both public and a single gathering**. Private = host manages who they share with. Public + Family Gathering = no cap. See §11/§14 for tracking. |

---

## 8. The Monthly Rhythm ("the kit")

Every community, every month, does the same four things — this is the **universal layer**, with the **country-specific** pieces filled in per community:

1. **A shared meal** — a new recipe from the country being prayed for.
2. **Prayer requests from the mission field** — sourced through the host's in-country believer contact (§9).
3. **Scripture.**
4. **Connection with others doing the same** — introductions, photos, and typed-out prayers each month (strongly encouraged, not required).

**Distribution:** the **host sends out the kit**. Members do not view it on the site. Hosts receive guidance and resources on a private host page (§12) and through Landon's personal onboarding.

---

## 9. Field Connection (start-a-group)

When starting a community, the prospective host answers:
- Do you know a believer (or believers) in this country? (yes / no; if yes, roughly how many)
- Can you contact them **monthly** to receive prayer requests and share updates from your praying group? (yes / no)
- Notes / who they are (free text, optional)

Not required. If the host has no connection, Mission Table **promises to do its best to connect them** — and this promise is shown on the start-a-group request page so the person knows they won't be left without a field link.

---

## 10. Doctrine & Alignment

A **single Mission Table baseline** (not host-defined) that every host affirms when starting and that shapes the Align stage. Mission Table uses its **own original statement of beliefs**, written in-house and faithful to Radical's theology, focused on the first-order gospel doctrines and the Great Commission. It credits Radical (radical.net) as an influence rather than reproducing their text — copyright-safe. Hosts affirm alignment with it when starting a community.

**Align-stage copy (final):**

> **What We Believe**
>
> Mission Table exists to gather believers around the table and the throne — to eat, to pray, and to long for the day when Jesus is known among every people. These are the convictions that hold us together:
>
> **God.** We believe in one God, eternally existing in three persons — Father, Son, and Holy Spirit — perfect in holiness, love, and power.
>
> **Scripture.** We believe the Bible is God's own Word, fully trustworthy and authoritative, the final guide for what we believe and how we live.
>
> **Humanity.** We believe every person is made in God's image and precious to him, yet all of us have sinned and need rescue.
>
> **Jesus.** We believe Jesus Christ is fully God and fully man, that he lived a sinless life, died in our place to bear the punishment for our sin, and rose bodily from the grave in victory.
>
> **Salvation.** We believe we are saved by grace alone, through faith alone, in Christ alone — never by what we achieve. True faith is living faith, bearing fruit in love and obedience.
>
> **The Mission.** We believe Jesus has commanded his Church to make disciples of all nations. More than 3 billion people still live with little or no access to the gospel; their names are known to God, and they are worth our prayers, our tables, and our lives.
>
> **Hope.** We believe Jesus will return to make all things new, and that he will be worshiped by every tribe, tongue, and nation.
>
> *Our convictions are shaped by and indebted to the work of Radical (radical.net).*

(Canonical editable copy: `mission-table-beliefs.md`.)

---

## 11. Data Model (static-first)

Because data is small and manually curated, v1 can store reads as structured files (JSON/Markdown) in the repo — no database required for the directory. The **one exception** is signup counting for **public single-gathering** communities (see Signups below).

**Country**
- `name`, `continent`, `slug`, `status` (`seeded` | `empty`)
- If seeded: `heroImage`, `intro` / "why pray" copy, Joshua Project stats (population, primary religion, % Christian/evangelical, notable peoples), `prayerPoints[]`

**Community**
- `id`, `name`, `discreet` (bool), `countrySlug`
- `visibility` (`public` | `private`), `joinCode` (if private)
- `gatheringModel` (`single` | `family`)
- `dayPattern` (`{type: "fixed", day: 15}` | `{type: "ordinal", ordinal: 2, weekday: "saturday"}`)
- `startDate`, `startTime`, `timezone` (time/tz: single only)
- `city`, `state`, `address`, `capacity` (single only; `address` private)
- `hostDisplayNames[]`, `hostEmail` (private), `hostPhone` (private, optional), `groupChatLink` (private)
- `fieldConnection` (`{hasBeliever, count, canContactMonthly, notes}`)
- `status` (`pending` | `live` | `takenDown`)

**JoinRequest** (form submission, no stored status)
- `communityId`, `name`, `email`, `phone`, `city`, `state`, `note`, `commitmentLevel`, `submittedAt`

**StartRequest** (form submission → admin)
- Proposed Community fields + requester contact + doctrine affirmation + field-connection answers + `submittedAt`

**Signups** (only for **public + single-gathering** communities)
- A lightweight table counting confirmed signups per such community, used to **project fullness** against `capacity` and flag the host.
- Private communities and public Family Gatherings are **not** tracked.
- At launch: counting and any host notification are **manual** (Spain is the only community and Landon is its host, so this is effectively dormant). The table is the mechanism for when it's needed.

---

## 12. Admin & Host Tooling (lightweight)

**Admin (Landon):**
- All join + start requests route to **projectmissiontable@gmail.com** at launch (per-host routing added later).
- See incoming **start-a-group** requests
- Approve → create/seed the community (`status: live`)
- **Take a community down** → set `status: takenDown` (hides it everywhere) — manual status flag, no full moderation UI in v1
- At launch this can be as simple as a password-gated page or editing the repo data + redeploy. A richer admin UI is later.

**Host:**
- A **private tokenized page** (`/host/<token>`, no login) with: what hosting involves, how to run the monthly rhythm, how to distribute the kit, and guidance on admitting people / what to share.
- Incoming join requests for their community are emailed to them (and optionally listed on this page).

---

## 13. Visual & Aesthetic Direction

A **travel-magazine** aesthetic (per the reference image), redirected from tourism toward praying for the nations:
- **Full-bleed country photography** as the hero of each country page.
- An **oversized country-name wordmark** overlapping the image.
- Clean, modern **sans-serif** typography; generous white text on imagery.
- A **dashed journey-path motif** (the flight-path line) reinterpreted as a "Go therefore…" thread connecting tables and nations.
- A small **icon row** summarizing the four monthly elements (meal · prayer · Scripture · community) in place of the reference's Airfare/Meals icons.
- **CTA pills** ("Join a table →", "Start a group →").
- Tone: aspirational, immersive, hopeful — wanderlust pointed at the Great Commission.

> Note: this replaces the earlier Spanish-countryside/aged-paper aesthetic, since the concept is now country-agnostic.

---

## 14. Tech Architecture & Constraints

- **Hosting:** Netlify. **Budget ceiling: $50/month** (this build should land near $0–$19).
- **Recommended stack:** a static site (e.g., Astro or Next.js static export) deployed on Netlify; seeded country/community data as JSON/Markdown committed to the repo.
- **Forms:** Netlify Forms for join + start requests, with **email notifications to projectmissiontable@gmail.com**. At launch all submissions route there and Landon handles/forwards manually. Per-host email routing added later via a small Netlify Function.
- **Data store:** static files for the directory; **one lightweight table** for signup counts on public single-gathering communities (Netlify-friendly options: a hosted Postgres/Supabase free tier, or similar). Dormant at launch.
- **Host page:** served at an unguessable slug; no auth system needed in v1.
- **Admin:** password-gated page or direct repo editing + redeploy.
- **No member accounts, no external chat build,** and no database beyond the single signups table. Keeps cost and complexity minimal and well within budget.

---

## 15. Resolved Decisions

1. **Doctrine** — **finalized**: Mission Table's own original statement of beliefs (in §10, also in `mission-table-beliefs.md`), faithful to Radical's theology and crediting radical.net; not pasted verbatim. ✔
2. **Request routing** — all join + start requests go to **projectmissiontable@gmail.com** at launch; per-host routing later.
3. **Host page access** — private **unguessable link, no login**. ✔
4. **Take-down** — manual **status flag**, no moderation UI in v1. ✔
5. **Capacity** — tracked **only for public + single-gathering** communities (DB signups table); private = host's discretion; public Family Gathering = no cap. Manual at launch.
6. **Spain** — created by **Landon via the live start-a-group flow** (he is the host) after build; not hand-seeded.

**Still to produce before/at build:** seeded country content for Spain + 5–7 countries (manual Joshua Project data), and — if Landon chooses option 2 in §10 — an original Align-stage doctrinal statement.
