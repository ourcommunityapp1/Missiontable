# Screen 3 & 4 — Country Page Design Requirements

## Overview
Two states of the same page template at `/country/[slug]`.
- **Screen 3** — Country has at least one group (seeded state)
- **Screen 4** — Country has no groups yet (empty state — needs its own design)

---

## Key Design Decisions

### Layout
- Desktop: left sidebar (stat boxes) + right main content (groups list) — NOT two stat boxes side by side
- Mobile: stat boxes stacked, full-width groups below
- Full-width hero photo at top with country name and region tag overlaid
- Bottom CTA section appears on every country page (seeded and empty)

### Population Format
- Display as `47.8M souls`, `84.0M souls`, `1.6M souls`, `850K souls`
- Use "souls" instead of "people" throughout
- Billions format: `1.45B souls`
- **Mobile**: two-line treatment — `47.8M` (huge Fraunces) on first line, `souls` below
- **Desktop**: single line — `47.8M souls` all on one line

### Group Card Types
Two card types — both same visual shell, different data fields:
- **Type A — In-Person**: has `LOCATION` row (city) + `ROSTER` row (count + spots). `groupType: "in-person"`
- **Type B — Virtual/Home**: no location row, no roster row. Members gather in their own homes simultaneously. `groupType: "virtual"`

### Group Card Description Text
Auto-generated from `groupType`:
- In-person: *"Open to members who are willing to meet monthly with other families at this location."*
- Virtual: *"Open to members everywhere. All members meet and pray at the same time in their own home."*

### Mission Table Global Card
- Placeholder only — not a real permanent group
- Remove before launch; used in design/prototype to show the distributed home model

### Progress Scale Description
- Use **official JP descriptions verbatim** from `AllProgressLevelsListing.csv` — hardcoded per scale level, same text for every country at that scale
- Do NOT use country-specific custom descriptions
- No denomination in Primary Religion — CSV only provides religion name (e.g. `Christianity`, not `Christianity (Catholic)`)

| Scale | Label | Official Description (hardcoded) |
|---|---|---|
| 0.1 | Unreached (Frontier) | Less than 1 in 1,000 (0.1%) identify as Christians in any way. |
| 0.5 | Unreached (non-Frontier) | Few evangelicals and little, if any, history of Christianity. |
| 1 | Unreached (All) | Few evangelicals and few who identify as Christians. Little, if any, history of Christianity. |
| 2 | Minimally Reached | Few evangelicals, but significant number who identify as Christians. |
| 3 | Superficially Reached | Few evangelicals, but many who identify as Christians. In great need of spiritual renewal and commitment to biblical faith. |
| 4 | Partially Reached | Evangelicals have a modest to moderate presence. |
| 5 | Significantly Reached | Evangelicals have a significant presence. |

- Evangelical % thresholds:
  - Scales 1–3: Evangelicals ≤ 2%
  - Scale 4: Evangelicals > 2% and ≤ 10%
  - Scale 5: Evangelicals > 10%

### Terminology — Always "Group", Never "Table"
- `GROUPS FOR SPAIN` — section heading
- `JOIN THIS GROUP →` — button on group cards
- `START A GROUP →` — button on "Want to Host a Group?" section (no country name)
- `WANT TO HOST A GROUP?` — section heading (Fraunces bold uppercase)
- Internal data file: `src/data/groups.ts`, type `Group`, function `getGroupsForCountry()`

### "Want to Host a Group?" Subtext — Backend TODO
The subtext currently hardcodes "Be the first to start a Mission Table for [Country]."
When hooked up to a backend this must become dynamic:
- **No groups exist**: "Be the first to start a Mission Table for [Country]."
- **Groups exist**: "Start your own group for [Country]." (or similar)
Wire this to `hasTables` / live group count when backend is connected.

### "About JP Scale" Inset Box
- Compact inset box (lighter bg, black border) inside Box 2
- Short summary: *"The Joshua Project Scale measures progress from 1 (Unreached) to 5 (Significantly Reached)."*
- `Learn More ↗` link to joshuaproject.net

### Data Attribution
- Box 2 label reads `PROGRESS SCALE*` with asterisk
- Footer of Box 2: `*Data from The Joshua Project`
- Box 1 footer: `Data from The Joshua Project` (no asterisk)

### Bottom CTA Section (all pages)
- Heading: `WANT TO HOST A TABLE?`
- Subline: `Be the first to start a Mission Table for [Country].`
- Button: `START A TABLE FOR [COUNTRY] →`
- Background: cream, 2px black border — no color fill
- ⚠️ Note: mobile design shows `CAN'T FIND A TABLE?` as heading; desktop shows `WANT TO HOST A GROUP?`. Confirmed decision: use `WANT TO HOST A TABLE?` on both.

### Hero — Country Name Treatment
- Both mobile and desktop: solid white text, bottom-left of hero, inside the image boundary
- No ghosted/transparent large text bleeding into content below (simpler, easier to build responsively)

---

## Page Structure (top → bottom)

### 1. Back Navigation
- Top of page (above hero): `← THE NATIONS`
- Inter semibold, small uppercase, underline style — matches Screen 2 back button

### 2. Hero
- Full-width country photo, grayscale
- Region tag overlay (top-left, cream bg, black border, Inter 10px uppercase): e.g. `EUROPE`
- Country name overlay (bottom-left, white text, large Fraunces bold uppercase): `SPAIN`
- Dark gradient overlay at bottom for legibility

### 3. Field Report — Two Boxes (stacked mobile, side-by-side desktop)

