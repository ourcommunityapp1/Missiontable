# Mission Table — Project Context

## What this product is
Mission Table (missiontable.org) helps small communities gather monthly around a shared meal, focused prayer, and scripture — each group "adopts" one country for a full year, praying for that nation's people. The site lets a **Host** start a group for a specific country, other people **Join** that group as **Members**, and the host sends a monthly **Kit** (recipe, scripture, prayer requests, gathering prompt) to the group's members before each gathering.

It's a small, mission-driven (nonprofit/ministry-style) project, not a SaaS product with a large team — treat metrics questions with that scale in mind (dozens–hundreds of groups/members, not millions of users).

## Core entities / terminology
- **Country page** — a page per country (e.g. `/country/bangladesh`) showing that nation's people-group data (from The Joshua Project), a "JP Scale" of 1 (Unreached) to 5 (Significantly Reached), and any active groups praying for it. This is the primary discovery surface — most visitors land here first.
- **Group** — a Mission Table gathering tied to one country. Either **in-person** (has a city/state) or **virtual** (members join remotely from anywhere, meeting at the same synchronized time). Groups have a lifecycle status: `pending` (submitted by a host, awaiting approval) → `active` (approved, publicly listed) → `inactive`.
- **Host** — the person who started and runs a group. Has a private dashboard at `/host/[token]` (token-based auth, no password) where they approve/deny join requests, manage the group, and send Kits.
- **Member** — someone who requested to join a group. Membership status: `pending` (requested, awaiting host approval) → `accepted` (approved by host, now has access to the group page and receives kits).
- **Member token** — a unique opaque token per member, embedded in every email link that goes to their group page (`/group/[id]?token=...`). It's what gates access to the "members-only" content on a group page (member roster, latest kit) for non-hosts. This token is reused as the **Mixpanel distinct_id** for that member (see Identity model below).
- **Kit** — a monthly package a host sends to all accepted members (and a copy to themselves) via email: recipe, scripture + reference, commentary, prayer requests, gathering prompt. Also viewable on the group page itself ("This Month's Kit"). A kit can be sent for the first time or **resent**.

## Key user journeys
1. **Discover → Join**: visitor browses `/browse` → picks a **country page** → views a group's `/group/[id]` detail page → clicks "Join This Group" → fills out the join form (`/join/[id]`) → becomes a `pending` member until the host approves them.
2. **Host a group**: visitor goes to `/start` → fills out the Start a Group form → group is created as `pending`, host gets a bookmarkable dashboard link (`/host/[token]`), waits for admin approval to go `active`.
3. **Kit send → engagement**: host sends a Kit from their dashboard → each accepted member gets an email with a "View Your Group Page" button (link includes their `member_token`) → member (hopefully) clicks through and views the group page to see the kit, prayer requests, and who else is in the group.

## Identity model (important for funnel analysis)
- Anonymous site browsing uses Mixpanel's default anonymous/device ID — no identify() call.
- The moment a member opens their group page via a valid `?token=` link (from a kit email or approval email), the client calls `identify(member_token)`. Any server-side events already fired for that same member (see below) were tracked with that same `member_token` as `distinct_id`, so they merge into one identity in Mixpanel.
- This means: **kit-send events and the resulting group-page view can be joined per-member in a Funnel report**, not just inferred from timing.

## Event catalog
| Event | Fired from | Trigger | Key properties |
|---|---|---|---|
| `Page View` | client, every page | Any route change, site-wide | `path`, `page_type` (`home`, `browse`, `country`, `group_detail`, `join_group`, `start_group`, `about`, `host_dashboard`, `host_login`, `host_kit_new`, `host_kit_edit`, `host_group_edit`, `other`) + route-specific id (e.g. `country_slug`, `group_id`) |
| `country_page_viewed` | client | A country page loads | `country_slug`, `country_name`, `region`, `group_count`, `has_groups` |
| `group_detail_viewed` | client | A group's detail page loads | `group_id`, `country_slug`, `country_name`, `group_type`, `group_name`, `member_count`, `is_member_view` (true when opened via a valid member token) |
| `start_group_page_viewed` | client | `/start` page loads | `default_country` (if pre-selected via URL) |
| `group_started` | client | Host submits the Start a Group form | `country_slug`, `group_name`, `group_type`, `host_type`, `rhythm_type`, `meeting_time`, `timezone`, `start_date`, `city`, `state`, `day_of_month`, `week_of_month`, `day_of_week`, `max_size` |
| `join_group_page_viewed` | client | `/join/[id]` page loads | `group_id`, `country_slug`, `country_name`, `group_type`, `group_name` |
| `group_join_requested` | client | Someone submits the Join a Group form | `group_id`, `country_slug`, `country_name`, `group_type`, `has_church`, `city`, `state` |
| `member_approved` | **server** | Host approves a pending join request | `group_id` — `distinct_id` = the member's `member_token` |
| `kit_email_sent` | **server** | A kit email is sent to a member — new kit creation or a resend | `group_id`, `kit_id`, `meeting_date`, `resend` (true/false) — `distinct_id` = the member's `member_token` |

Server-side events are posted directly to Mixpanel's HTTP `/track` API from Next.js server actions (not through the browser SDK), since they fire from backend email-send code with no client present.

## Metrics we care about most
1. **Country page → group interest**: which country pages get traffic (`country_page_viewed`), and whether that traffic converts into a group page view or join request. Countries with high views but `has_groups: false` are candidates to prompt "Start a Group" campaigns.
2. **Kit engagement**: for each `kit_email_sent`, does the same member subsequently fire `group_detail_viewed`? This is the core "did people actually open and read the kit" funnel — build it as a 2-step Funnel (`kit_email_sent` → `group_detail_viewed`), which auto-joins per-member since both share `distinct_id` = `member_token`.
3. **Join funnel**: `group_detail_viewed` (non-member) → `join_group_page_viewed` → `group_join_requested` — where do prospective members drop off before requesting to join?
4. **Group creation funnel**: `start_group_page_viewed` → `group_started` — how many people who look at the Start a Group form actually submit it.

## Naming conventions
- Event names: `snake_case`, roughly `object_verb` (e.g. `group_join_requested`, not `request_group_join`).
- Property names: `snake_case`.
- No PII in event properties — no member names, emails, or phone numbers are ever sent to Mixpanel. The one exception is `member_token` used as `distinct_id`, which is an opaque per-member identifier (not directly identifying on its own) required to join server-side send events with client-side page views.
