# Next session (TAG): quick checks first, then raise the site to the homecare-leadgen standard

Start inside `theautomationsguide/`. State which model you are running as. Run `git pull --ff-only` on `master`. `TODO.md` is the only source of truth for open tasks; this file is a 2026-10-02 snapshot written after Session 100 (and after the homecare-leadgen S2 redesign shipped the same day), so re-check every claim below with a query or against the repo before acting.

Read first: `CLAUDE.md`, `TODO.md`, the top of `docs/SESSION_LOG.md` (Sessions 99 and 100), `audits/AUDIT-CONVERSION-2026-10-01.md`, `audits/AUDIT-DESIGN-2026-08-29.md`. Then the sibling project that sets the bar: `../homecare-leadgen/docs/DESIGN-TEARDOWN-2026-10.md`, `../homecare-leadgen/docs/DESIGN-SYSTEM.md`, `../homecare-leadgen/docs/SESSION_LOG.md` (S2), and the memory `reference_astro7_tailwind4_visual_qa_gotchas`. Open https://local-home-care-guide.netlify.app at phone and desktop widths. That site went from "janky vibe-coded" to Ian's "this site looks really good" in one session; TAG should feel like the same studio made it: calm, specific, designed rather than generated.

## NEEDS FROM IAN (ask each with AskUserQuestion, at the point in the order where it is needed)

1. **Beehiiv steps done?** Ian planned the `NEWSLETTER.md` steps (stack the form input, hide its title, welcome email, recommendations network) for the weekend of 10/03 to 10/04. If done, re-screenshot the post signup at 375 px and confirm the email field shows in full; the rebuilt `EmailSignup` in Part 2 must keep that layout.
2. **Palette: keep the Brand Kit v2.2 colors, or allow a refresh?** The kit is the brand. Default is to keep its hues and fix the execution (type, spacing, hierarchy, components). Change hue values only if Ian says so.
3. **Direction choice** (after the teardown): two or three artboards of the post template and the home page in a Design artifact, rendered PNGs sent with SendUserFile before the question. Last time Ian chose the navy centered-marketplace direction over the recommended one, so show real alternatives, not three shades of one idea.
4. **Is the "RevOps Stack Audit" Notion template real and publishable?** It decides whether the newsletter block gets a real reason to subscribe (audit R8) or stays a plain signup.
5. **Date-gated, only once the date has passed:** N4 on or after 2026-10-22 (Alita n8n MCP key, dies 2026-10-29) and N5 about 2026-10-24 (GEO citation re-run). Both are spelled out in Part D.

## Order of work

1. **Part A** (about 5 minutes, read-only): first attributed affiliate click. Its result is the attribution baseline the redesign must preserve.
2. **Part B**: parked checks whose gate has passed; say "parked" for the rest in the final message.
3. **Part C**: the UI quality program (teardown, design system, pages, gates, ship). This is the bulk of the session and may span more than one.
4. **Part D**: date-gated asks, only if their date has passed.

---

## Part A. First real click with attribution

#326 merged **2026-10-02 01:21Z**. Count from there; earlier events come from the old beacon and carry no source props. At 10/02 19:00Z there was 1 event since: a cold Google-referred entry straight to `/go/runable/` (`source_via=none`, correct for a cold entry). No click from a TAG page yet.

1. **Query PostHog 408442** for `affiliate_click` after 2026-10-02 01:21Z, host-scoped to `theautomationsguide.com`.
   - Each event must carry `source_path`, `source_component`, `source_via`, `$device_type` and `is_automated`.
   - `is_automated = true` is QA or bot traffic; report how many.
   - `source_via` is `click` (a TAG link click within 2 min), `last_page` (a TAG page within 30 min) or `none` (cold entry). Only `click` and `last_page` prove attribution.
   - **Zero real clicks from a TAG page yet:** say so; do not trigger one.
   - **A click from a TAG page missing the props** (`source_via=none` although `$referrer` or the session shows an on-site visit) is a bug: investigate `src/components/ClickSource.astro` and `src/pages/go/[tool].astro`.
2. **Dashboard** "Affiliate clicks by source block" (dashboard 1699394) should then show non-null blocks.
3. **Metric reads** are dated in TODO.md and pre-registered in the conversion audit §3: about 2026-10-15, `source_path` coverage over 90 percent; about 2026-11-26, the 8-week reads. Do not read them early. After Part C merges, add the before and after clicks per 100 post pageviews by `source_component` to that TODO item.