#### Box 1 — FIELD REPORT
- Section label: `FIELD REPORT` (Inter semibold uppercase tracking)
- Population: two-line large treatment — `47.8M` (huge Fraunces) + `souls`
- Thin divider
- Stat rows (label left, value right-aligned):
  - Primary Religion → e.g. `Christianity`
  - % Evangelical → e.g. `1.6%` (accent color `#390C00`)
  - People Groups → e.g. `78`
  - Least Reached → e.g. `12`
  - 10/40 Window → e.g. `No`
- Thin divider
- Footer: `Data from The Joshua Project` (small, muted)
- 2px black border around box

#### Box 2 — PROGRESS SCALE*
- Section label: `PROGRESS SCALE*`
- Visual dots: 5 circles. Filled black = active, cream + black border = inactive
  - Scale 3 → `● ● ● ○ ○`
- Status name: `SUPERFICIALLY REACHED` (large Fraunces uppercase)
- Scale number: `SCALE 3 OF 5` (small Inter muted)
- Body text: official JP description for this scale level (see table above)
- Compact inset box: short JP Scale summary + `Learn More ↗`
- Footer: `*Data from The Joshua Project`
- 2px black border around box

---

### 4. Tables Section — Screen 3 (has groups)

**Section header (border-t-2 black):** `TABLES FOR [COUNTRY]`
**Subline:** `[N] group[s] praying for this nation.`

Two distinct card types exist. Both share the same visual shell (2px black border, full-width mobile) but render different data fields and connect to different data models.

---

#### Card Type A — In-Person Group
A group that meets at a specific physical location (host's home or venue) in a specific city. Membership is limited by space.

**Data fields:**
- `HOSTED BY` label
- Host name: e.g. `Daniel & Maria R.`
- Auto-generated description: *"Open to members who are willing to meet monthly with other families at this location."*
- 📍 `LOCATION` — `Austin, TX` ← **present on this card type only**
- 📅 `RHYTHM` — `Every 3rd Sunday` · 🕐 `TIME` — `6:00 PM`
- 👥 `ROSTER` — `4 members · 2 spots remaining` ← **present on this card type only**
- Button: `JOIN THIS TABLE →`

**Data model fields:** hostName, hostPhoto, city, state, rhythm, time, memberCount, maxSize, spotsRemaining, groupType: `"in-person"`

---

#### Card Type B — Virtual / Home Gathering
Members each gather in their own home simultaneously on the same scheduled day. No fixed location. Open to anyone — no capacity limit.

**Data fields:**
- `HOSTED BY` label
- Host name: e.g. `Mission Table Global`
- Auto-generated description: *"Open to members everywhere. All members meet and pray at the same time in their own home."*
- 📍 `LOCATION` — **omitted** (no location row shown)
- 📅 `RHYTHM` — `Every 3rd Sunday` · 🕐 `TIME` — `6:00 PM`
- 👥 `ROSTER` — **omitted** (no capacity limit, open to all)
- Button: `JOIN THIS TABLE →`

**Data model fields:** hostName, rhythm, time, groupType: `"virtual"`

---

#### Card Type Comparison

| Field | In-Person (Type A) | Virtual / Home (Type B) |
|---|---|---|
| HOSTED BY | ✓ | ✓ |
| Description | Auto-generated (location) | Auto-generated (home) |
| LOCATION row | ✓ City, State | — omitted |
| RHYTHM + TIME | ✓ | ✓ |
| ROSTER row | ✓ count + spots | — omitted |
| Capacity | Limited (has max size) | Unlimited |
| groupType value | `"in-person"` | `"virtual"` |

---

### 4. Tables Section — Screen 4 (no groups — empty state, needs separate design)

**Section header:** `TABLES FOR [COUNTRY]`
**Subline:** `No groups yet.`

- No group cards shown
- Empty state callout (2px black border, cream bg):
  ```
  Be the first.

  [Country] has [X] souls and no Mission Table.
  Start one — gather a few people, commit to a year,
  and pray for a nation that needs the gospel.

  [Start a Table for [Country] →]
  ```
- Secondary text (no button): `Not ready to host? Notify me when a table starts.`
  *(Design placeholder — email capture not yet built)*

---

### 5. "WANT TO HOST A TABLE?" Section (all pages)
- Border-top divider
- Heading: `WANT TO HOST A TABLE?`
- Subline: `Be the first to start a Mission Table for [Country].`
- Full-width black button: `START A TABLE FOR [COUNTRY] →`
- Background: cream, 2px black border (no color fill)

---

### 6. Footer
- Dark background `#1C1B1B`
- `Mission Table` (Fraunces)
- Links: Privacy Policy · Terms of Service · Contact Us · Global Impact
- Copyright: `© 2024 Mission Table. A record of movement.`

---

## Sample Data

### Spain (Screen 3 example)
- Population: 47,765,000 → `47.8M souls`
- JP Scale: 3 — Superficially Reached
- Description: *"Few evangelicals, but many who identify as Christians. In great need of spiritual renewal and commitment to biblical faith."*
- Primary Religion: Christianity · % Evangelical: 1.6%
- People Groups: 78 · Least Reached: 12 · 10/40 Window: No

### Germany (Screen 4 example)
- Population: 83,998,000 → `84.0M souls`
- JP Scale: 4 — Partially Reached
- Description: *"Evangelicals have a modest to moderate presence."*
- Primary Religion: Christianity · % Evangelical: 2.1%
- People Groups: 108 · Least Reached: 42 · 10/40 Window: No

---

## Navigation
- Back button: `← THE NATIONS` links to `/browse`
- Style: Inter semibold, small uppercase, underline — matches Screen 2 back button
