# Next session (TAG): fix the /tools/ category gap, run a conversion + reach audit, then the parked checks

Start inside `theautomationsguide/`. State which model you are running as before doing anything else. Run `git pull --ff-only` on master first. `TODO.md` is the only source of truth for open tasks; re-check every claim below with a query before acting (this file is a 10/01 snapshot, written after Session 98).

**Order:** Part 0 (parked checks whose gate has passed, ~10 min) -> Part A (category fix, one PR) -> Part B (audit, then Ian picks) -> Part C (build what Ian approved). Date-gated asks at the end only if their date has passed.

---

## Part 0. Parked checks (Claude, no input needed; do only those whose gate has passed, otherwise say "parked" in the final message)

1. **Daily Briefing's first live run with the stuck-Generating flag (gate: 2026-10-02 07:45 ET).** `mcp__n8n__n8n_executions` list for `HbCayxHdzdYdfvfP`: the 11:30Z run must be `success`. Do not trigger it by hand (duplicate Slack briefing).
2. **Watchdog scheduled runs + GitHub cron lag (gate: 2026-10-02 morning).** `gh run list -R homegrowngrowthco/theautomationsguide --workflow n8n-watchdog.yml --limit 5 --json event,conclusion,createdAt`. Expect the 10/01 16:30Z and 10/02 04:30Z `schedule` runs green ("All scheduled runs accounted for"). Red with a finding = real, report it. Measure the lag (createdAt minus cron slot; it was 5-7h on 10/01, memory `reference_tag_github_scheduled_runs_lag_hours`). If over ~1h or uneven, change `n8n/watchdog.mjs` to anchor each window's start to the previous completed watchdog run's `run_started_at` (GitHub API with `GITHUB_TOKEN`, `permissions: actions: read`; cap 36h; fall back to 13h), with selftests, own branch + PR. While in that file, prune the three 10/01 ids from `ACKNOWLEDGED`.
3. **"Leadfeeder vs RB2B" post (queued 10/01, High).** When the engine opens its PR, confirm it links `/go/leadfeeder/` (or `/go/leadfeeder-web-visitors/`), not a raw URL.
4. **Topic stager's first real run in 3 weeks (gate: after Sunday 2026-10-04 06:00Z, allow for lag).** The scheduled run must be green AND stage topics as Suggested (check the run summary).
5. **Cadence re-check round 3 (gate: on/after 2026-10-04).** `C:\Users\Ian\.venvs\gsc\Scripts\python gsc-search-analytics.py 35`. Provisional 9/22-9/28 was 16 clicks / 7,618 impr (vs 11 / 4,671). Confirm or revise; judge clicks AND impressions; close or update the TODO line.
6. **Indexing re-check (gate: ~2026-10-08).** `gsc-index-status.py` for `/tools/calendly/`, the 9/06 Beehiiv post, the 10/01 Mailchimp-to-Kit post; on the first post merged after 10/01, confirm the "Google Indexing Submit" node in "Notion Publish Status — TAG" returned 200.

---

## Part A. Fix: listed tools that never render on /tools/ (Claude, one PR)

**The bug (found S98, verify it first):** `src/pages/tools.astro` loops over `toolCategories` (9 entries, `src/data/tools.ts`) and renders only tools whose `category` is in that list. Tools carry ~17 distinct categories (on 10/01: Sales Engagement 23, Advertising & Creative, Email & Marketing Automation, AI Voice & Dialers, Meeting Intelligence, AI Sales Agents, SEO & Content, Scheduling & Productivity, ...), so many `listed:true` tools, including all 9 programs registered in PR #323, appear only in the homepage marquee and never on `/tools/`. Re-count with a script before deciding anything.