## Part B. Parked checks (Claude only, no input needed)

1. **Watchdog anchor, first scheduled run after #333** (gate: the run after 10/02 19:20Z; the 16:30Z and 04:30Z slots fire hours late). `gh run list -R homegrowngrowthco/theautomationsguide --workflow n8n-watchdog.yml --limit 5 --json event,conclusion,createdAt,databaseId`; in `gh run view <id> --log` the `Window ...` line must say `previous run` and its start must equal the previous run's start minus 3.4 h. `fallback 13h` with `GitHub API HTTP 403` means `actions: read` did not take: fix `.github/workflows/n8n-watchdog.yml`.
2. **Topic stager, first real run in 3 weeks** (gate: after Sunday 2026-10-04 06:00Z, allow for lag). The scheduled run must be green and stage topics as Suggested; check the run summary.
3. **Cadence re-check, round 3** (gate: on or after 2026-10-04). `C:\Users\Ian\.venvs\gsc\Scripts\python gsc-search-analytics.py 35`; the provisional 9/22 to 9/28 read was 16 clicks on 7,618 impressions. Confirm or revise on both clicks and impressions, then close or update the TODO line.
4. **Indexing re-check** (gate: about 2026-10-08). `gsc-index-status.py` for `/tools/calendly/`, the 9/06 Beehiiv post and the 10/01 Mailchimp-to-Kit post. On the first post merged after 10/01, confirm the "Google Indexing Submit" node in the "Notion Publish Status" workflow (TAG) returned 200.

## Part C. The UI quality program

### The brief

TAG's problem is different from homecare's. Design de-AI already shipped (Sessions 81 to 87), the brand kit is applied, and the money metric is affiliate clicks per post pageview (baseline 3.8 to 5.9 per 100, audit 10/01), with newsletter signups at zero. Traffic is 90 percent desktop, about 63 post pageviews a week, and the top entry pages are comparison posts (apollo-vs-clay, gong-vs-outreach, activecampaign-vs-hubspot). So the post template is the money page, the way get-matched was for homecare, and the home page is second. The goal is a site a RevOps lead would bookmark and cite: editorial authority, visible methodology, comparison tables that are a pleasure to read, and one obvious action per screen.

### What does NOT change

- Every post's MDX body, the component contract in `src/components/post/` (the engine writes to it twice a day), `src/data/tools.ts`, `src/data/affiliate-links.ts`, every `/go/<slug>` redirect, the `ClickSource` attribution from PR #326 (`source_path`, `source_component`, `source_via` must keep flowing; Part A and the 10/15 and 11/26 reads depend on it), `Analytics.astro`, the CSP and `_headers`, `trailingSlash: 'always'`, the sitemap and JSON-LD, the pricing index data and its CC BY 4.0 notice, the Beehiiv form id.
- All QA gates in `qa/` keep passing: `qa:lint`, `qa:render`, `qa:overflow`, `qa:logos`, `qa:seo`, `qa:docs`. Add the two new gates from homecare rather than weakening any.
- No fake urgency, exit-intent walls, invented social proof, star ratings, "trusted by" logos, or testimonials (the audit's out-of-scope list and homecare's honest-trust rule). TAG's real proof: 164 posts, the pricing index (65 of 93 tools priced from vendor pages, dated), 32 live affiliate programs disclosed by name, the named author.
- No em or en dashes anywhere (the sanitizer and lint already enforce it).

### C0. Teardown first (about 45 minutes, before any code)

Copy `../homecare-leadgen/scripts/teardown-shots.mjs`, point it at the sites below, run it at 1440 and 390 (headless Chromium from `%LOCALAPPDATA%\ms-playwright\chromium-1228`; the Chrome download 403s on this network; sites that block headless get a headed run), and write `audits/DESIGN-TEARDOWN-2026-10.md`: one paragraph per site on what to borrow and avoid, then a one-page direction for TAG.

