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

`Page View` page_type values: `home`, `browse`, `country`, `group_detail`, `join_group`, `start_group`, `about`, `host_dashboard`, `host_login`, `host_kit_new`, `host_kit_edit`, `host_group_edit`, `host_field_post_new`, `other`

### Building the "kit send → group page viewed" funnel
In Mixpanel, create a Funnel with step 1 = `kit_email_sent` and step 2 = `group_detail_viewed`. Since both events share the member's `member_token` as `distinct_id`, Mixpanel will match them per-member automatically — no query params or manual joins needed.

### Naming conventions
- Event names: `snake_case`, `object_verb` pattern
- Property names: `snake_case`
- No PII in event **properties** (no names, emails, phone numbers). The `member_token` used as `distinct_id` is an opaque per-member token, not PII, and is required to join server-side send events with client-side page views.
