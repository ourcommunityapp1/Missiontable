# Engineering lens: 2026-11-20 (first cycle)

Tech lead notes for the trio. Everything here is aggregates, roles and file paths. No names, emails, tokens or member links.

**How to read the tags.** **[V]** = verified this cycle (the source is named). **[I]** = inferred from code or circumstantial evidence, not proven. Production was read-only: SELECTs, advisors, log queries, `curl` of public pages and unauthenticated endpoints, `npm audit`. Nothing was submitted, toggled or sent.

## The five things that matter most
1. **The production database is open to the public key, and production uses that key.** Every table has `using (true)` policies for role `public`. Supabase edge logs show all Netlify traffic authenticating as **`anon`** (168 + 77 + 6 requests in 24 h, all role `anon`) [V]. `SUPABASE_SERVICE_ROLE_KEY` is therefore not set in Netlify. Applying `005_lock_down_rls.sql` as written would **take the whole site down**. Anyone holding the anon key can read every host token (full dashboard access), member email and phone, and can rewrite groups, kits and memberships. The Supabase security advisor does **not** flag any of this (it reports one low warning only), so a clean advisor result does not mean the database is safe.
2. **Bearer tokens are leaking into Mixpanel.** Autocapture's `$current_url` and our own `Page View.path` contain host tokens (`/host/<token>`) and member tokens (`?token=`). Session replay records 100% of sessions [V: dead-click property values; `src/lib/mixpanel.ts` lines 9–12]. Anyone with access to the Mixpanel project can open a host dashboard or a member's app.
3. **Kosovo: the approval loop has no second channel and fails silently.** There is one email, sent to one hard-coded inbox, with errors that are never detected. There is no admin queue, no reminder, and no "you're live" email to the host, even though the dashboard promises one. The pending host sees a normal-looking dashboard. On day one the host built a meal that went to zero members [V: DB timeline + code].
4. **Start a Group tracking is not broken. Nobody is submitting.** `start_group_page_viewed` fires (49 users). The database has **zero** new non-QA groups since tracking began on 2026-06-04. Autocapture on `/start` shows **0 form submits, 3 users who typed in any field, 9 who clicked anything** in 6 months [V]. The problem is demand and friction, not instrumentation.
5. **The host stopped arriving, not finishing.** Host dashboard page views: Jul 4, Aug 11, Sep 4, **Oct 0**, Nov 1 (the Nov visit is probably internal) [V Mixpanel]. The in-dashboard "Meal not sent" nudge never had a chance. Any host-assist bet has to reach the host **outside** the dashboard (email, text, a person). There is also no reminder to send the meal itself: the automatic host reminders cover only the "Are you in?" and thank-you notes, and only fire when automatic emails are on [V `src/lib/gathering.ts:265-270, 291`].

---

## 1. Health and risk scan (ranked by member and host trust impact)

