# Design: 2026-11-20 (first cycle, baseline)

*Product designer, product trio. I walked the local build (`localhost:3132`, view tracking off) on an iPhone 13 (390×664) and a Pixel 7 (412×839) with Playwright at 1× scale. Member and host steps used only the hidden QA group, and I saved only there: one RSVP re-answer and one chat message ("QA design walk…"). Real groups were viewed on public pages only, and nothing was submitted. In screenshots of public pages the host's name is replaced with "Host Name".*

Screenshots are in `screens/`. Files starting `a-` are from the Pixel 7, and files ending `-full` are full-page captures. Mockups: `mockup-host-meal-ready.html` and `mockup-start-honest.html`, with renders in `screens/mockup-*.png`.

**Severity scale:** 4 = breaks the monthly loop or causes people to give up · 3 = serious confusion or an off-thesis moment · 2 = friction people work around · 1 = polish.

---

## 1. Journey walkthroughs

### Visitor: home → browse → Spain → group → join → Start a Group
- **Home** (`v01-home`, `v01-home-full`). EAT. PRAY. GATHER. and a city photo fill the first iPhone screen. There is **no button above the fold**: "Explore countries / Join a group" sits below the photo. The page is ~7.7 screens long. "How it works" is clear and kind.
- **Browse** (`v02-browse-full`). One horizontal carousel per region. Cards are cut off at the right edge, which is a hint to swipe, but most countries are hidden. Every empty country says "0 Groups — Be the first", which works well.
- **Spain** (`v03-country-spain`, `v03-country-spain-full`). It opens with "47.8M souls" and Joshua Project statistics over a skyline. The one group card is near the bottom. "Start your own group for Spain" goes to `/start` **without carrying Spain** with it.
- **Public group page** (`v04-group-public-full`, `a-v04-group-public`). The page says **"Begins June 13, 2026"**, a date already past, and **never gives the next gathering (Dec 12)**. It labels the group "VIRTUAL GROUP", although members eat at real tables in their own homes. Nothing shows the group is alive: no table photos, no prayer lines, no "last met".
- **Join form** (`v05-join-form-full`). Six fields, clean and well labelled, with autocomplete. Phone is required. The form never says what happens next, who replies, or by when.
- **Start a Group** (`v06-start-top`, `v06-start-full`, `v07-start-bottom`). The form has **16 inputs over ~4.5 screens**: name, email, phone, host type, group name, country, group type, rhythm, week, day, time, time zone and start date. Single-choice options are drawn as **checkboxes marked ✕**. The country list is **12 hard-coded countries** with no "other". Two pieces of copy disagree about what happens on submit (see the friction log). I did not submit.

### New member, first open (QA member link)
- **At about 1.5 s** (`m01-first-open-5s`, `a-m01-first-open-5s`). Header, then "PINNED · NEXT GATHERING · Sat, Dec 12 · 23 days · You're in". The date and RSVP are clear within 5 seconds. **What to cook is not.** The first meal in the feed is **November's** tortilla (Nov 9). December's meal is 2–3 screens further down in a chat-style log.
- **At about 7 s** (`m02-after-7s`, `a-m02-after-7s`). The **"Add to your home screen" how-to opens over everything** before the person has understood the page. The steps are excellent, but they arrive at the wrong moment.
- Nothing welcomes a new person or tells them what happens each month. They land in other people's messages ("burst 1…burst 7" in QA).

**Five-second verdict:** a new member can tell *when* (Dec 12) and *whether they're in*. They cannot tell *what to cook* or *what to pray for* this month.

