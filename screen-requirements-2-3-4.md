# Mission Table — Screen Requirements: 2, 3 & 4

*Derived from PRD v1, design system, and decisions made 2026-06-02.*

---

## Screen 2 — Country Directory (`/browse`)

### Purpose
The front door to discovering where prayer communities exist. Every country in the world can eventually appear here. In v1, only seeded countries have rich data; all others show a placeholder that still invites action.

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
- Large Fraunces heading: `BROWSE TABLES` or `THE NATIONS` (TBD — copy decision needed)
- Short subheading in Inter/warm: something like "Find a country. Join a table. Pray for a year."
- No search bar in v1 (private communities are reached by direct link only)

#### Continent sections
- All continents on **one scrollable page**
- Continent name as a section divider — bold uppercase label with a `border-t-2 border-black` rule above it
- Countries listed **alphabetically within each continent**
- Continents shown only if at least one country exists within them (v1 will have at minimum: Europe — Spain)

#### Country cards (grid)
- **Desktop:** 3-column grid (matches home page country browser)
- **Mobile:** horizontal snap-scroll per continent section (same pattern as home page), or stacked single column — *decision needed*
- Each card contains:
  - Hero image (seeded: real photo; unseeded: placeholder image)
  - Region / continent tag (top-left, same as home page card)
  - Country name (Fraunces, fraunces-32)
  - Group count: `12 Groups` / `1 Group` / `0 Groups — Be the first`
- Cards are tappable links → country page

#### Seeded vs. unseeded cards
| State | Image | Group count label |
|---|---|---|
| Seeded, has groups | Real country photo | `N Groups` in accent color |
| Seeded, no groups | Real country photo | `0 Groups — Be the first` |
| Unseeded | Placeholder image (generic warm-toned world/texture photo) | `0 Groups — Be the first` |

- Private communities are **never counted or shown**

#### Open decision
- **Mobile card layout:** snap-scroll strip per continent (consistent with home page) OR single-column stacked list (easier to scan many countries). Recommend: single-column stacked on mobile since there may be many countries to scan.

---

### Success Criteria
- [ ] All seeded countries (Spain + 5–7) are visible with real photos
- [ ] Unseeded countries appear with placeholder image and "Be the first" label
- [ ] Visitor can reach a country page in 1 tap from the directory
- [ ] Private communities are not counted or shown
- [ ] Page is not overwhelming — continent dividers give structure to a long list
- [ ] 3-col grid on desktop, readable on mobile

---

---

## Screen 3 — Country Page: Seeded with Communities (`/country/[slug]`)

### Purpose
The deepest "why" in the whole site. By the time someone hits Join, they should feel they know this country — its people, its weight, its need — not just its name.

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
- **Full-bleed country photo** — occupies the top of the page, full viewport width
- **Country name wordmark overlaid** on the image — large Fraunces bold uppercase (`SPAIN.`) per design thesis §4 "Proclamation Typography"
- Name treatment: white text, bottom-left or center of image, with subtle dark overlay/gradient behind text for legibility
- Continent tag in top-left corner (same pill style as directory cards)
- Back link: `← Browse all countries` (small, top-left, above hero or overlaid)

#### 2. Country intro ("Why pray for [Country]")
- Short editorial paragraph (2–4 sentences) — pulled from seeded `intro` field
- Tone: weight + hope, not tourism. Per design thesis: "We do not use imagery that exoticizes, flattens, or aestheticizes poverty."

#### 3. Joshua Project stats bar
- Displayed as a horizontal row of stat tiles on desktop, 2-column grid on mobile
- Stats shown (from seeded data):
  - Population
  - Primary religion
  - % Evangelical Christian
  - Notable unreached people groups (count or name)
- Visual treatment: each stat has a small label in Inter/warm and a large number/value in Fraunces

#### 4. Prayer points
- Section heading: `Pray for [Country]` or `How to Pray`
- Bulleted list of 3–5 prayer points pulled from seeded `prayerPoints[]`
- Inter body text, warm color
- Not decorative — these are the actual ask

#### 5. Community section heading
- `Tables gathering for [Country]` or `Join a Table`
- If multiple communities: show all as a list/stack

#### 6. Community card(s)
Each public live community for this country gets a card with:

| Field | Visibility | Display |
|---|---|---|
| Community name | Public | Bold, Fraunces |
| Gathering model | Public | `Single gathering` or `Family gathering` tag |
| Day of month | Public | e.g. `2nd Saturday of each month` |
| Host first names | Public | `Hosted by Marcus & Jenna` |
| City, State | Public (single only) | `Austin, TX` |
| Seats remaining | Public (public + single only) | `4 spots left` or `Full` |
| Capacity status | Public | See below |

