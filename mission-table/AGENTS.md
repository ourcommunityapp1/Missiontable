<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Mixpanel Analytics

- **Project token**: `b1a62bc7bfb11d336a7fe640b2637320`
- **Env var**: `NEXT_PUBLIC_MIXPANEL_TOKEN` (set in `.env.local` and Netlify)
- **Init**: `src/lib/mixpanel.ts` — `initMixpanel()` called once by `MixpanelProvider`
- **Page views**: Auto-tracked on every route change via `src/components/MixpanelProvider.tsx` (in root layout)
- **Custom events (client)** — call `track(eventName, props)` from `src/lib/mixpanel.ts` in any client component
- **Custom events (server)** — call `trackServer(eventName, distinctId, props)` from `src/lib/mixpanelServer.ts` in server actions. Posts directly to the Mixpanel HTTP `/track` API (no SDK dependency).
- **Identity** — a member's `member_token` (the same token embedded in their group-page email links, e.g. `/group/[id]?token=...`) is used as the Mixpanel `distinct_id` for both server-side send events and the client-side `identify()` call on page view. This lets kit-send → group-page-view funnels join on identity instead of just timing.

### Tracked events

| Event | Trigger | Key Properties | File |
|---|---|---|---|
| `Page View` | Every route change | `path`, `page_type`, + route-specific ID | `MixpanelProvider.tsx` |
| `country_page_viewed` | Country page loads | `country_slug`, `country_name`, `region`, `group_count`, `has_groups` | `country/[slug]/CountryPageTracker.tsx` |
| `group_detail_viewed` | Group detail page loads | `group_id`, `country_slug`, `country_name`, `group_type`, `group_name`, `member_count`, `is_member_view` | `group/[id]/GroupPageTracker.tsx` |
| `start_group_page_viewed` | /start page loads | `default_country` (if pre-selected) | `start/StartGroupForm.tsx` |
| `group_started` | Host submits Start a Group form | `country_slug`, `group_name`, `group_type`, `host_type`, `rhythm_type`, `meeting_time`, `timezone`, `start_date`, `city`, `state`, `day_of_month`, `week_of_month`, `day_of_week`, `max_size` | `start/StartGroupForm.tsx` |
| `join_group_page_viewed` | /join/[id] page loads | `group_id`, `country_slug`, `country_name`, `group_type`, `group_name` | `join/[id]/JoinGroupForm.tsx` |
| `group_join_requested` | Member submits Join a Group form | `group_id`, `country_slug`, `country_name`, `group_type`, `has_church`, `city`, `state` | `join/[id]/JoinGroupForm.tsx` |
| `member_approved` (server) | Host approves a join request | `group_id` — distinct_id is the member's `member_token` | `host/[token]/actions.ts` |
| `kit_email_sent` (server) | A kit email is sent to a member (new kit or resend) | `group_id`, `kit_id`, `meeting_date`, `resend` — distinct_id is the member's `member_token` | `host/[token]/kit/new/actions.ts`, `host/[token]/actions.ts` |
| `meal_gathered_toggled` (server) | Member marks/unmarks themselves as gathered for a meal, on the Meals tab | `group_id`, `kit_id`, `gathered` — distinct_id is the member's `member_token` | `group/[id]/actions.ts` |
| `field_post_created` (server) | Host publishes a From the Field update | `group_id`, `post_id`, `has_video` — distinct_id is the **host's `host_token`** (new precedent — every other server event uses `member_token`; not PII, same opaque-token posture) | `host/[token]/field-post/new/actions.ts` |
| `field_post_reaction_toggled` (server) | Member reacts/unreacts to a field post | `group_id`, `post_id`, `reacted` — distinct_id is the member's `member_token` | `group/[id]/actions.ts` |
| `field_post_comment_added` (server) | Member adds a comment to a field post | `group_id`, `post_id` — distinct_id is the member's `member_token` | `group/[id]/actions.ts` |
| `gathering_rsvp_set` (server) | Member answers "Are you in?" (group page or one-tap email link) | `group_id`, `meeting_date`, `status` (`in`/`out`) — distinct_id is the member's `member_token` | `group/[id]/loopActions.ts` |
| `table_post_shared` (server) | Member shares a table photo and/or prayer line on Our table | `group_id`, `meeting_date`, `has_photo`, `has_prayer` — distinct_id is the member's `member_token` | `group/[id]/loopActions.ts` |
| `meal_invite_sent` (server) | Member invites others from the group to eat together | `group_id`, `invite_id`, `guests`, `place_type` — distinct_id is the inviter's `member_token` | `group/[id]/loopActions.ts` |
| `meal_invite_guests_added` (server) | Inviter adds more people to an existing invitation | `group_id`, `invite_id`, `guests` — distinct_id is the inviter's `member_token` | `group/[id]/loopActions.ts` |
| `meal_invite_responded` (server) | Guest accepts or declines an invitation | `group_id`, `invite_id`, `status` — distinct_id is the guest's `member_token` | `group/[id]/loopActions.ts` |
| `meal_invite_cancelled` (server) | Inviter cancels an invitation | `group_id`, `invite_id` — distinct_id is the inviter's `member_token` | `group/[id]/loopActions.ts` |
| `host_note_saved` (server) | Host saves an "Are you in?" or thank-you note | `group_id`, `kind`, `meeting_date`, `skip`, `has_body` — distinct_id is the host's `host_token` | `host/[token]/actions.ts` |
| `chat_message_sent` (server) | Member or host posts in the group chat | `group_id`, `author_kind` (`member`/`host`) — distinct_id is the poster's `member_token` or `host_token` | `src/lib/chatActions.ts` |
| `chat_message_removed` (server) | A message is removed (own message, or any message by a host) | `group_id`, `author_kind` (who removed it) | `src/lib/chatActions.ts` |
| `auto_messages_toggled` (server) | Host turns automatic emails on/off | `group_id`, `on` — distinct_id is the host's `host_token` | `host/[token]/actions.ts` |

