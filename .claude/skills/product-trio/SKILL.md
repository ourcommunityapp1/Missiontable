---
name: product-trio
description: Run one discovery cycle of Mission Table's product trio (product, design, engineering agents). Pulls evidence, walks the product, updates the opportunity solution tree, reviews experiments, and proposes validated or de-risked bets with high upside in a dated brief. Use when asked to run the trio, a discovery cycle, or the weekly discovery brief.
---

# Product trio: one discovery cycle

The trio (`trio-product`, `trio-design`, `trio-engineering` in `.claude/agents/`) works the loop below every cycle (weekly by default). Its memory lives in `docs/discovery/`; each cycle reads it first and leaves it better. The framework and scoring are in `docs/discovery/README.md`.

**Hard rules for every step**
- The repo is **public**. Write aggregates and roles only: never names, emails, phone numbers, tokens, member links, or identifying quotes. Screenshots you commit must come from the hidden QA group or show no personal data.
- **Read-only on production**: SELECT queries only; no data, schema, settings or deploy changes; never email, message or notify members or hosts.
- Never merge to `main`. Prototypes go on their own branch behind a flag that defaults off.
- Experiments that touch real users are **proposed**, never started, until Landon approves them.

## 0. Set up (orchestrator)
1. Work in the repo root. If the repository isn't checked out, attach `ourcommunityapp1/Missiontable` with the add_repo tool, clone it, and register it.
2. Create the cycle folder `docs/discovery/cycles/YYYY-MM-DD/` (today's date).
3. Read `docs/discovery/README.md`, `outcome.md`, `opportunities.md`, `bets.md`, `experiments.md`, `decisions.md`, and the latest previous `cycles/*/brief.md`.
4. Start a local build for the design walkthrough (skip if the build fails; say so in the brief):
   ```bash
   cd mission-table && npm ci && \
   NEXT_PUBLIC_SUPABASE_URL=https://soahzuroegjuzrdmkplk.supabase.co \
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<publishable key from the Supabase get_publishable_keys tool> \
   npx next build && \
   (GROUP_CHAT=on DISABLE_VIEW_TRACKING=1 PREVIEW_PENDING_GROUPS=1 NODE_USE_ENV_PROXY=1 NEXT_PUBLIC_SUPABASE_URL=... NEXT_PUBLIC_SUPABASE_ANON_KEY=... \
    nohup npx next start -p 3132 > /tmp/next-trio.log 2>&1 &)
   ```
   `DISABLE_VIEW_TRACKING=1` keeps the walkthrough out of members' visit numbers. `PREVIEW_PENDING_GROUPS=1` lets this local build open the hidden QA group (it is never set in production).
5. Test identities for the walkthrough: the hidden QA group `488ee5be-5a52-432d-981e-69488f519a8d` (status `pending`, never listed or approved). Look its links up at run time and pass them to trio-design in the prompt only; **never write them to a file**:
   ```sql
   select m.name, m.member_token from members m join memberships ms on ms.member_id = m.id
   where ms.group_id = '488ee5be-5a52-432d-981e-69488f519a8d' and ms.status = 'accepted';
   select h.host_token from hosts h join groups g on g.host_id = h.id where g.id = '488ee5be-5a52-432d-981e-69488f519a8d';
   ```
   Member page: `http://localhost:3132/group/<group id>?token=<member_token>`. Host dashboard: `http://localhost:3132/host/<host_token>`. Actions on the QA group (RSVP, chat, share) are allowed because it is test data; never approve or activate the group, and never act on real groups.

## 1. Evidence (trio-engineering)
Run every query in `docs/discovery/queries.sql`; add Mixpanel questions the outcome needs (e.g. `group_detail_viewed` by week, `install_modal_shown` vs `install_modal_closed`, `kit_email_sent` → `group_detail_viewed` funnel). Write `cycles/<date>/evidence.md`: one small table per query, the change since the last cycle, and a short "what moved" list. Also run the health and risk scan (advisors, logs, public pages).

## 2. Three lenses, in parallel
Launch the three agents at once with the Agent tool (`subagent_type` = the agent name), each told the cycle folder and to read `evidence.md`:
- **trio-product** → `cycles/<date>/product.md`: outcome check, new or changed opportunities with evidence, experiment verdicts, ranked candidate bets, research Landon can run.
- **trio-design** → `cycles/<date>/design.md` + screenshots: journey walkthroughs, friction log (severity 1–4), desirability gaps, usability risks and cheapest usability tests for the top bets, mockups.
- **trio-engineering** → `cycles/<date>/engineering.md`: health and risk findings, instrumentation gaps, feasibility and cost of top bets, safe experiment designs with thresholds, kill switches and rollback.

## 3. Converge (orchestrator, as the trio together)
1. Merge the three views. Where they disagree, keep the disagreement visible and say what evidence would settle it.
2. Update the living docs:
   - `opportunities.md`: the opportunity solution tree (outcome → opportunities → solutions → assumption tests).
   - `bets.md`: every candidate bet scored **Upside (1–5) × Confidence (0–1) ÷ Risk (1–5)**, with Cost, Status and the evidence link.
   - `experiments.md`: new experiment designs (hypothesis, riskiest assumption, method, audience, threshold set *before* starting, measurement query, kill switch, end date) and results of running ones.
   - `decisions.md`: persevere/pivot/kill decisions with reasons.
   - `outcome.md`: only if the trio agrees the outcome or its measures should change.
3. Write `cycles/<date>/brief.md`, shaped like this:

   ```markdown
   # Discovery brief: <date>
   **Decisions we need from you** (max 3, each with a recommended answer)
   **Outcome**: north star now vs last cycle, one line on why it moved.
   ## Ready to build (validated or de-risked)
   Bet · upside · confidence + evidence · residual risk + mitigation · cost
   ## Ready to test (needs your OK)
   Bet · riskiest assumption · experiment · threshold · kill switch · duration
   ## Customer problems we found
   ## Risks and health
   ## Research for you (≤ 30 min)
   ## Parked, and why
   ```
   Keep it to what a founder can read in five minutes. Only bets that clear the bar go in "Ready to build": status Validated, or De-risked (risk ≤ 2 and upside ≥ 3).

## 4. Deliver
1. Commit `docs/discovery/` (and only that, unless a prototype branch was made) on a branch named `discovery/<date>`, push, and open a PR titled `Discovery brief: <date>` whose body is the brief. Merging the PR is how Landon keeps the trio's memory; the next cycle builds on `main`.
2. If a prototype branch exists, link it from the brief; do not open a PR for it unless the brief asks Landon to review it.
3. Stop the local server.