### Returning member
- **"Are you in?"** (`r02-rsvp-change`, `r03-rsvp-after`). "Change" shows two clear 46px buttons, "We're in / Not this month", with "You and 1 other are in". This is the best interaction in the product.
- **Open the meal** (`r01-meal-open`). Tapping "Open the meal →" on December's card jumps to *This month*. In the week after a gathering, that tab opens on "Your table from Nov 12", and **December's meal appears under "PAST MEALS"** (`m04-this-month-full`). Every "Open the meal" button goes to the tab, never to the meal itself.
- **Share your table** (`m04-this-month-full`). Photo plus one line of prayer, and "Your host sees every table". Simple and warm. Others' lines show as quote tiles.
- **Chat** (`r04-chat-sent`). Sending works, the message appears at once, and the host sees it on the dashboard Chat tab (`h02-chat`).
- **Members sheet** (`r05-members-sheet`). When, where, host, "since", and filters for "Your church / Near you", plus "Invite a friend". This is the warmest screen for "who else is at this table?"
- **Invite** (`r06-invite`, `a-r06-invite`). The modal is copy-only: there is no phone share sheet, the COPY button runs past the modal edge, and the × is 24×24. The copy says the host "approves", a word the PRD (§6.2) says never to use.
- **Install how-to** (`r07-install-howto`, `a-r07-install-howto`). Clear numbered steps that differ correctly between iPhone and Android, and the buttons are big enough.

### Host dashboard (QA host)
- **Overview** (`h01-overview`, `h01-overview-full`, `a-h01-overview`). It says "This month · 1 thing needs you: Send December's meal", then stacks **five more cards**: turn on automatic emails, who's in, thank-you note, an "Are you in?" note composer and an email preview. That is about **5.5 phone screens**. "PENDING" appears as a 10px tag with no explanation. "Meal not sent" is shown in rust on every tab.
- **Chat** (`h02-chat`). Works. The host can remove messages.
- **From the field** (`h03-field-full`). The form needs a "FROM * your mission partner's name". The photo has to be a **pasted URL**, with no upload from the phone.
- **Meals** (`h04-meals-full`). A "Create December meal" button, two sent meals marked "0 gathered" in rust, then **ten tall dashed boxes reading "No meal sent"**, from October back to January.
- **Create meal** (`h08-create-meal-full`). The page is titled **"NEW KIT"**. It is a blank form: meeting date (not preselected), recipe name, URL, side dish, scripture text, reference, commentary, prayer requests and gathering prompt. Placeholders are "Chicken Mole" and "Mexican Street Corn" for a Germany group. "Send kit to members →" **sends immediately**: no preview, no draft.
- **People** (`h05-people`). Short and clear.
- **Insights** (`h06-insights-full`). Long, with "0/2 opened December's meal" and "Most members haven't tapped 'We gathered' yet". It reads like a grade.
- **Settings** (`h07-settings-full`). Automatic emails are **off by default** and explained in dense copy. It also asks for an external "Group chat link (WhatsApp, GroupMe, Signal)" even though in-app chat exists. Adding a co-host means emailing a Gmail address.
- On a phone the **tab row overflows**: Insights and Settings are off-screen (`h04-meals`).

---

## 2. Friction log

