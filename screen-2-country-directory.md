# Screen 2 — Country Directory
## `/browse` — THE NATIONS

*Requirements locked 2026-06-02. Part of Mission Table v1.*

---

## Purpose

The front door to discovering where prayer communities exist. Visitors arrive here from the home page "Browse Tables" CTA or the nav. The page should feel like seeing the world — not a database list. Every nation is named. Every nation can be prayed for.

In v1, 12 countries are fully seeded with data. All other countries are unseeded (continent-specific placeholder, no stats or prayer points yet) but still appear and still invite action.

---

## User Stories

**As a missionary who received Landon's link,**
I want to browse all the countries Mission Table is gathering around so I can find the one that matches where I serve or feel called.
> *Success:* I find a relevant country within 30 seconds of landing on the page.

**As a prospective member browsing for the first time,**
I want to clearly see which countries have active groups versus which don't, so I know where I can actually join something today.
> *Success:* Countries with live groups are visually distinct from countries with none. I can tell at a glance without reading fine print.

**As a curious visitor with no specific country in mind,**
I want to feel the weight and breadth of the nations being prayed for, so this feels like a movement bigger than any one group.
> *Success:* Scrolling the directory feels like seeing the world. I feel something before I click anything.

**As a prospective host/missionary considering starting a group,**
I want to find my country quickly and see that no one has started a table there yet, so I feel called rather than redundant.
> *Success:* I find my country, see "0 Groups — Be the first," and feel invited rather than overlooked.

---

## v1 Country List

### Seeded countries (full data: photo, intro, stats, prayer points)

| Continent | Countries |
|---|---|
| Europe | Germany, Kosovo, Spain *(live community)*, United Kingdom |
| Central America | Guatemala, Honduras |
| South Asia | Bangladesh, India, Pakistan |
| East Asia | China, North Korea |
| Southeast Asia | Indonesia |

**12 total.** Listed alphabetically within each continent on the page.

### Unseeded countries
All other countries in the world — shown with a continent-specific placeholder image and `0 Groups — Be the first`. No stats or prayer points.

> **Note:** Seeding 12 countries requires manually entering Joshua Project data (population, primary religion, % evangelical, unreached peoples), a hero image, an intro paragraph, and 3–5 prayer points for each. This is the primary pre-launch content task.

---

## Page Structure

### 1. Page header
- **Heading:** `THE NATIONS` — Fraunces bold, fraunces-64, uppercase
- **Subheading:** *"Find a country. Join a table. Pray for a year."* — Inter, warm color, text-lg
- No search bar in v1
- No filter tabs — one scrollable page only

### 2. Continent sections
Each continent that has at least one country gets a section:
- **Divider:** `border-t-2 border-black` rule
- **Continent label:** Inter, font-semibold, text-sm, uppercase, tracking wide — e.g. `EUROPE`, `SOUTH ASIA`
- Countries within each section listed **alphabetically**
- Sections appear in this order: Africa, Asia (split: South / East / Southeast), Central America, Europe, Middle East, North America, Oceania, South America — only continents with countries are shown

### 3. Country cards

**Desktop:** 3-column grid, `gap-6`, full max-width container
**Mobile:** Horizontal snap-scroll strip per continent — `overflow-x-auto snap-x snap-mandatory`, cards `80vw` wide with peek at next card

Each card:
```
[outer frame]   border-2 border-black  p-4  bg-[continent tint]
  [image]       border-2 border-black  aspect-[3/4]  overflow-hidden
    [tag pill]  absolute top-4 left-4  bg-cream border-2 border-black
                Inter 10px tracking-wide uppercase  "EUROPE" / "SOUTH ASIA" etc.
[card footer]   flex justify-between items-baseline  mt-4
  [name]        font-fraunces font-bold text-3xl fraunces-32
  [group count] font-inter font-semibold text-sm  (see states)
```

#### Card states

| State | Background tint | Image | Group count | Count color |
|---|---|---|---|---|
| Seeded, has groups | Country-specific warm tint (borrowed from nation) | Real country photo | `12 Groups` / `1 Group` | `accent` `#390C00` |
| Seeded, no groups | Country-specific warm tint | Real country photo | `0 Groups — Be the first` | `warm` `#625E53` |
| Unseeded | Continent-specific neutral tint | Continent placeholder photo | `0 Groups — Be the first` | `warm` `#625E53` |

#### Continent placeholder images
One warm-toned, human-centered documentary photo per continent — not a map, not a flag, not a stock illustration. Should feel consistent with the design thesis: *"We show the full humanity of every culture."*

| Continent | Tint suggestion |
|---|---|
| Africa | Warm ochre |
| Asia (all) | Dusty sage |
| Central America | Earthy terracotta |
| Europe | Cool linen |
| Middle East | Sandy warm |
| South America | Deep red-brown |

#### Country-specific tints (seeded countries)
Color borrowed from the nation — flag, landscape, textiles, or cuisine. Decided at time of seeding, not auto-generated.

---

## Navigation & Linking

- **Into this page:** Home page "Browse Tables" CTA, top nav
- **Out of this page:** Every card links to `/country/[slug]`
- **Back nav on country pages:** `← The Nations` returns here
- **No pagination** — all countries on one page in v1

---

## Private Communities

Private communities are **never listed, counted, or implied** anywhere on this page. A visitor whose only path to a private community is a direct link will not discover it here.

---

## What Is NOT in v1

- Search or filter by country name
- Filter by continent (tabs or dropdown)
- Filter by "has open groups"
- Map view
- Sorting by group count or activity
- Pagination or infinite scroll

---

## Success Criteria

- [ ] `THE NATIONS` heading renders in Fraunces bold at correct size
- [ ] All 12 seeded countries are visible with real photos and correct group counts
- [ ] Unseeded countries appear with continent-specific placeholder and "Be the first" label
- [ ] Countries within each continent are listed alphabetically
- [ ] Continent dividers are visible and clearly separate regions
- [ ] Snap-scroll works correctly on mobile per continent row
- [ ] 3-column grid renders correctly on desktop
- [ ] Private communities are not counted or shown anywhere
- [ ] Every card links correctly to its country page
- [ ] Page does not feel overwhelming — continent structure provides navigation
- [ ] Seeded countries with groups are visually distinct from countries with none
