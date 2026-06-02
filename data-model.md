# Mission Table — Data Model

## Decisions recorded

- Hosts and members each get a UUID now; `auth_user_id` column reserved for when accounts are added later
- No auth in v1 — contact info only
- Join request triggers a single email to the host with member contact info; host handles acceptance off-platform
- Member gets a confirmation email when they request to join; no platform email for acceptance
- Same person can join multiple groups — email is unique identity, reuse existing member record on second join
- Groups have a `start_date` and `end_date` (start + 1 year); no auto-expiry in v1, status changed manually
- Rhythm is structured (two monthly patterns) + timezone captured
- Host type captured: individual, church, or organization

---

## Tables

### `hosts`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid, PK | Auto-generated |
| `name` | text | Full name or org name |
| `email` | text, unique | Receives join request notifications |
| `phone` | text, nullable | Optional |
| `host_type` | enum | `individual` / `church` / `organization` |
| `auth_user_id` | uuid, nullable | Empty until accounts are added |
| `created_at` | timestamptz | |

---

### `groups`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid, PK | |
| `country_slug` | text | References static country data (e.g. `spain`) |
| `host_id` | uuid, FK → hosts | |
| `group_type` | enum | `in-person` / `virtual` |
| `city` | text, nullable | In-person only |
| `state` | text, nullable | In-person only |
| `rhythm_type` | enum | `date_of_month` / `day_of_week_pattern` |
| `day_of_month` | integer, nullable | 1–28. Used when `rhythm_type = date_of_month` (e.g. "the 15th") |
| `week_of_month` | integer, nullable | 1–4. Used when `rhythm_type = day_of_week_pattern` (e.g. "3rd") |
| `day_of_week` | text, nullable | e.g. `sunday`. Used when `rhythm_type = day_of_week_pattern` |
| `meeting_time` | time | 24hr format, e.g. `18:00` |
| `timezone` | text | IANA timezone, e.g. `America/Chicago` |
| `max_size` | integer, nullable | In-person only; host sets their own |
| `status` | enum | `active` / `full` / `inactive`. Default `active` |
| `start_date` | date | When the group begins meeting |
| `end_date` | date | Stored as start_date + 1 year for query convenience |
| `created_at` | timestamptz | |

**Rhythm display logic:**
- `date_of_month`: render as "The {day_of_month}th of every month at {time} {tz}"
- `day_of_week_pattern`: render as "Every {week_of_month}{suffix} {day_of_week} at {time} {tz}"
  - e.g. week=3, day=sunday → "Every 3rd Sunday at 6:00 PM CT"

---

### `members`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid, PK | |
| `name` | text | |
| `email` | text, unique | Used to deduplicate — same person joining two groups reuses this record |
| `phone` | text, nullable | |
| `auth_user_id` | uuid, nullable | Empty until accounts are added |
| `created_at` | timestamptz | |

---

### `memberships`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid, PK | |
| `group_id` | uuid, FK → groups | |
| `member_id` | uuid, FK → members | |
| `status` | enum | `pending` / `accepted` / `declined`. Default `pending` |
| `requested_at` | timestamptz | |
| `updated_at` | timestamptz | |

**Unique constraint:** `(group_id, member_id)` — one membership record per person per group.

---

## Relationships

```
hosts ──< groups ──< memberships >── members
```

- One host → many groups
- One group → many memberships
- One member → many memberships (can pray for multiple countries)

---

## Notification flows

**Start a Group:**
1. Form creates `hosts` record (upsert on email) + `groups` record
2. Group appears on country page immediately (no approval step in v1)
3. *(future)* confirmation email to host

**Join a Group:**
1. Form creates `members` record (upsert on email) + `memberships` record (status: `pending`)
2. Email fires to `host.email` with member name, email, and phone
3. Confirmation email fires to member: "Your request was received"
4. Host accepts off-platform (text, WhatsApp, email, adds to group chat)
5. `memberships.status` stays `pending` — updated when admin tooling is built

---

## TypeScript types (Next.js)

```typescript
export type HostType = 'individual' | 'church' | 'organization';
export type GroupType = 'in-person' | 'virtual';
export type RhythmType = 'date_of_month' | 'day_of_week_pattern';
export type GroupStatus = 'active' | 'full' | 'inactive';
export type MembershipStatus = 'pending' | 'accepted' | 'declined';

export type Host = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  hostType: HostType;
  authUserId: string | null;
  createdAt: string;
};

export type Group = {
  id: string;
  countrySlug: string;
  hostId: string;
  groupType: GroupType;
  city: string | null;
  state: string | null;
  rhythmType: RhythmType;
  dayOfMonth: number | null;       // 1–28, used when rhythmType = 'date_of_month'
  weekOfMonth: number | null;      // 1–4, used when rhythmType = 'day_of_week_pattern'
  dayOfWeek: string | null;        // e.g. 'sunday', used when rhythmType = 'day_of_week_pattern'
  meetingTime: string;             // HH:MM
  timezone: string;                // IANA, e.g. 'America/Chicago'
  maxSize: number | null;
  status: GroupStatus;
  startDate: string;               // ISO date
  endDate: string;                 // ISO date, startDate + 1 year
  createdAt: string;
};

export type Member = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  authUserId: string | null;
  createdAt: string;
};

export type Membership = {
  id: string;
  groupId: string;
  memberId: string;
  status: MembershipStatus;
  requestedAt: string;
  updatedAt: string;
};
```

---

## What stays static (no database table needed)

- **Countries** — stays in `src/data/countries.ts`. Groups reference countries by `slug` only.
- **JP Scale descriptions** — stays in `src/data/jpScale.ts`.

---

## Open for v2

- Auth accounts for hosts and members (link via `auth_user_id`)
- Host dashboard to view/manage members
- Member portal to see their groups
- Renewal flow when `end_date` approaches
- Admin approval before groups go live
- Waitlist when in-person group is full
- "Want to host a group?" subtext becomes dynamic based on group count