| # | Step | Issue | Who it affects | Sev | Evidence |
|---|---|---|---|---|---|
| 1 | Host · Create meal | Every month starts from a **blank 9-field "New kit" form**. Nothing is suggested from the country, nothing carries over from last month, there is no draft, no preview, and placeholders come from another country. This is the only thing that keeps the rhythm going, and it is the hardest screen in the product. | Every host, every month | **4** | `h08-create-meal-full`. Spain: meals Jun–Sep, none for Oct/Nov. Sep's went out 1 day before the gathering. |
| 2 | Start · submit copy | The form says the group "will appear on that country's page **immediately**". The success screen says "an admin will review and approve". In reality one host has waited **~5 months**, with no timeline and no human named. | Prospective hosts | **4** | `v07-start-bottom`. `StartGroupForm.tsx` commitment note vs. success state. evidence.md: Kosovo pending since June. |
| 3 | Start · after submit | "You're on the map → View your country page" leads to a country page that says **"No groups yet. Be the first"**. | Hosts who submitted | 3 | Success-state code. `/country/kosovo` shows "No groups yet". |
| 4 | Start · form length | 16 inputs and ~4.5 screens, with time zone, start date and week/day all required before anyone has talked to the host. No way to save a half-finished form. | Visitors thinking about hosting | **4** | `v06-start-full`. 49 viewed `/start`, 0 submissions. |
| 5 | Start · details | Spain's "Start a group" CTA drops the country. Only 12 hard-coded countries, no "other". Single choices are drawn as ✕ checkboxes. "Virtual — members meet in their own homes" conflicts with the PRD's "in person, *not virtual*". | Prospective hosts | 2 | `v06-start-full`. `country/[slug]/page.tsx` links bare `/start`. `start/page.tsx` never passes `defaultCountry`. |
| 6 | Start · alignment | No beliefs step and no field-connection question (PRD §6.3, §9). The promise "we'll help connect you to the field" is one bullet among five. | Prospective hosts | 2 | `v06-start-top` |
| 7 | Host · pending | A pending host gets a full dashboard telling them to send meals. "PENDING" is a 10px tag with no meaning or timeline. | Waiting hosts (the Kosovo host) | 3 | `h01-overview` (QA group is pending) |
| 8 | Host · Meals history | **Ten dashed "No meal sent" boxes** and "0 gathered" in rust: a wall of missed months. This is the guilt mechanic the thesis rejects. A host who skipped October and November sees it every time they open the tab. | Hosts who have fallen behind | 3 | `h04-meals-full` |
| 9 | Host · Overview | "1 thing needs you" followed by five more cards. About 5.5 screens. The single next action gets lost. | Every host | 2 | `h01-overview-full` |
| 10 | Host · From the field | Every post needs a mission partner's name. Photos only by pasted URL. Hosts without a field contact can't post, although the PRD promised help. | Hosts without a field partner | 3 | `h03-field-full`. 0 field posts since Sep. |
| 11 | Host · automatic emails | Off by default. The switch appears in two places, wrapped in dense copy. So no "Are you in?" email has ever gone to Spain. | Hosts and members | 3 | `h01-overview-full`, `h07-settings-full`. RSVP 1 of 22. |
| 12 | Host · dates | Overview says "December meal not sent" while members' feed says "QA sent December's meal". The kit was dated Dec 1, but the gathering is Dec 12. A meal saved for the wrong date drops out of "this month". | Hosts and members (edge case) | 2 | `h01-overview` vs. `m01-first-open-5s`, `h04-meals` |
| 13 | Host · tabs | On a phone, the tab row hides Insights and Settings off-screen. | Hosts on phones | 2 | `h04-meals` |
| 14 | Host · Settings | Asks for an external WhatsApp/GroupMe link while in-app chat exists, so a group could end up with two chats. | Hosts | 2 | `h07-settings-full` |
| 15 | Member · first visit | The install how-to opens over the page after ~6 s on a first visit, interrupting "what do I do this month?". | New members (on phones) | 3 | `m02-after-7s`, `a-m02-after-7s` |
| 16 | Member · Home feed | The top item after the pin is **last month's** meal. This month's meal is 2–3 screens down, mixed into chat. Nothing welcomes or orients a new member. | New and returning members | 3 | `m01-first-open-5s`. Full text dump: Nov 9 meal comes before Dec meal. |
| 17 | Member · Open the meal | "Open the meal →" goes to the This month tab, not the meal. In the week after a gathering, the upcoming meal is hidden or filed under **"Past meals"**. | Members who were emailed a meal | 3 | `r01-meal-open`, `m04-this-month-full` |
| 18 | Member · Invite | Copy-only: no share sheet on the phone. The COPY button overflows the modal and the × is 24×24. The copy uses "approves". | Members inviting friends | 2 | `r06-invite`, `a-r06-invite` |
| 19 | Member · type and targets | 29–34 text items below 12px (10px date and section labels). Change, Open the meal, Praying and Reply are 40px tall. "Address and details" is 36px and "Open in YouTube" is 28px. | Older members, outdoor use | 2 | audit output. `m01-first-open-5s` |
| 20 | Visitor · group page | Shows "Begins June 13, 2026" but not the next date. Says "Virtual group". No sign of life (no tables, no prayers). | Visitors deciding to join | 3 | `v04-group-public-full`. 71 group views → 18 opened join → 12 requests, none since Sep. |
| 21 | Visitor · join form | Doesn't say what happens next, who replies or by when. Phone is required. | Visitors | 2 | `v05-join-form-full`. 2 June requests were never answered. |
| 22 | Visitor · country page | Leads with "47.8M souls" and statistics over a skyline. No people. Off-thesis ("move toward the person, not the statistic"). | Visitors | 2 | `v03-country-spain-full` |
| 23 | Visitor · home | No call to action in the first iPhone screen. | Visitors | 2 | `v01-home` |
| 24 | All · nav | Menu button is 40×32. Footer links and back links are 24–26px tall. | Everyone | 1 | audit output |
| 25 | Visitor · browse | Region carousels hide most countries. Region tags are 10px. | Visitors | 1 | `v02-browse-full` |