- **Affiliate and review editorial (our model):** Wirecutter (methodology-forward reviews, "why you should trust us", pick boxes, comparison tables, disclosure placement), Zapier blog (app comparisons with sticky tables, plain language), Ahrefs blog and Backlinko (long-form with a left-rail table of contents and data callouts), Every (editorial type, author presence), Lenny's Newsletter (newsletter conversion without tricks), The Verge reviews (scorecards with stated criteria), G2 and Capterra (what to avoid: density, review-count theatre).
- **Product polish for components:** Linear and Vercel (tables, badges, dark bands), Stripe docs (sticky ToC, hierarchy), Notion's template gallery (card grids).
- **Pattern evidence to cite:** methodology block near the top of every review; affiliate disclosure visible before the first link, not only in the footer; a comparison table that stays readable at 390 (first column sticky, horizontal scroll inside the table only); one primary action per screen; author byline with a real photo and a one-line credential; "last verified" dates on every price.

### C1. Design system before pages

1. Load `artifact-design`. Open the Design System artifact "Local Home Care Guide" (https://claude.ai/artifact/4VL8eojsit5CAP7G9T13oK) for the format, then create one for TAG from the Brand Kit v2.2 tokens already in `src/styles/global.css` (revalue and augment, never rename; memory `reference_applying_claude_design_kits`). Mirror the result back into the repo.
2. **Stack decision, stated in the first message:** TAG is on Astro 4 and the Astro 6 upgrade is a deferred audit low. Tailwind v4's Vite plugin works on Astro 4's Vite 5, so the token-to-utility layer can be added without the upgrade. Astro's fonts API (metric-matched fallbacks, which took homecare's CLS to 0) needs Astro 5.7 or later, so either do the upgrade first on its own PR (preferred if `npm run qa:render` passes afterwards) or self-host the fonts with hand-written `@font-face` plus `size-adjust` fallbacks. No Google Fonts links stay.
3. **Type:** keep the kit's display face if it carries the brand; pair it with one text face; a real 1.25 scale; a 68 to 72 character measure for post bodies; tabular numerals in every table and price.
4. **Components:** `src/components/ui/` as in homecare (Container, Section, Button, Card, Badge, Stat, Callout, Accordion, Table), then the TAG-specific ones rebuilt on them: `ComparisonTable`, `ToolPricing`, `PostCard`, `EmailSignup`, `AuthorNote`, the pick box, the methodology block, the disclosure line.
5. **Imagery:** the card imagery for all posts (PR #261) stays; tool logos stay under `qa:logos`; no stock photos of people at laptops. TAG's visuals are tables, logos, screenshots and data.
6. **Iconography:** Lucide, one size, used sparingly.

### C2. Page by page (priority order)

- **Post template (the money page):** a header that gets out of the way; title, byline with photo and one-line credential, published and updated dates, reading time; a disclosure line above the first affiliate link; a methodology block ("how we compared these") near the top of comparison posts; left-rail ToC on desktop (the homecare service-page pattern); the comparison table with a sticky first column and the `/go/` buttons as real buttons; pick boxes for the verdict; pricing from the index with its "verified on" date; a related-posts grid; the newsletter block once, with a real reason to subscribe if Ian confirms the template exists (ask 4).
- **Home:** one sentence on what the site is, the newest and most-read posts, the tool hubs as a grid, the pricing index as the linkable asset, the author. No hero image; the content is the hero.
- **/tools/ and /tools/<slug>/:** 46 cards in 11 sections already render; make each card consistent (logo tile, one line, program status) and give each hub a pricing stat and its posts.
- **Pricing index:** a product-grade table (the homecare calculator result panel is the reference for the summary; the dataviz skill for any chart), filter row, "verified on" per row, download link for the CC BY dataset.
- **About, disclosure, privacy, terms:** article layout, same system; the disclosure page lists every live program by name.

### C3. Quality gates before Ian sees anything

Copy `../homecare-leadgen/scripts/qa-shots.mjs` and `qa-lighthouse.mjs`, adapt the route list (home, /tools/, two tool hubs, the three top comparison posts, the pricing index, about, disclosure, search), and add them as `qa:shots` and `qa:lighthouse`. Pass criteria: 0 overflow and 0 console errors across all routes at 390, 768 and 1440; Lighthouse mobile Performance 95+, Accessibility 100, SEO 100, CLS 0 on the post template, home, /tools/ and the pricing index. Look at every screenshot yourself before the AskUserQuestion (memory `feedback_qa_before_user_review`); check one post at 390 with a 20 px root font. Then the existing gates: `npm run qa:lint && npm run qa:render && npm run qa:overflow && npm run qa:logos && npm run qa:seo && npm run qa:docs`. Test search on the deploy preview, not locally (CSP). Before merging, re-run Part A's query shape against the preview with analytics unblocked to prove a `/go/` click from a redesigned post still carries `source_component`.

### C4. Ship

- Worktree in `C:\tmp` off `origin/master` (junction `node_modules` for sharp per CLAUDE.md gotcha 3, or a fresh install if deps change; remove the junction before `git worktree remove`, using PowerShell `[IO.Directory]::Delete(path, $false)` if `cmd //c rmdir` fails; OneDrive locks stale worktree metadata, so clear attributes and remove only the git-confirmed-stale dirs, of which about 20 exist today). Branch `design/2026-10`. Two PRs: design system and tooling first, then the templates. Netlify builds a deploy preview per PR; send Ian the preview link and the PNGs. Ian merges; master auto-deploys.
- Docs: `audits/DESIGN-TEARDOWN-2026-10.md`, `docs/DESIGN-SYSTEM.md`, a session-log entry of 20 lines or fewer, `TODO.md` updated, `CLAUDE.md` tech stack and current-state lines refreshed, `qa:docs` 0 hard.

## Part D. Date-gated asks for Ian (AskUserQuestion, only once the date has passed)

- **N4 (on or after 2026-10-22): Alita n8n MCP key, which dies 2026-10-29.** Ian creates a key on `https://alitahealth.app.n8n.cloud` (Settings > n8n API > Create, label `claude-mcp-noexpiry-<date>`, Expiration: No expiration, no scopes) and copies it. Do NOT ask him to run a PowerShell command from a question dialog (he cannot copy from it); run it yourself with the PowerShell tool, printing nothing: `Get-Clipboard | Set-Content -NoNewline -Encoding ascii "$env:USERPROFILE\.n8n-alita-newkey.txt"`. Then the Session 97 swap-script pattern: probe `GET /api/v1/workflows?limit=1` and require 200 before writing; back up `~/.claude.json`; set `mcpServers["n8n-alita"].env.N8N_API_KEY`; write atomically, then verify; delete the key file and clear the clipboard. Ian then runs `/mcp` and reconnects.
- **N5 (about 2026-10-24): GEO citation re-run.** Repeat the 9/24 baseline: 5 queries x 5 engines, baseline 1 of 25. Ask Ian whether he runs it or Claude drafts the queries.

## Context (read, do not re-derive)

- **Session 100:** Daily Briefing confirmed green; the watchdog window anchored to the previous run (#333); auto-register now skips deep-link variants instead of minting a hub (#332).
- **Session 99:** `/tools/` taxonomy fixed; the conversion audit written. 0 real subscribers and the site cannot see a signup; click source was unknowable before #326; about 63 post pageviews a week means no A/B tests, so judge changes by pre-registered before and after rates.
- **Ian parked R8** (lead magnet); the Beehiiv steps are drafted in `NEWSLETTER.md` for Ian to apply.
- **Authority** (zero independent referring domains) is still the binding SEO constraint. HGC outreach is dormant: do not build outreach plumbing.
- **homecare-leadgen S2** (2026-10-02): the method that worked was teardown first, three directions chosen by Ian from rendered artboards, design system before pages, honest trust layer only, then screenshot and Lighthouse gates reviewed by Claude before Ian saw anything.

## Rules

- Every question to Ian goes through AskUserQuestion; attach screenshots when asking him to choose. Commands he must run go in a chat code block, never only inside a question.
- No secrets in chat, the transcript, or the public repo. Never read `.env.local`. Never `git add -A`. Commit messages end with `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`; PR bodies end with the Claude Code attribution line.
- **Live n8n writes** go through `n8n/live-patch.mjs` (backup, verify, restore), dry run first; Ian approves any production write not listed here.
- **Code changes:** branch + PR in a `C:\tmp` worktree. **Docs-only changes:** straight to master.
- Do not touch the engine, `n8n/` workflow JSON, `backlog/`, `pricing/` scripts or anything under `alita/` (except the N4 key swap, which touches only `~/.claude.json`).
- Do not name a component class `table`, `container` or any other Tailwind utility name. Keep buttons wrapping (no `nowrap`), give grid children `min-w-0`, and set `MSYS_NO_PATHCONV=1` when passing `/route/` arguments to node scripts in Git Bash.

## Wrap-up

- Session log entry (20 lines or fewer), `TODO.md` updated, `npm run qa:docs` with 0 hard.
- Root ops log: check `git log` for the latest op number first, since another instance also logs there.
- Rewrite this file in place with whatever is still open; `git rm` it only when nothing is.
