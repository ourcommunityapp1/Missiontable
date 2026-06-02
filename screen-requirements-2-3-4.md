# Mission Table — Screen Requirements: 2, 3 & 4

*Derived from PRD v1, design system, and decisions made 2026-06-02.*

---

## Resolved Decisions

| # | Decision | Answer |
|---|---|---|
| 1 | Browse page heading | **THE NATIONS** |
| 2 | Mobile card layout | **Horizontal snap-scroll per continent** (matches home page) |
| 3 | Country name position on hero | **Bottom-left** |
| 4 | Tell unseeded visitors data grows with a group | **Yes** — always show the universal template (see Screen 4) |
| 5 | v1 seeded countries | **Spain, Germany, Guatemala, Honduras, Kosovo, United Kingdom, India, Pakistan, China, Bangladesh, Indonesia, North Korea** (12 total) |
| 6 | Placeholder images | **Continent-specific** — one per continent |

**Continent groups for v1 countries:**
| Continent | Countries |
|---|---|
| Europe | Spain *(live community)*, Germany, Kosovo, United Kingdom |
| Central America | Guatemala, Honduras |
| South Asia | India, Pakistan, Bangladesh |
| East Asia | China, North Korea |
| Southeast Asia | Indonesia |

> Note: v1 originally scoped 5–7 seeded countries. 12 have been confirmed. All 12 will have full seeded data (hero image, intro, Joshua Project stats, prayer points).

---

## Screen 2 — Country Directory (`/browse`)

### Purpose
The front door to discovering where prayer communities exist. In v1, all 12 seeded countries have rich data. All other countries (unseeded) show a continent-specific placeholder that still invites starting a group.

---

### User Stories

**As a missionary who received Landon's link,**
I want to see all the countries Mission Table is praying for so I can find one that matches where I serve or feel called.
> *Success:* I can identify a relevant country within 30 seconds of landing on the page.

**As a prospective member browsing for the first time,**
I want to see which countries have active groups so I know where I can actually join something.
> *Success:* Countries with groups are visually distinct from countries with none. I can tell at a glance.

**As a curious visitor with no specific country in mind,**
I want to feel moved by the breadth of nations being prayed for so this feels bigger than any one group.
> *Success:* Scrolling the directory feels like seeing the world, not a list.

---

### Layout & Content

#### Page header
- Large Fraunces heading: **`THE NATIONS`**
- Subheading in Inter/warm: *"Find a country. Join a table. Pray for a year."*
- No search bar in v1 (private communities reached by direct link only)

#### Continent sections
- All continents on **one scrollable page**
- Continent name as a bold uppercase section divider with `border-t-2 border-black` rule above it
- Countries listed **alphabetically within each continent**
- Only continents with at least one country in the data are shown

#### Country cards
- **Desktop:** 3-column grid
- **Mobile:** horizontal snap-scroll strip per continent (same pattern as home page)
- Each card contains:
  - Hero image (seeded: real country photo; unseeded: continent-specific placeholder)
  - Continent tag pill — top-left (same style as home page)
  - Country name (Fraunces bold, fraunces-32)
  - Group count label (see states below)
- Full card is a tappable link → country page

#### Card states
| State | Image | Group count label | Label color |
|---|---|---|---|
| Seeded, has groups | Real country photo | `N Groups` | `accent` (`#390C00`) |
| Seeded, no groups yet | Real country photo | `0 Groups — Be the first` | `warm` (`#625E53`) |
| Unseeded | Continent placeholder photo | `0 Groups — Be the first` | `warm` (`#625E53`) |

- Private communities are **never counted or shown**

---

### Success Criteria
- [ ] All 12 seeded countries are visible with real photos
- [ ] Unseeded countries appear with a continent-specific placeholder and "Be the first" label
- [ ] Visitor can reach a country page in 1 tap from the directory
- [ ] Private communities are not counted or shown
- [ ] Continent dividers clearly separate regions
- [ ] Snap-scroll works on mobile per continent row
- [ ] 3-column grid on desktop

---

---

## Screen 3 — Country Page: Seeded with Communities (`/country/[slug]`)