---

## 3. Desirability

**What pulls people back**
- **"You and 1 other are in."** Knowing someone else will be at a table on the same night is the strongest pull in the product. The pinned RSVP card shows this best (`r02-rsvp-change`).
- **Other people's tables.** "QA Bob prayed for language learning" shown as a quote tile is the closest thing to delight in the product. It's personal, short and non-competitive (`m04-this-month-full`).
- **A field update with a face.** A family's video from the country is the one place the people being prayed for appear as people (`m01` feed). It stopped in September.
- **Being seen by the host.** "Your host sees every table" is good. The host's own note ("Even if it's just you and a plate of leftovers, you count!") is the best copy in the app (`h01-overview-full`).
- **Neighbors.** "Your church · 1 / Near you · 0" in the members sheet starts to answer "who near me does this too?" (`r05-members-sheet`).

**What feels like a chore**
- **For hosts, almost everything.** The blank monthly form (`h08`), a wall of missed months (`h04`), "Meal not sent" in rust in the header of every tab, and Insights grading them ("0/2 opened", "most members haven't tapped"). A volunteer who missed October now meets three reminders of it before they can do anything for December. **Evidence: the rhythm stopped after September, and nothing in the product makes coming back feel easy.**
- **For members, too many asks per month:** RSVP, install the app, share your table, eat together, invite a friend, react to field updates. Each is light alone, but together, and arriving before the meal, they read as tasks.
- **For would-be hosts, a long form with no person in it.** Five months of silence after submitting is the opposite of hospitality.

**Does it honor the people at the table?**
- *The people in the room:* mostly yes for members. The tone is warm, nothing is guilt-driven, and "Not this month" is a respectable answer. Mostly **no for hosts**: the dashboard measures them.
- *The people being prayed for:* weakly. The country page leads with "47.8M souls" and a skyline. The group page has no faces or stories. Prayer requests depend on the host having a field partner, and most new hosts won't. The thesis says "every soul has a face", but the product currently shows a number.

---

## 4. Top 5 design opportunities, with cheap tests

