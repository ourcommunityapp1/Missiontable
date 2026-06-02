# Mission Table — Design System v1

*Extracted from the home page Figma design and implemented in Next.js + Tailwind.*

---

## Color Palette

| Name | Hex | Usage |
|---|---|---|
| `cream` | `#FBF9F4` | Primary background, card fills, button hover |
| `cream-dark` | `#F5F3EE` | Section backgrounds (alternating) |
| `cream-border` | `#EAE8E3` | Card background variant (Thailand card) |
| `dark` | `#1C1B1B` | Dark sections (Final CTA, Footer, nav bg on dark) |
| `black` | `#000000` | All borders, primary text, filled buttons |
| `warm` | `#625E53` | Body copy, nav links, secondary text |
| `muted` | `#858383` | Footer text, dark-section body copy |
| `accent` | `#390C00` | Group count labels, small emphasis text |
| `gather-gray` | `#918884` | "GATHER." in hero heading — muted declaration |

**Country card background tints** (borrowed from each nation — per design thesis §5):
| Country | Tint |
|---|---|
| Morocco | `#E6DFD1` |
| Thailand | `#EAE8E3` |
| Peru | `#E4E2DD` |

---

## Typography

### Fonts
- **Fraunces** — all headings, logo, country names. Variable font with axes: `wght`, `opsz`, `SOFT`, `WONK`.
- **Inter** — all body copy, labels, buttons, nav links. Weights: 400 (regular), 600 (semibold).

### Fraunces Rules
All Fraunces text must include `font-variation-settings` with `"wght" 700, "SOFT" 0, "WONK" 1` plus an `opsz` value matched to the font size. Use the CSS utility classes defined in `globals.css`:

| Class | opsz (mobile) | opsz (desktop md+) | Use for |
|---|---|---|---|
| `fraunces-32` | 32 | 32 | 32px headings, country names, rhythm titles, logo |
| `fraunces-48` | 32 | 48 | 48px section headings, footer logo |
| `fraunces-64` | 32 | 64 | 64px display headings |

Always pair with `font-fraunces font-bold` Tailwind classes.

### Type Scale

| Role | Size | Font | Weight | Class |
|---|---|---|---|---|
| Hero heading | 72px → 120px → 153px | Fraunces | 700 | `text-[72px] md:text-[120px] lg:text-[153px] fraunces-32` |
| Display heading | 64px | Fraunces | 700 | `text-5xl md:text-[64px] fraunces-64` |
| Section heading | 48px | Fraunces | 700 | `text-4xl md:text-5xl fraunces-48` |
| Card / sub heading | 32px | Fraunces | 700 | `text-3xl fraunces-32` |
| Nav logo | 32px | Fraunces | 700 | `text-2xl md:text-[32px] fraunces-32` |
| Body large | 18px | Inter | 400 | `font-inter text-lg leading-[1.6]` |
| Body | 16px | Inter | 400 | `font-inter text-base leading-[1.6]` |
| Button / label | 14px | Inter | 600 | `font-inter font-semibold text-sm tracking-[0.05em] uppercase` |
| Region tag | 10px | Inter | 400 | `font-inter text-[10px] tracking-[0.1em] uppercase` |
| Group count | 14px | Inter | 600 | `font-inter font-semibold text-sm tracking-[0.05em] text-accent` |

### Letter Spacing
- Hero heading: `tracking-[-0.05em]`
- Display / 64px headings: `tracking-[-0.03em]`
- Section headings: `tracking-[-0.02em]`
- Nav logo: `tracking-[-0.1em]`
- Buttons / labels: `tracking-[0.05em]`
- Region tags: `tracking-[0.1em]`

---

## Borders

All borders are `2px solid black` — no exceptions, no rounded corners except hero images.

```
border-2 border-black
```

| Element | Notes |
|---|---|
| Section dividers | `border-t-2 border-black` |
| Buttons | `border-2 border-black` |
| Country cards | `border-2 border-black` on outer frame + inner image frame |
| Nav bar | `border-b-2 border-black` |
| Footer | `border-t-2 border-black` |
| Region tag | `border-2 border-black` |
| Rhythm block grid | `border-2 border-black` outer + internal dividers |

**Rounded corners:** only on hero floating images — `rounded-[13px]` (primary) and `rounded-[16px]` (secondary). Everything else is sharp.

---

## Buttons