### Purpose
The deepest "why" in the site. By the time someone hits Join, they should feel they know this country — its people, its weight, its need — not just its name.

---

### User Stories

**As a prospective member considering Spain,**
I want to understand who the Spanish people are spiritually before I commit to a year of prayer for them.
> *Success:* I leave the page knowing at least 3 real facts about the country's spiritual landscape.

**As a prospective member ready to join,**
I want to see the available community details — when it meets, how it gathers, who hosts it — so I can decide if it fits my life.
> *Success:* I can make a go/no-go decision on joining without leaving the page.

**As a missionary who already prays for this country,**
I want to see that Mission Table takes this country seriously — not as a destination, but as a people.
> *Success:* The page feels worthy of the nation. Photography, copy, and stats treat the people with dignity.

---

### Layout & Content (top → bottom)

#### 1. Hero
- Full-bleed country photo — full viewport width, no padding
- Country name wordmark overlaid — large Fraunces bold uppercase (`SPAIN.`) **bottom-left**, white text
- Subtle dark gradient behind the name for legibility (bottom 30–40% of image)
- Continent tag pill — top-left corner, same cream/black pill style as directory cards
- Back link: `← The Nations` — small Inter text, top-left, overlaid on image

#### 2. Country intro ("Why pray for [Country]")
- Short editorial paragraph (2–4 sentences) — pulled from seeded `intro` field
- Fraunces section label: `Why [Country]` or `About this nation`
- Body: Inter, warm color
- Tone: weight + hope, not tourism

#### 3. Joshua Project stats bar
- Horizontal row on desktop, 2×2 grid on mobile
- Stats (from seeded data):
  - Population
  - Primary religion
  - % Evangelical Christian
  - Notable unreached people groups
- Each tile: small Inter/warm label + large Fraunces value

#### 4. Prayer points
- Section label: `Pray for [Country]`
- 3–5 specific prayer points from seeded `prayerPoints[]`
- Inter body, warm color
- Not decorative — these are the actual ask

#### 5. Monthly rhythm (universal template)
Every country page — seeded or unseeded, with or without communities — shows this section. It contextualizes what gathering for this country actually looks like month to month.

- Section label: `What gathering looks like`
- Four blocks: **Eat. Pray. Read. Gather.** (same content as home page rhythm section)
- Boilerplate body: *"Every Mission Table community follows the same rhythm — a meal from [Country]'s cuisine, prayer for its people, Scripture, and connection with others praying the same prayers around the world. A simple practice with profound reach."*
- This section is **identical across all country pages** — it is the universal layer

#### 6. Community section
- Section label: `Tables gathering for [Country]`
- If multiple communities: stacked list

**Community card fields (public):**
| Field | Shown when | Display |
|---|---|---|
| Community name | Always | Fraunces bold |
| Gathering model | Always | `Single gathering` or `Family gathering` tag |
| Day of month | Always | e.g. `2nd Saturday of each month` |
| Host first names | Always | `Hosted by Marcus & Jenna` |
| City, State | Single gathering only | `Austin, TX` |
| Seats remaining | Public + single only | `4 spots left` |
| Capacity status | Public + single only | Badge (see below) |

**Capacity states:**
- Open seats: `Join this table →` (primary black button)
- Full: `This table is full` badge + `Join anyway →` (outlined button) — host decides
- Family gathering / no cap: `Join this table →`, no seat count shown

**Never shown publicly:** address, host email/phone, GroupMe link.

#### 7. Bottom CTA
- If communities exist: *"Don't see a fit? Start your own table for [Country]."* + `Start a group →` (text link style)
- If all communities are full: promote Start a Group more prominently as a near-primary CTA

---

### Success Criteria
- [ ] Country name overlays hero image bottom-left in large Fraunces type
- [ ] Visitor sees Joshua Project stats without leaving the site
- [ ] 3–5 country-specific prayer points are shown
- [ ] Monthly rhythm section (Eat/Pray/Read/Gather) appears on every country page
- [ ] Community card shows all public fields; private fields never exposed
- [ ] Full communities show badge but allow join requests
- [ ] "Start a table" CTA is always present
- [ ] Back navigation to `THE NATIONS` directory is always accessible