**1. A meal that is ready to send (host)** (mockup: `mockup-host-meal-ready.html`)
Ten days before each gathering, Mission Table drafts the meal: a dish from the country, a passage, and three prayer requests (from the field update if there is one, otherwise from the country's prayer points). The host reads it, adds a line, and sends, hands it to a co-host, or marks the month as a rest. The Meals tab shows the tables that happened, not the months that didn't.
- *Risk:* hosts may feel it's "not theirs", or may not trust generic prayer requests.
- *Test A (concierge, real):* before **Dec 2**, Landon writes December's Spain meal himself and texts the host: "Here's December's meal, ready to go. Change anything and send." **Pass:** the host sends it by Dec 9 and says it took under 5 minutes.
- *Test B (first-click on the mockup, 5 people incl. both hosts):* "December's gathering is coming. What would you tap to get the meal to your group?" **Pass:** 4 of 5 tap "Read it and send" within 5 seconds.

**2. Start a Group that is short and honest about what happens next** (mockup: `mockup-start-honest.html`)
Four questions, then a 15-minute call with Landon, then live. Keep the country from the page the person came from. Name a reply date. Show waiting groups as "1 group forming" with "Tell me when it opens". Make the copy match reality: remove "appears immediately". Approve or call the Kosovo host this week.
- *Test (fake door, live):* add one button above today's form, "Talk to Landon first (15 min)", that opens an email or calendar link. **Pass:** 5 or more of the next 40 `/start` visitors tap it (today: 0 of 49 finish).
- *Test (5-second, on frame B):* "What happens next, and when?" **Pass:** 4 of 5 people answer "a call or email from Landon within a few days".

**3. "This month" in one glance (member)**
At the top of Home, before the chat: the next date, *this* month's dish, passage and prayer requests, and the RSVP. "Open the meal" opens that meal. The upcoming meal is never filed under "Past meals". The install how-to waits until the second visit.
- *Test (5-second, current vs. a one-card mockup, 5 people):* show the screen for 5 s, hide it, and ask "What are you supposed to do this month?" **Pass:** 4 of 5 name the date **and** what to cook on the mockup (expect about 1 of 5 on the current screen, `m01`).

**4. A host dashboard that shows one next step and doesn't keep score**
Overview becomes a single "next thing" card. Folded beneath it: who's in, and the note. Automatic emails are on by default, with a one-line opt-out. Remove the empty-month boxes and the rust "not sent" labels. Insights speak in people and tables ("4 tables shared prayers in November"), not in open rates.
- *Test (hallway script, both hosts, 15 min over coffee):* show today's Overview and Meals tabs and frame C of the mockup. Ask (1) "What is the one thing you'd do next?" (2) "How does this screen make you feel about October?" (3) "Which would you rather open on a busy week?" **Pass:** both hosts name the same next action within 10 seconds on the new version, and neither uses words like "behind", "guilty" or "failing" about it.

**5. A group page that looks alive and shows the people being prayed for (visitor)**
Show the next gathering ("Next table: Sat, Dec 12"), how many tables shared last month, a few prayer lines, and a face or story from the country instead of a statistic. Replace "Virtual group" with "Each family at their own table". On the join form, say who replies and by when. Use the phone's share sheet for invites.
- *Test (first-click and recall on the public group page, 5 people from church):* "When does this group next meet, and what happens after you ask to join?" **Pass:** 4 of 5 answer both correctly on the mockup (today the next date isn't on the page at all, `v04`).
- *Optional fake door:* a "Tell me about December's table" button on the public page that only counts taps. **Pass:** ≥10% of group-page visitors tap it over 2 weeks. This needs one tracked event, and it should be checked with engineering.

---

## 5. Mockups

- `mockup-host-meal-ready.html` (render: `screens/mockup-host-meal-ready.png`) shows opportunity 1:
  - A: Overview with December's drafted meal and one button.
  - B: Read it, add a line, then send, save, or rest.
  - C: Meals history as tables shared, with missed months as a rest.
- `mockup-start-honest.html` (render: `screens/mockup-start-honest.png`) shows opportunity 2:
  - A: a 4-question start with a named next step.
  - B: the confirmation with a date, and "1 group forming" on the country page.

Both mockups use the visual system: cream #FBF9F4, black, Fraunces display, Inter, 2px borders and 44px+ targets. The Spain stripe is a colour borrowed from the flag. All content is sample data. The reply date in mockup 2 is a placeholder, and Landon should only promise a time he can keep.

**Recommendation to the trio:** the evidence says the loop stopped at the host. Everything built for members (chat, invites, the app, tables) waits on a meal arriving. Test opportunity 1 first, as a concierge test this month: it costs Landon about an hour and tells us whether "ready to send" restarts the rhythm. Run opportunity 2 next week, because a host has been waiting since June.
