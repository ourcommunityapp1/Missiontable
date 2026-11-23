# Mission Table admin handbook

Welcome! As an admin you help Mission Table do its one job: get believers around tables, eating and praying for the nations, month after month. In practice that means **saying yes to new groups quickly** and **noticing when a group needs a hand**.

## Your dashboard
Your private link is `missiontable.org/admin/<your token>` (it's in your welcome email). It *is* your login, so bookmark it and don't share it. Lost it? Another admin can add you again, or ask Landon.

The dashboard has four parts:

| Section | What it shows | What you do |
|---|---|---|
| **Needs you** | New groups waiting for approval · join requests a host hasn't answered for 3+ days · a live group's next meal not sent within 10 days of the gathering · groups that missed 2 of their last 3 meals | Approve or decline new groups; check in with hosts |
| **All groups** | Every group with members, waiting requests, last and next meal, automatic emails, members with the app | Open any host's dashboard to help them |
| **Admins** | Who else is an admin, when they last visited | Add an admin (they get an email with their own link) |
| **Tools** | Analytics, hosting, database, email, the weekly discovery brief | Usually just look |

Items marked **overdue** (rust colour) have waited too long.

## Every week (10 minutes)
1. Open your dashboard. Anything in **Needs you**?
2. **New group waiting?** Review it the same day if you can (we tell hosts "usually within 2 days").
3. **Join requests waiting?** Nudge the host, or open their dashboard and help.
4. **Meal not sent / gone quiet?** Email or text the host. Offer to help write the meal. Be kind: hosts are often missionaries far from home, busy and tired.
5. Skim the Monday **Discovery brief** (a GitHub PR from the product trio) for anything that needs a decision.

## Reviewing a new group
Before approving, check:
- **Is the host real and aligned?** They affirmed the [beliefs](../mission-table-beliefs.md) and the hosting commitment in the form. If anything looks off (spam, a business, a different mission), email them first.
- **Is the country right, and is the name sensible?**
- **Any safety concern?** For sensitive countries, groups can use discreet names; that's fine.

Then press **Approve**. The group goes live on its country page at once, and the host gets a "your group is live" email with their dashboard link and next steps.

**Decline** hides the group (nothing is deleted) and sends *no* email: always reach out to the host personally and kindly first, then decline if it's not a fit.

Old admin emails have an "Approve This Group" link. It still works, but now shows a confirmation button first.

## Helping a host
- **Open their host dashboard** from the group card. You'll see exactly what they see and can act on their behalf (approve members, write a meal, post a field update). Tell the host when you do.
- The single most important thing a host does is **send the monthly meal a few days before the gathering**. If a group goes quiet, it's almost always this. Offer to draft it for them.
- Automatic "Are you in?" and thank-you emails are **off** until a host turns them on (Settings → Automatic emails). Encourage hosts to turn them on once their meal goes out.
- Hosts can email everyone who hasn't put the group on their phone (Settings → The group app).

## Adding or removing admins
- **Add**: Admins section → name + email → "Add and email their link".
- **Remove**: ask Landon (or set `active = false` for them in the `admins` table in Supabase).

## Privacy
- Host, member and admin links contain private tokens. Never paste them in public places, GitHub issues or screenshots you share.
- The GitHub repo is **public**. Never commit names, emails, phone numbers or links of real people.
- Member lists are for running groups, not for anything else.

## Where things live
| Thing | Where |
|---|---|
| The site | missiontable.org (Netlify project `mesademision`) |
| Database | Supabase project `MissionTableProject` |
| Email | Resend (sends from `noreply@requesttojoin.missiontable.org`); the shared inbox is projectmissiontable@gmail.com |
| Analytics | Mixpanel project "Mission Table" |
| Code | github.com/ourcommunityapp1/Missiontable (app in `mission-table/`; system notes in `mission-table/AGENTS.md`) |
| Product discovery | `docs/discovery/` and the weekly "Discovery brief" PRs |

## Known open items (Nov 2026)
- **Database lockdown**: the site still uses the public database key with open access rules. Fix in this order: (1) add `SUPABASE_SERVICE_ROLE_KEY` in Netlify (Site configuration → Environment variables, secret, Functions scope), (2) redeploy and confirm requests run as `service_role`, (3) apply `supabase/migrations/005_lock_down_rls.sql`. Doing step 3 first takes the site down.
- **Analytics identity**: members are identified in Mixpanel by their member token (so meal emails can be matched to visits). Only admins should have Mixpanel access.
- **A group waiting since June** (Kosovo) and **two join requests from June** in Spain: the first things in your Needs you list.