`Page View` page_type values: `home`, `browse`, `country`, `group_detail`, `join_group`, `start_group`, `about`, `host_dashboard`, `host_login`, `host_kit_new`, `host_kit_edit`, `host_group_edit`, `host_field_post_new`, `other`

### Building the "kit send → group page viewed" funnel
In Mixpanel, create a Funnel with step 1 = `kit_email_sent` and step 2 = `group_detail_viewed`. Since both events share the member's `member_token` as `distinct_id`, Mixpanel will match them per-member automatically — no query params or manual joins needed.

### Naming conventions
- Event names: `snake_case`, `object_verb` pattern
- Property names: `snake_case`
- No PII in event **properties** (no names, emails, phone numbers). The `member_token` used as `distinct_id` is an opaque per-member token, not PII, and is required to join server-side send events with client-side page views.

## Gathering loop (automatic emails)

- `src/lib/gathering.ts` holds the schedule (`LOOP_SCHEDULE`), date math (group time zone), email builders and `runGatheringLoop`.
- `/api/cron/gathering` (Bearer `CRON_SECRET`) runs it; `netlify/functions/gathering-loop.mts` calls it hourly. Each send is claimed in `gathering_sends` first, so it goes out at most once. Testing: `?group=<id>&now=<ISO>&dry=1&preview=1`.
- Only groups with `groups.auto_messages = true` get emails; hosts turn it on in Overview or Settings.

## Group chat

- One chat per group for members and hosts: `src/lib/chat.ts` (server), `src/lib/chatActions.ts` (send/remove), `/api/chat` (read + refresh, POST), `src/components/ChatPanel.tsx` (UI, refreshes every 4s while open).
- Tables `chat_messages` and `chat_reads` (unread badges), created by migration `008_group_chat.sql`. The older `group_chat_messages` table from 002 is empty and unused.
- `GROUP_CHAT=on` (Netlify env var, set) turns the Chat tabs on for the member page and host dashboard; without it chat is hidden and `/api/chat` refuses requests.

## Videos in field posts

- `src/lib/video.ts` turns YouTube (incl. Shorts/live), Vimeo and Facebook video/reel links into in-app players; `src/components/VideoEmbed.tsx` shows a poster and loads the player only when tapped. Other links open the site in a new tab.

## Home-screen app icons

- A member's installed group app uses the group's country photo as its icon (`src/lib/appIcons.ts`, used by the group page's Apple touch icon and the per-member manifest).
- After adding a country photo to `public/images/countries`, run `node scripts/make-country-icons.cjs` and add the slug to `COUNTRY_ICONS`.