**Capacity states on the card:**
- Has open seats: `Join this table →` CTA (primary black button)
- Full: `This table is full` badge + `Join anyway →` CTA (outlined) — host decides whether to accept
- Family gathering (no cap): `Join this table →` CTA, no seat count shown

**What is NOT shown publicly:**
- Address (shared by host after joining)
- Host email / phone
- GroupMe link

#### 7. Bottom CTA
- If there are communities: secondary prompt — `Don't see a fit? Start your own table for [Country] →`
- If all communities are full: more prominent start CTA

---

### Success Criteria
- [ ] Country name overlays the hero image in large Fraunces type
- [ ] Visitor sees Joshua Project stats without needing to visit an external site
- [ ] 3–5 prayer points are visible and specific to this country
- [ ] Community card shows all public fields clearly
- [ ] Full communities show a badge but still allow join requests
- [ ] Address and host contact are never shown publicly
- [ ] Back navigation to directory is always accessible
- [ ] "Start a table for this country" CTA is present

---

---

## Screen 4 — Country Page: Empty State (`/country/[slug]` with no live communities)

### Purpose
A seeded country with no communities yet is an **invitation**, not a dead end. The page must make the emptiness feel like an open seat at a table that hasn't been set yet — not a 404.

This same page also handles **unseeded countries** (no Joshua Project data), but with a degraded content state.

---

### User Stories

**As a missionary with a deep connection to Morocco,**
I want to feel personally invited to start the first table for this country, not turned away by a blank page.
> *Success:* The empty state is warm and specific to this country. I feel like the page was waiting for someone like me.

**As a visitor curious about Thailand but with no mission background,**
I want to understand why this country needs prayer even if no one is gathering for it yet.
> *Success:* I leave the Thailand page knowing something real about its spiritual landscape, even if I don't start a group.

**As a host considering starting a group for an unseeded country,**
I want to know I can still start a group even without rich country data.
> *Success:* The start CTA is visible and the lack of data doesn't make the page feel broken.

---

### Layout & Content (top → bottom)

#### Seeded country with no communities
Identical structure to Screen 3 **through section 4 (prayer points)** — the full country info is still shown.

Sections 5–7 are replaced with:

**Empty state community section:**
- Section heading: `No tables yet.`
- Body copy (1–2 sentences): something like — *"No one is gathering around [Country] yet. You could be the first to set a table, pray for its people, and invite others to join you for a year."*
- Single prominent CTA: `Start the first table for [Country] →` (primary black button)
- Tone: invitation, not shame or guilt — the seat is open

#### Unseeded country with no communities
The country exists in the data model (`status: empty`) but has no seeded content.

- **Hero:** placeholder image (same as directory card) + country name overlaid
- **No stats bar** — omitted entirely (no data)
- **No prayer points** — replaced with a short generic prompt: *"We don't have prayer data for [Country] yet. If you know this country, you may be exactly who Mission Table needs to start here."*
- **Empty state community section:** same as above

#### What's the same across both
- Back navigation: `← Browse all countries`
- Continent tag
- Start a Group CTA — always visible and prominent

---

### Open Decision
- **Unseeded country copy:** does the page mention that Mission Table will seed country data once a host starts a group, or is that internal? Recommend: yes — give the prospective host confidence that the page will grow with them.

---

### Success Criteria
- [ ] Empty state does not feel like a broken or incomplete page
- [ ] Country name is still displayed prominently in the hero (even for unseeded)
- [ ] "Start the first table" CTA is the dominant action on the page
- [ ] Seeded countries still show full prayer/stats content even with no communities
- [ ] Unseeded countries degrade gracefully — no blank sections, no missing UI
- [ ] Tone of empty state copy is warm and inviting, not apologetic
- [ ] Back navigation to directory is always accessible

---

## Open Decisions Remaining (across all three screens)

| # | Question | Screen | Recommendation |
|---|---|---|---|
| 1 | Page header copy for `/browse` — `BROWSE TABLES` vs `THE NATIONS` vs something else | 2 | Decide before design |
| 2 | Mobile layout for directory cards — snap-scroll per continent or stacked single column | 2 | Single column for scannability |
| 3 | Country name position on hero — bottom-left or centered | 3, 4 | Bottom-left feels editorial / travel-magazine |
| 4 | Whether to tell unseeded-country visitors that data will be seeded once a group starts | 4 | Yes — builds trust with prospective hosts |
| 5 | How many countries total appear in v1 directory | 2 | Landon to confirm: Spain + which 5–7? |
| 6 | Placeholder image for unseeded countries — one generic image or continent-specific | 2, 4 | Continent-specific feels more intentional |