---

---

## Screen 4 — Country Page: Empty State (`/country/[slug]` — no live communities)

### Purpose
No country page should ever feel incomplete or purposeless. Every country page — seeded or not, with groups or without — delivers a full experience: who these people are, why they need prayer, what gathering around them looks like, and an open invitation to be the first.

---

### User Stories

**As a missionary with a deep connection to North Korea,**
I want to feel personally invited to start the first table, not turned away by a blank page.
> *Success:* The empty state is warm and specific to this country. The page was waiting for someone like me.

**As a visitor curious about Bangladesh with no mission background,**
I want to understand why this country needs prayer even if no one is gathering for it yet.
> *Success:* I leave knowing something real about Bangladesh's spiritual landscape, even if I don't start a group.

**As a prospective host for an unseeded country,**
I want to know I can still start a group and that the page will grow with my community.
> *Success:* The start CTA is visible, and the page tells me that starting a group will bring this country to life on the site.

---

### Layout & Content

#### Seeded country with no communities
Identical to Screen 3 sections 1–5 (hero through monthly rhythm).

Section 6 (community section) is replaced with:

**Empty state block:**
- Section label: `No tables yet.`
- Body: *"No one is gathering around [Country] yet. You could be the first — set a table, pray for its people, and invite others to join you for a year."*
- Primary CTA: `Start the first table for [Country] →` (primary black button, full-width on mobile)
- Tone: invitation, not apology — the seat is open

#### Unseeded country with no communities
The country exists in the data (`status: empty`) but has no seeded content.

- **Hero:** continent-specific placeholder image + country name bottom-left overlay
- **No intro copy** — replaced with the universal Great Commission block (see below)
- **No stats bar** — omitted
- **No prayer points** — omitted
- **Universal Great Commission block** (replaces sections 2–4):
  > *"[Country] is home to millions of people who have little or no access to the gospel. The Great Commission calls the Church to go to every nation — not just the ones easiest to reach. Starting a Mission Table community for [Country] is one way to keep these people known, prayed for, and on the heart of the Church in your city."*
  >
  > *"Every group that gathers supports the missionaries already working there, builds a heart for the unreached within your own community, and sends consistent prayer to the field. You don't have to go to make a difference."*
- **Monthly rhythm section** (Eat/Pray/Read/Gather): **always shown**, same as Screen 3
- **Empty state block:** same as seeded empty state above
- **Data growth note:** *"When the first group starts for [Country], this page will grow — prayer points, country stories, and connections to the field will follow."*

---

### Content that appears on EVERY country page (regardless of state)

| Section | Seeded + communities | Seeded + no communities | Unseeded |
|---|---|---|---|
| Hero (photo + name) | ✅ Real photo | ✅ Real photo | ✅ Placeholder |
| Country intro | ✅ Custom copy | ✅ Custom copy | ❌ → Universal GC block |
| Stats bar | ✅ | ✅ | ❌ |
| Prayer points | ✅ Custom | ✅ Custom | ❌ |
| Universal GC block | ❌ (has custom) | ❌ (has custom) | ✅ |
| Monthly rhythm (Eat/Pray/Read/Gather) | ✅ | ✅ | ✅ |
| Community cards | ✅ | ❌ → Empty state | ❌ → Empty state |
| Start a table CTA | Secondary | Primary | Primary |
| Data growth note | ❌ | ❌ | ✅ |
| Back to The Nations | ✅ | ✅ | ✅ |

---

### Success Criteria
- [ ] No country page ever feels broken, empty, or purposeless
- [ ] Every country page shows the monthly rhythm section
- [ ] Unseeded pages show the Universal Great Commission block instead of custom copy
- [ ] "Start the first table" is the dominant CTA on all empty-state pages
- [ ] Data growth note appears on unseeded pages only
- [ ] Unseeded pages use continent-specific placeholder image
- [ ] Tone throughout is invitation, not apology
- [ ] Back navigation to `THE NATIONS` is always accessible