**Do:**
1. Count listed tools per category and list every listed tool missing from the grid.
2. Fix it so that no listed tool can be orphaned again. Preferred shape: consolidate the category taxonomy to a reader-facing set (roughly 8-12 buckets a RevOps buyer would recognise; merge one-tool categories), re-home each tool, give every category a `categorySubs` line, and decide whether `navToolCategories` (header dropdown) needs updating. "Sales Engagement" with 23 tools is too broad to be one section; split it by what the buyer is shopping for.
3. Add a deterministic guard: a build-time or `qa:lint` check that fails when a `listed` tool's category is not in `toolCategories` (and a selftest for that check). Also teach `qa/auto-register-tools.mjs` to stop defaulting new tools to "Sales Engagement" blindly if a better signal exists, or at least make the new guard catch it.
4. Check the knock-ons: category anchors (`categoryAnchor`) used by the header dropdown, any `/tools/` jump links in posts, hub pages that display the category, JSON-LD.
5. QA: `astro build`, `qa:lint`, `qa:logos`, overflow at 375/768/1280 on the deploy preview (the repo's `qa/mobile-overflow.mjs` only serves local `dist`; for the preview use a Playwright script in the scratchpad), screenshot `/tools/` at 375 and 1280 and look at it. Branch + PR, worktree in `C:\tmp`.

---

## Part B. Conversion + reach audit (measure first, recommend second, build nothing yet)

**Goal (Ian, 10/01):** more affiliate links clicked, more newsletter signups, more reach. Output: `audits/AUDIT-CONVERSION-<date>.md`, findings ranked by expected impact x effort, each with its measured baseline and how to verify after shipping. Remediation items go to `TODO.md`, not the audit file.

**Step 1: baseline, from the live instruments (memory: read the response, not the doc):**
- **PostHog project 408442** (shared history with FlyrAI: always filter `$host` on BOTH `theautomationsguide.com` and `theautomationsguide.com.`; never resolve `@current`). 90d and 28d: pageviews by page type (post / tool hub / home / pricing index / guides), `affiliate_click` count by referring page and by `/go/` slug, clicks per 100 post pageviews, top entry pages, scroll depth if captured, device split.
- **Newsletter:** the signup is a cross-origin Beehiiv iframe (`src/components/EmailSignup.astro`, form `d41efc59-...`), so the site cannot see a submit. Find out what, if anything, PostHog counts as a signup (the 8/13 note says a form-submit insight once overstated 79x), and pull the real number from Beehiiv (MCP reads work on the free plan): as of 10/01 there were **0 real subscribers** (3, all Ian's tests). If signups are unmeasurable on-site, the first recommendation is to fix that (e.g. Beehiiv's embed postMessage, or a first-party form posting to Beehiiv's API via a Netlify function), because nothing else in this audit can be verified without it.
- **GSC** (`gsc-search-analytics.py`): queries and pages with impressions but low CTR, and posts at positions 5-15 (the near-win set).
- **PartnerStack/affiliate side:** the last known per-program clicks are in `CLAUDE.md` (8/21). Ask Ian for a fresh PartnerStack screenshot only if the audit needs it.
- **Volume check, before any A/B idea:** at ~16 GSC clicks/week, split tests will not reach significance in any useful time. Say so in the audit, judge changes by best practice + before/after funnel rates over a long enough window, and pre-register the metric for each change.

**Step 2: walk the surfaces** (live site, 375 and 1280, as a first-time visitor from Google landing on a post):
- **Post template** (`src/layouts/BlogPostLayout.astro`, `src/components/post/*`: BottomLine, ToolBreakdown, ChooseIf, KeyTakeaways, RelatedPosts, PricingIndexCallout): where the first affiliate CTA appears relative to the fold, whether every tool mention that has a live `/go/` slug is actually linked, CTA wording, whether the reader's next step is obvious at the decision point (comparison verdict, pricing table), the newsletter ask's placement and offer.
- **Tool hubs** (`/tools/<slug>/`): CTA prominence, whether hubs link out to the posts that mention them, thin hubs with no posts.
- **Homepage, `/tools/`, `/guides/`, `/reviews/`, `/revops-automation-pricing/`:** path from landing to a post to a click.
- **Newsletter offer:** what a visitor gets for subscribing. A lead magnet exists (check `OFF_SITE_SEO_CHECKLIST.md` and the "second lead magnet" TODO); is it offered where intent is highest?
- **Reach:** share/OG behaviour, RSS, internal linking between cluster posts, LinkedIn cadence (Ian, 3-5x/week), Beehiiv's free recommendations/boosts network, the brand-search nudge (open TODO). Off-site link building is a separate track: do not re-propose pitching the pricing index (Ian dropped it 10/01).
- **Speed/CLS** on mobile for a post page (a slow page costs every downstream metric).

**Step 3: recommend.** Rank by impact x effort; for each: the evidence, the change, the files, the metric that will move, the verify-after date. Mark which are quick wins (CSS/markup/copy, under ~1 hour each).

**Step 4: ask Ian** (AskUserQuestion, multiSelect) which recommendations to build this session. Recommend the top 3-5.

**Guardrails (hard):**
- No dark patterns: no fake urgency, no exit-intent traps that block reading, no fabricated social proof. There are 0 real subscribers, so no subscriber counts; no invented testimonials, "client" stories or usage numbers (S90 scrubbed fabricated anecdotes from 113 posts).
- The affiliate disclosure stays visible and unchanged in meaning; `rel="sponsored"` stays on affiliate links.
- Do not re-introduce the "AI tells" the design audit removed (`audits/AUDIT-DESIGN-2026-08-29.md` §4 guardrails); OG cards stay as-is (Ian, S97); do not rewrite titles for CTR (the 8/04 title test read FLAT).
- No em/en dashes in published content. Strict CSP: any new third-party endpoint needs a `_headers` change and a test on the deploy preview. Trailing slash on every internal URL.

## Part C. Build what Ian approved

One PR per coherent change (or one PR for a batch of CSS/copy quick wins), worktree in `C:\tmp`, QA as in Part A step 5, deploy-preview verification before asking Ian to merge. Production merges need Ian's approval. Log each change's pre-registered metric and check date in `TODO.md`.

---

## Date-gated asks for Ian (AskUserQuestion, only when the date has passed)

- **N4 (≥2026-10-22): Alita n8n MCP key**, which dies 2026-10-29. Ian creates a key on `https://alitahealth.app.n8n.cloud` (Settings > n8n API > Create, label `claude-mcp-noexpiry-<date>`, Expiration: No expiration, no scopes) and copies it. Do NOT ask him to run a PowerShell command from a question dialog (he cannot copy from it). Instead run it yourself with the PowerShell tool, printing nothing: `Get-Clipboard | Set-Content -NoNewline -Encoding ascii "$env:USERPROFILE\.n8n-alita-newkey.txt"`. Then run the swap script pattern from Session 97 (probe `GET /api/v1/workflows?limit=1` = 200 before writing; back up `~/.claude.json` to `.bak-good-<ts>`; set `mcpServers["n8n-alita"].env.N8N_API_KEY`; atomic write; verify all MCP servers still present; delete the key file; clear the clipboard). Ian then runs `/mcp` and reconnects `n8n-alita`.
- **N5 (~2026-10-24): GEO citation re-run** (TODO line, @ian): repeat the 9/24 baseline (5 queries x 5 engines; baseline 1/25 cited, in `OFF_SITE_SEO_CHECKLIST.md`). Ask Ian whether he runs it or Claude drafts the queries for him.

## Context (read, don't re-derive)
Session 98 (`docs/SESSION_LOG.md`) put 9 PartnerStack programs live + listed (PR #323 `73b04d8`) and found the `/tools/` category gap; Ian dropped pricing-index pitching. Sessions 96-97 built and proved the n8n retry stack, turned on the Google Indexing API, fixed the topic stager, and moved every homegrowngrowth n8n key in use to no expiry. Authority (zero independent referring domains) is still the binding SEO constraint; this session's work is on-site conversion, which helps every visitor already arriving but does not fix that. HGC outreach is dormant: do not build outreach plumbing.

## Rules
- Every question to Ian goes through AskUserQuestion; commands he must run go in a chat code block, never only inside a question (he cannot copy from the dialog).
- No secrets in chat, the transcript, or the public repo. Never read `.env.local`. Never `git add -A`.
- Live n8n writes go through `n8n/live-patch.mjs` (backup, verify, restore), dry run first. Ian approves production writes not listed here. Code changes: branch + PR, worktree in `C:\tmp` (junction `node_modules`; `cmd //c rmdir` it before `git worktree remove`); docs-only straight to master.

## Wrap-up
Session log entry (≤20 lines), `TODO.md` updated, `npm run qa:docs` 0 hard; root ops log (check `git log` for the latest op number first; another instance also logs there). Rewrite this file in place with whatever is still open; `git rm` it only when nothing is.