| # | Severity | Finding | Evidence | Smallest fix |
|---|---|---|---|---|
| R1 | **Critical** | **The DB is world-readable and writable with the anon key, and prod runs on the anon key.** 21 public tables have `true` policies for `public`: hosts (read and update), members (read and update), memberships (insert and update), groups (insert, update), kits (insert and update), chat and RSVPs (`for all`). Storage bucket `table-photos` is public, with anon insert and delete. `005_lock_down_rls.sql` is **not applied** (missing from `list_migrations`; the policies still exist). Its stated prerequisite, a service-role key in Netlify, is **not met**. | [V] `pg_policies`, `storage.buckets`, edge logs role = `anon` for all Netlify (AWS Virginia) requests in 24 h. The anon key was **not** found in any of the 15 JS chunks served by 7 public pages [V], and no `'use client'` file imported `lib/supabase` before Nov 17 [V git]. It is still a "publishable"-class key, so assume it can be discovered. | **Enabling bet E0** (below): set a secret key in Netlify, confirm in logs, then apply 005. Afterwards rotate the legacy JWT keys and move to the new publishable/secret keys. Size **S** (config plus one migration), but it must be sequenced. |
| R2 | **High** | **Credentials in analytics.** `distinct_id` = `member_token` (AGENTS.md calls it "not PII", but it *is* a bearer credential). `$current_url` and `path` carry host and member tokens. `record_sessions_percent: 100` replays member pages and host dashboards. Local and dev builds also send to the prod project (localhost and an alternate Netlify domain appear in `$current_url`), which pollutes metrics. | [V] Mixpanel `$mp_dead_click` values; `src/lib/mixpanel.ts:3-12`, `src/components/MixpanelProvider.tsx:43`. | Strip `token` from URLs before tracking (pass a sanitised `$current_url` and `path`). Replace `/host/<token>` with `/host/:token`. Turn off autocapture and replay on `/host/*` and on any URL with `token=`. Initialise Mixpanel only on the production hostname. Longer term: `distinct_id` = a hash of the member id. Size **S–M**. Also ask Landon to review who has Mixpanel access. |
| R3 | **High** (host trust) | **The group approval loop is broken.** Details in §3a. | [V] code + DB | Bet B (S–M). |
| R4 | **High** (member trust) | **Silent email failures.** The Resend SDK v6 *returns* `{ error }` and does not throw. `start/actions.ts`, `kit/new/actions.ts`, `join/[id]/actions.ts` and `host/login/actions.ts` ignore the returned error; only `gathering.ts:sendEmail` and `appEmail.ts` check it. `kit_email_sent` is tracked even when the send failed (`kit/new/actions.ts:117-131`), so "kits sent" means "kits attempted". Sends are sequential with no batching or backoff. The loop claims a send in `gathering_sends` *before* sending, so failures are never retried, and the loop stores intended `recipients`, not the actual `sent` count (`gathering.ts:322-330`; `appEmail.ts:126` does update it). | [V] code. [I] whether any real send has failed: there is no Resend access here, and Netlify function logs were not read. | Check `{ error }` everywhere, write the real `sent` count, and use `resend.batch.send` for groups. Size **S**. |
| R5 | **Medium** | **`next@16.2.7`: 1 critical advisory bundle (17 vulns in total: 1 critical, 8 high, 8 moderate).** *Reachable*: the Server Actions DoS advisories (GHSA-m99w-x7hq-7vfj, GHSA-p3m5-59mp-jv5r), because every public form is a server action and `serverActions.bodySizeLimit` is raised to 6 MB; the cache-confusion advisories (moderate). *Probably not reachable*: the image-optimizer RCE/SSRF, because `/_next/image` is served by the Netlify Image CDN (response has a `netlify-vary` image header [V]). Also not reachable: `use cache` and `next/og` (not used [V grep]), middleware or proxy bypass (no middleware [V]), Windows RCE. Other highs (postcss, sharp, eslint deps, js-yaml, zod) are build-time or transitive [I]. | [V] `npm audit` | Upgrade to `next@16.4.6` on a branch, then smoke-test every server action (join, start, kit, chat, RSVP). Size **S**. |
| R6 | **Medium** | **Dev and test sessions write to the production DB** with the publishable key. On Nov 19 there were 300+ writes from a non-Netlify origin: chat reads, RSVPs, reactions, table posts, a `gathering_sends` claim. They look QA-scoped, but nothing enforces that. After E0, these environments break. If they hold a Resend key, real emails can go out. | [V] edge logs grouped by origin and key prefix | A Supabase branch or a separate dev project for local builds. Size **S–M**. |
| R7 | **Medium** | **Deliverability and link safety.** No unsubscribe link or `List-Unsubscribe` header in any email [V grep]. That matters once automatic or broadcast emails start: complaints, then spam folder. Two state-changing actions run on **GET links in emails**: group approval (`/api/admin/approve?token=<static secret>`, where one secret approves any group) and member approval (`/api/host/approve-member?token=<host token>`, which puts the host's dashboard credential in every join-request email). Link-scanning mail gateways can trigger these. SPF, DKIM and DMARC for the sending subdomain were **not verified**: DNS-over-HTTPS was blocked by the sandbox proxy. | [V] code; [I] scanner risk | Add a footer and `List-Unsubscribe` to automatic emails. Move approvals to a confirm page that POSTs. Check domain status in the Resend dashboard. Size **S** each. |
| R8 | **Low** | `startGroup` upserts the host on `email` (`start/actions.ts:37-41`). Anyone who knows a host's email can overwrite that host's public name and phone and attach a pending group to them. Email is not lowercased there but *is* lowercased in host login (`host/login/actions.ts:15`), so a mixed-case signup can break magic-link login. | [V] code | Lowercase the email. On conflict, don't overwrite existing fields. Size **S**. |
| R9 | **Low** | Advisors: `update_updated_at` has a mutable `search_path` (security, WARN). 9 unindexed foreign keys and 1 unused index (performance, INFO). These are irrelevant at 27 members. | [V] `get_advisors` | Fold into the next migration. |
| R10 | OK | Public pages are all **200 in under 0.7 s**: `/`, `/browse`, `/country/spain`, `/country/kosovo`, `/start`, `/about`, `/host/login`. The local build `:3132/start` also returns 200. `/api/admin/approve` and `/api/cron/gathering` return **401** without credentials. **The hourly gathering loop ran 24 of 24 hours** in the last day: the Netlify function's `groups?status=active&auto_messages=eq.true` query appears once per hour in the edge logs. It sent nothing because no group has automatic emails on. No app errors in the Postgres logs (24 h). | [V] curl, Supabase edge and Postgres logs | Note that log retention is about 1 day, so June cannot be checked. |

---

## 2. Instrumentation gaps (each is an enabling bet)

| # | What the trio can't measure | Why it matters | Smallest fix | Size |
|---|---|---|---|---|
| G1 | **Whether emails were delivered** (kit, approval, admin notice). Opens aren't tracked at all. | `kit_email_sent` counts attempts. A Resend outage would look like disengaged members. | Check `{ error }` and add a `delivered: true/false` prop to `kit_email_sent`. Next step: a Resend webhook (delivered, bounced, complained only) to `/api/resend-webhook`, stored as daily counts. Skip open tracking: Apple Mail Privacy Protection inflates opens, and click tracking would route token links through a third party. Keep "group page opened within 7 days" as the engagement signal. | S, then M |
| G2 | **Whether `group_started` would fire for every real submission.** It is client-only, fires after success, and ad-blockers drop it. | The funnel's last step is the least reliable event. | `trackServer('group_started', <hash of host id>, {country_slug, group_type})` in `startGroup` after the insert, plus `start_group_failed {reason}` on each error return. The DB (`groups.created_at`) stays the source of truth. | S |
| G3 | **Where `/start` visitors drop.** | 49 viewers, 3 typed. We don't know whether people bounce at the responsibilities list or at the schedule section. | Client events `start_form_started` (first focus) and `start_form_section_reached {section}`. Also: watch the replays of the ~3 sessions that typed (`/start` has no tokens in its URL, so those replays are safe to view). | S |
| G4 | **Host dashboard visits per host.** | Today's only signal is anonymous `Page View`, and its `path` *is* the host token. | Server-side `host_dashboard_viewed` with `distinct_id` = hash of host id, or an additive `host_dashboard_views` table mirroring `group_page_views`. Stop sending the raw path. | S |
| G5 | **Why hosts stop, and how close to the deadline they send.** | This is the core host-retention question, and there is no event for kit creation. | Server event `kit_created {group_id, days_before_gathering, source: blank/previous/library, edited_fields}`. The "why" can't come from data: Landon asks the host one question (concierge). | S |
| G6 | **Approval latency.** | There is no `approved_at` column and no event, so the 5-month wait was only visible because the group is still pending. | Additive column `groups.approved_at timestamptz null`, set by the approve route, plus a `group_approved` server event. | S |
| G7 | **Clean member-visit counts.** | `recordGroupPageView` runs on the server for every GET (`group/[id]/page.tsx:70`). Mail link scanners that prefetch member links count as "member visits". | Record visits from the client after hydration, or store a user-agent class and filter known scanners. | S |
| G8 | **Whether the admin was notified.** | Kosovo's notice left no trace. | Store the Resend message id or error on the group (column `admin_notified_at`) or emit `admin_notified {ok}`. | S |
| G9 | **Internal vs real traffic.** | localhost, preview domains and test sessions land in the production Mixpanel project. | Initialise Mixpanel only on `missiontable.org`. Register `is_internal` for the QA group and builder sessions. | S |

---

## 3. Root-cause checks on the two supply problems

### 3a. Why the Kosovo group sat pending for five months

**Timeline from the DB [V]:** host record created 2026-06-02 21:04 UTC. Group submitted 2026-06-03 14:03. The host created a meal (kit) 2026-06-03 15:12, for a June 7 gathering. That meal went to **zero members**, because a pending group can't be joined. There have been no join requests, field posts or sends since. The only later activity is one host-authored chat message on Nov 19, during the chat launch; it is probably internal testing [I]. Mixpanel tracking began 2026-06-04 (zero events Jun 1–3 [V]), so the submission predates tracking.

**Notification path:**
- `src/app/start/actions.ts:105-135`: after the insert, one Resend email goes to **a single hard-coded project inbox** (line 112). It holds a one-click **GET** approve link containing the global `ADMIN_APPROVE_SECRET` (line 108).
- The `try/catch` (lines 106, 133) only catches thrown exceptions. Resend API errors (rate limit, unverified domain, bad key) come back as `{ error }`, are ignored, and **leave no log and no DB trace**. Nothing records that the admin was ever notified.
- **Was the email sent?** Probably yes [I]. The host confirmation email (same sender, same key, sent milliseconds earlier, lines 77-103) evidently arrived: the host was in the dashboard 69 minutes later, and that link only comes by email. The likely failure is that **the email arrived and nobody acted on it.** It went to one inbox that nobody watches as a work queue, possibly into spam or Promotions, with no reminder.
- The 17-hour gap between the host row and the group row means a June 2 attempt upserted the host but never created a group. That suggests an earlier failed or abandoned submission [I: logs are not retained that far back].
- **No second channel exists**: no admin page, no pending list, no reminder, no age alert. `/api/admin/approve` is the only admin surface [V: `src/app/api/admin/` contains only `approve/`].

**What the approve route doesn't do** (`src/app/api/admin/approve/route.ts:16-33`): it flips `status` to `active`. It sends **no email to the host**, records no timestamp, and fires no event.

**What the host saw:**
- `src/app/host/[token]/page.tsx:53-61` says "Your group is pending review. You'll receive an email once it's approved." But that message only renders when the host has **zero** groups. `getHostByToken` (`src/lib/queries.ts:427-436`) includes pending groups (it excludes only `inactive`). So the Kosovo host gets the **full dashboard**, with a small "· pending" eyebrow (`page.tsx:140`).
- The promised approval email does not exist anywhere in the code.
- The host can "send" a meal to nobody and receives their own copy (`kit/new/actions.ts:132-139`), so it looks like it worked.
- The public Kosovo page still says "Be the first to start a Mission Table for Kosovo" [V curl].

**Verdict:** the root cause is a process gap made worse by silent failure and a dashboard that hides the state. It is **not a code crash**. Nothing in the system would ever re-surface a pending group.

### 3b. The Start a Group funnel: broken tracking, or a failing or abandoned form?

**Tracking works [V].**
- `start_group_page_viewed` fired for 49 users. `MixpanelProvider` sits before `{children}` in `src/app/layout.tsx`, so it initialises before the form's effect runs.
- `group_started` fires client-side only after the server action succeeds (`StartGroupForm.tsx:158-183`).
- The DB has **0** non-QA groups created since 2026-06-04, so Mixpanel and the DB agree: **no successful submissions**.

**The form is mostly abandoned before anyone touches it [V Mixpanel autocapture on `/start`, 6 months]:**

| Signal | Count |
|---|---|
| Viewers (`start_group_page_viewed`) | 49 users (Jun 3, Jul 1, Aug 5, Sep 17, Oct 15, Nov 10) |
| Users who changed any input | **3** |
| Users who clicked anything | 9 |
| Users who scrolled | 8 |
| Form submits (`$mp_submit`) | **0** |
| Dead clicks | 8 (3 on a `button`) |

The only button in the form body is "Register as a Host", so those 3 dead clicks are probably browser validation blocking the submit [I]. Watch the replays to confirm.

**Friction in the code [V]:**
- A five-item list of host duties comes before the form (`StartGroupForm.tsx:252-270`), including "send a recipe every month" and "source prayer requests". That is a big commitment before a single field.
- About 10 required fields across three sections, with decisions a prospective host may not have made yet: start date, weekday pattern, meeting time, and a time zone picked from 26 US-first options (lines 24-51).
- The country is not pre-selected from a country page. `country/[slug]/page.tsx:295` links to a bare `/start`, and `start/page.tsx` never passes `defaultCountry`, so `default_country` is never set.
- If the server action throws (network error, 500), the button stays on "Registering..." with no message: there is no `try/catch` around `await startGroup` (lines 158-159).
- The success screen says "You're on the map" and links to the country page, where the group is invisible while pending.

**Verdict:** this is a demand and friction problem, not a tracking bug. At about 8 viewers a month, **A/B testing is statistically impossible**. Use concierge tests and fake doors with absolute thresholds.

---

## 4. Feasibility, cost and technical risk of the likely bets

S ≤ 1 day, M ≤ 3 days, L > 3 days. All code changes are additive and flag-gated unless noted.

| Bet | Approach | Files touched | Cost | Technical risks |
|---|---|---|---|---|
| **E0 (enabling): lock down the DB** | Set `SUPABASE_SERVICE_ROLE_KEY` (or a new `sb_secret_` key) in Netlify and redeploy. Check edge logs until 100% of Netlify traffic shows role `service_role`. Apply `005_lock_down_rls.sql`. Point local and dev builds at a separate project. Later, rotate the legacy JWT keys. | Netlify env (Landon), migration 005 | **S** | If 005 runs before the key is live, the **site goes down** (rollback: `005_lock_down_rls.down.sql`). Dev sessions lose DB access by design. **Every new table in later bets needs this done first.** Otherwise prod's anon key forces another `true` policy. |
| **A. Help the host send the monthly meal** | **A1** concierge reminder plus a pre-filled draft (no code). **A2** new loop kind `host_reminder_meal` at D-10 and D-4 (09:00 group time): skipped if a kit exists for D, sent to host and co-hosts, claimed in `gathering_sends`. Gated by env `MEAL_REMINDER_GROUPS=<ids>` so it does **not** depend on `auto_messages`. **A3** "Start from a previous meal" picker on `/host/[token]/kit/new` that pre-fills the 9 fields from an earlier kit (4 Spain kits exist). **A4** a per-country meal library in `src/data/meals.ts`, behind a fake door first. **A5** Landon as co-host who can send the meal (co-hosts are already authorised by `authorizeHostForGroup`); needs the host's consent and a DB insert that Landon makes. | A2: `src/lib/gathering.ts` (`LOOP_SCHEDULE`, `runGatheringLoop` group selection at line 291, `prepareSend`, a new `hostMealReminderHtml`). A3: `kit/new/page.tsx`, `KitNewForm.tsx`. A4: new data file. | A1 **0**, A2 **S**, A3 **S**, A4 **M–L** (mostly content), A5 **0** | Emailing a host who has quietly stepped back can feel like nagging (cap at 2 per month, add an easy "pause"). The reminder link carries the host token (existing pattern; R2 and R7 apply). The loop selector only loads `auto_messages = true` groups, so A2 must add an OR on the allowlist. That is easy to get wrong; test with `dry=1&group=&now=`. |
| **B. Admin approval queue and notification** | **B1** check Resend's `{ error }`; on failure, show the host a "we'll be in touch" fallback and log it. **B2** a daily "N groups pending > 48 h" digest from the hourly loop, claimed in `gathering_sends` (kind `admin_pending`, keyed to the oldest pending group and today's date, so no migration). **B3** an `/admin` page, protected by the admin secret, listing pending groups with an approve button that **POSTs**. **B4** on approval, email the host "you're live" plus a `group_approved` event, and show a pending banner on the dashboard for pending groups. **B5** additive `approved_at` column. | `start/actions.ts`, `api/admin/approve/route.ts`, new `app/admin/`, `gathering.ts`, `host/[token]/page.tsx`, migration 010 (additive) | **M** total (B1, B2, B4 are S each; B3 S–M) | The admin page is a new privileged surface. Gate it with a secret held server-side (a cookie set from a one-time link), never a GET that changes state. The digest reveals pending group names to the admin inbox only. Without E0, B5's column is fine (no new table), but the new page would read hosts with the anon key. |
| **C. Turn on automatic "Are you in?" and thank-you emails for Spain** | **No code**: the host's Settings toggle already exists (`auto_messages_toggled` is tracked). Preview with `GET /api/cron/gathering?group=<id>&now=<ISO>&dry=1&preview=1` (CRON_SECRET, Landon only). Recommended small prerequisites: write the real `sent` count; add a footer and `List-Unsubscribe`. | none (or `gathering.ts` for the prerequisites) | **XS** (+ S for prerequisites) | 21 member emails at D-3 and D+1, from a group that has been silent for two months. The "Are you in?" email goes out **whether or not a meal was sent** (it shows the recipe only if a kit exists, `gathering.ts:370-388`), so sequence it after A. Claim-before-send means failed sends are never retried. Sequential sends are fine at 21 recipients. Emails can't be unsent. |
| **D. Lighter Start a Group flow** | **D1** quick fixes: pre-select the country from `?country=`, `try/catch` around submit, honest success copy, server-side `group_started` (S). **D2** fake door: a "Not ready to pick dates? Tell us your country and we'll set it up with you" box with 3 fields. It emails the admin (with error checking) and sends `host_interest_submitted {country_slug}` server-side; **no DB write**, and Landon follows up (S). **D3** a multi-step form that collects schedule details after a call (M). | `start/StartGroupForm.tsx`, `start/actions.ts`, `start/page.tsx`, `country/[slug]/page.tsx` | D1 **S**, D2 **S**, D3 **M** | D2 relies on the same email path that failed Kosovo, so B1 and B2 come first. PII goes only to the admin inbox, never to Mixpanel properties. A `host_interest` table would be cleaner but needs E0 first. |
| **E. Member re-engagement** | Don't build a separate system yet. **The December meal is the re-engagement message.** If a standalone note is wanted, reuse the `appEmail.ts` pattern (host-triggered, at most once a day, claimed in `gathering_sends`) as "a note to the group". | `src/lib/appEmail.ts` pattern, host Settings | **0** (bundled with A) / **S** standalone | A broadcast to members after two silent months risks complaints with no unsubscribe link (R7). Make it host-authored and host-triggered, never automatic. |

---

## 5. Safest experiment designs (thresholds and queries written before starting)

All run on **Spain only, with the host's consent**, or on the QA group. Landon does the outreach; the trio contacts no one. Next gatherings: **Sat Dec 12** (D-10 = Wed Dec 2, D-3 = Wed Dec 9), then **Sat Jan 9**.

### X0: Lock the DB down (enabling; do first)
- **Method:** staged config change. **Audience:** all.
- **Steps:** (1) Landon adds the secret key in Netlify and redeploys. (2) Run the role check below for 24 h. Proceed only when every Netlify row shows `service_role`. (3) Apply 005 in a quiet hour. (4) Smoke test: `curl` the public pages, open the host dashboard, open the member app, send a chat on the QA group.
- **Success:** 0 Netlify requests as `anon` for 24 h before 005, and 0 non-2xx on smoke tests after.
- **Kill or rollback:** `005_lock_down_rls.down.sql` restores the policies in one statement. Unsetting the key reverts the app to anon.
```sql
-- Supabase logs (query_logs): which role the production app uses
select log_attributes['request.sb.jwt.apikey.payload.role'] as role,
       log_attributes['request.cf.asOrganization']        as origin,
       count(*)
from logs where source = 'edge_logs' group by 1, 2 order by 3 desc;
```

### X1: Concierge meal assist (bet A1, plus A5 if the host wants it)
- **Hypothesis:** A personal nudge plus a ready-to-paste Spain meal gets the December meal sent on time.
- **Riskiest assumption:** the host stopped for lack of time or prompting, not because they lost interest.
- **Method:** concierge. By Dec 2, Landon sends the host and co-host a pre-filled meal draft (recipe, scripture, prayer requests) and asks one question: "What made October and November hard?" Record the answer in decisions.md in aggregate wording. Gentle follow-up Dec 7 if nothing has been sent.
- **Flag:** none (no code). **Audience:** Spain host and co-host.
- **Success (decided now):** the Dec 12 meal is created **≥ 3 days before** (on or before Dec 9) **and** ≥ 6 of 21 non-host members open the group page within 7 days (above the 25% baseline).
- **Kill:** the host asks to stop, or there's no reply by Dec 9. Then switch to A5 (Landon sends it as co-host, with consent) and capture the "why".
- **Rollback:** nothing to roll back.
```sql
-- Meal sent on time? (live groups, QA excluded)
select g.country_slug, k.meeting_date, k.created_at::date as sent_on,
       k.meeting_date - k.created_at::date as days_ahead
from kits k join groups g on g.id = k.group_id
where g.status in ('active','full') and g.id <> '488ee5be-5a52-432d-981e-69488f519a8d'
  and k.meeting_date >= '2026-12-01'
order by k.meeting_date;

-- Members who opened the group page within 7 days of that meal
select k.meeting_date, count(distinct v.member_id) as members_opened
from kits k join groups g on g.id = k.group_id
join group_page_views v on v.group_id = g.id
 and v.viewed_at between k.created_at and k.created_at + interval '7 days'
where g.status in ('active','full') and g.id <> '488ee5be-5a52-432d-981e-69488f519a8d'
  and k.meeting_date >= '2026-12-01'
group by 1 order by 1;
```
Caveat: link scanners can inflate `group_page_views` (G7). Cross-check with the Mixpanel funnel `kit_email_sent` → `group_detail_viewed` (7 days).

### X2: Automated meal reminder (bet A2, only after X1 shows the nudge works)
- **Flag:** env `MEAL_REMINDER_GROUPS=<Spain group id>` (unset = off). It is independent of `auto_messages`. **Audience:** Spain hosts only. Members get nothing new.
- **Pre-launch:** a dry run with `/api/cron/gathering?group=<id>&now=2027-01-01T15:00:00Z&dry=1&preview=1` should show exactly one `host_reminder_meal` action. A preview with a kit already present should show zero.
- **Success:** January's meal is sent ≥ 3 days ahead with **no** human nudge, and 2 of the next 3 gatherings meet that bar.
- **Kill:** unset the env var (it takes effect on the next hourly run). Also kill if the host replies "stop".
- **Rollback:** revert the commit. No data to migrate. Claims are stored in `gathering_sends` under new kinds, so the rows are harmless.
```sql
select s.kind, s.meeting_date, s.recipients, s.sent_at
from gathering_sends s join groups g on g.id = s.group_id
where g.id <> '488ee5be-5a52-432d-981e-69488f519a8d' and s.kind like 'host_reminder_meal%'
order by s.sent_at desc;
```

### X3: Approval that can't be missed (bet B)
- **Now (concierge, no code):** Landon reviews pending groups weekly using the query below. **Kosovo first:** after five months, contact the host personally before approving, so the group doesn't go live with an absent host.
- **Build:** B1 + B2 + B4 (admin-only surfaces; members are unaffected). B3 when there's time.
- **Success:** **no group pending longer than 48 h** for 4 consecutive weeks. Every approval produces a "you're live" email (the `group_approved` event count equals the approvals).
- **Kill:** the digest can be switched off with env `ADMIN_DIGEST=off`. **Rollback:** revert the commit. The `approved_at` column is additive and nullable, so it can stay.
```sql
select count(*) filter (where status = 'pending') as pending,
       count(*) filter (where status = 'pending' and created_at < now() - interval '48 hours') as pending_over_48h,
       max(now() - created_at) filter (where status = 'pending') as oldest_wait
from groups where id <> '488ee5be-5a52-432d-981e-69488f519a8d';
```

### X4: Automatic "Are you in?" and thank-you for Spain (bet C)
- **Preconditions:** the Dec 12 meal is sent (X1), and the host has agreed and flips the toggle **themselves** in Settings (so `auto_messages_toggled` records the consent). Before the first send, Landon runs a dry-run preview to check the copy.
- **Audience:** Spain's 21 accepted members other than the hosts. The host reminder lands Dec 7, "Are you in?" Dec 9 at 09:00, thank-you Dec 13 at 18:00.
- **Success:** **≥ 7 of 21** members answer for Dec 12, **0** complaints or "stop" replies, and ≥ 1 table post after the thank-you email.
- **Kill:** the host turns the toggle off (one click; the loop skips the group from the next hour). Landon kills on any complaint.
- **Rollback:** the toggle. Emails already sent can't be recalled, so preview first.
```sql
select r.meeting_date,
       count(*) filter (where r.status = 'in')  as in_count,
       count(*) filter (where r.status = 'out') as out_count
from gathering_rsvps r join groups g on g.id = r.group_id
where g.status in ('active','full') and g.id <> '488ee5be-5a52-432d-981e-69488f519a8d'
  and r.meeting_date = '2026-12-12'
group by 1;
```
Note: the one existing Dec 12 answer is the co-host's test. Subtract host and co-host answers when judging.

### X5: Start a Group fake door (bets D1 + D2)
- **Flag:** env `START_LITE=on` (unset = today's form). **Audience:** all `/start` visitors (about 8 a month).
- **Change:** D1 fixes plus a "help me set it up" box with 3 fields. It emails the admin (with error checking) and sends a server event. No DB write.
- **Success (absolute, because the volume is tiny):** **≥ 2 genuine host-interest submissions in 6 weeks**, *or* ≥ 20% of `/start` viewers start any field (baseline 3/49 ≈ 6%).
- **Kill:** unset `START_LITE`. **Rollback:** revert the commit.
- **Mixpanel:** unique `host_interest_submitted` ÷ unique `start_group_page_viewed`, plus `start_form_started` (G3), for the experiment window, excluding `is_internal` (G9).
```sql
-- Source of truth for real submissions of the full form
select date_trunc('week', created_at)::date as week, count(*) as groups_submitted
from groups where id <> '488ee5be-5a52-432d-981e-69488f519a8d' and created_at >= '2026-06-04'
group by 1 order by 1;
```

### X6: Member re-engagement (bet E): measured inside X1
No separate send. Judge it by X1's "members opened within 7 days" and by December "Are you in?" answers. A standalone broadcast waits for R7 (unsubscribe) and a host who wants to write it.

---

## Order I'd run things
1. **X0** (DB lockdown) and the **R2** token scrub. These are trust-critical and quick, and every later bet that adds a table depends on X0.
2. **X1** (concierge meal) and **X3-now** (Landon contacts the Kosovo host). Both need no code and fit before Dec 2.
3. **B1 / B2 / B4**, **G1 / G2 / G5 / G6** (S each), and the Next.js upgrade (R5).
4. **X4** after the December meal goes out, **X2** in January, **X5** whenever.

## What I couldn't check
- Resend delivery history and domain authentication (no Resend access; DoH blocked).
- Netlify function logs for the gathering loop and server actions (I inferred the loop's health from Supabase edge logs instead).
- Supabase logs older than about 24 hours, including the June submission.
- Session replays, which I deliberately didn't open because they may show tokens and member data. Landon can watch the three `/start` sessions where someone typed.
- Whether the legacy anon key ever shipped to browsers through a transitive import (no direct client import found).