### Primary (filled black)
```
bg-black text-white font-inter font-semibold text-sm tracking-[0.05em] uppercase px-8 py-4 border-2 border-black hover:bg-cream hover:text-black transition-colors
```

### Secondary (outlined)
```
bg-cream text-black font-inter font-semibold text-sm tracking-[0.05em] uppercase px-8 py-4 border-2 border-black hover:bg-black hover:text-white transition-colors
```

### Light (on dark backgrounds)
```
bg-cream text-black font-inter font-semibold text-sm tracking-[0.05em] uppercase px-12 py-5 border-2 border-cream hover:bg-dark hover:text-white transition-colors
```

### Text link (underline style)
```
inline-flex items-center gap-2 font-inter font-semibold text-sm tracking-[0.05em] uppercase border-b-2 border-black pb-1 hover:text-warm transition-colors
```
Used for "VIEW ALL COUNTRIES →" style links.

---

## Spacing & Layout

### Max width
All content is constrained to `max-w-[1280px] mx-auto`.

### Horizontal padding
- Mobile: `px-6`
- Desktop: `px-16` (64px — matches Figma)

### Section vertical padding
- Standard section: `py-16 md:py-24`
- Hero: `pt-12 md:pt-24 pb-16`
- Final CTA: `py-20 md:py-32`
- Footer: `py-12 md:py-16`

### Section separators
Every section is divided by `border-t-2 border-black` — no shadows, no gradients.

### Section backgrounds (alternating)
| Section | Background |
|---|---|
| Hero | `bg-cream` |
| How it works | `bg-cream-dark` |
| Country browser | `bg-cream` |
| Final CTA | `bg-dark` |
| Footer | `bg-dark` |

---

## Country Cards

```
[outer frame]  border-2 border-black p-4  bg-[country tint]
  [image frame]  border-2 border-black overflow-hidden aspect-[3/4]
    [region tag]  absolute top-4 left-4  bg-cream border-2 border-black px-3 py-1
[card footer]  flex justify-between items-baseline
  [country name]  font-fraunces font-bold text-3xl fraunces-32
  [group count]  font-inter font-semibold text-sm text-accent
```

**Mobile:** Cards are 80vw wide in a horizontal snap-scroll strip (`overflow-x-auto snap-x snap-mandatory`).
**Desktop:** 3-column grid (`grid grid-cols-3 gap-6`).

---

## Navigation

### Top nav (desktop)
- Logo left, nav links center, CTA button right
- Background: `bg-cream`
- Border: `border-b-2 border-black`
- Sticky: `sticky top-0 z-50`
- Padding: `px-16 py-4`

### Top nav (mobile)
- Logo left, hamburger right
- Drawer slides in below nav bar with `border-t-2 border-black`
- Full-width CTA button at bottom of drawer

---

## Icons / Decorative Elements

- **Rhythm block icons:** emoji placeholders (🍽 🙏 📖 🪑) — to be replaced with custom SVG line icons matching the "raw over refined" aesthetic
- **Arrow on text links:** `→` plain unicode character
- **Cross / plus decoration:** appears at hero section corners in Figma — two perpendicular lines, `53px` span, `3px` stroke, black

---

## Design Principles (from design-thesis.md)

1. **Every Soul Has a Face** — photography moves toward the person, never the statistic
2. **The Table Is the Motif** — layouts feel gathered, drawn toward a center
3. **Raw Over Refined** — honest materials, no decorative flourishes
4. **Proclamation Typography** — type at scale is a declaration, not decoration
5. **Color Borrowed, Not Owned** — accent color always sourced from the featured nation; base palette stays neutral cream

**What we reject:** trendy, upscale, sentimental, spectacle.

---

## CSS Utility Classes (globals.css)

```css
/* Variable font optical sizing — responsive */
.fraunces-32  { font-weight: 700; font-variation-settings: "wght" 700, "opsz" 32, "SOFT" 0, "WONK" 1; }
.fraunces-48  { mobile: opsz 32 → md+: opsz 48 }
.fraunces-64  { mobile: opsz 32 → md+: opsz 64 }
```

## Tailwind Theme Tokens (globals.css @theme)

```
--color-cream:        #FBF9F4
--color-cream-dark:   #F5F3EE
--color-cream-border: #EAE8E3
--color-dark:         #1C1B1B
--color-warm:         #625E53
--color-muted:        #858383
--color-accent:       #390C00
--font-fraunces:      var(--font-fraunces)
--font-inter:         var(--font-inter)
```
