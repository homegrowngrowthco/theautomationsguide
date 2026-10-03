# Next session (TAG): deps + lint gap first, then parked checks, R8, and the redesign's remaining pages

Start inside `theautomationsguide/`. State which model you are running as. Run `git pull --ff-only` on `master`. `TODO.md` is the only source of truth for open tasks; this file was last rewritten after Session 101 (2026-10-02; the redesign and #337 are merged, #338 published after it), so re-check every claim with a query or against the repo before acting.

Read first: `CLAUDE.md`, `TODO.md`, the top of `docs/SESSION_LOG.md` (Sessions 100 and 101), `docs/DESIGN-SYSTEM.md` (the rules every new page follows), `audits/DESIGN-TEARDOWN-2026-10.md`.

## NEEDS FROM IAN (AskUserQuestion, at the point where each is needed)

1. **RevOps Stack Audit template: publish it together, at the start of Part C.** It exists in Notion ("RevOps Stack Audit Template", page `373783cc-c845-8143-ae74-d6a01f03666f`, 6/02; Claude fixed its unsourced claim 10/02). Ian does the publish in the Notion UI (Share > Publish > Publish to web, turn on "Allow duplicate as template", copy the link); ask him for the link with AskUserQuestion, then verify it loads logged-out (curl 200 and the title in the HTML) before wiring R8 (Part C3). If he prefers, Claude can first re-read the page via the Notion MCP and propose any copy fixes.
2. **Beehiiv steps done?** (planned for 10/03 to 10/04: stack the input, hide the title, welcome email, recommendations). If done, screenshot the signup at 375 px on a post and confirm the email field shows in full inside the new `EmailSignup` block.
3. **Date-gated, only once the date has passed:** N4 on or after 2026-10-22 (Alita n8n MCP key, dies 2026-10-29) and N5 about 2026-10-24 (GEO citation re-run). Both are spelled out in Part D.

## Part 0. Housekeeping (Claude, first 10 minutes)

1. **Install the new dependency in the main checkout** (Ian asked Claude to run it): `npm install` inside `theautomationsguide/` (adds `lighthouse` from #335's lockfile; `node_modules` lives outside git). Then `npm run build && npm run qa:lighthouse` once to confirm the gate runs there; it takes about 4 minutes.
2. **Why did #334 merge with `qa:lint` 1 hard?** It shipped `[Marketo](/go/marketo/)` (404 in prod, fixed by #337 `28498db`). Read the qa run on #334's pre-push sha (`gh run list --workflow qa-content-pr.yml`, gotcha 5 in CLAUDE.md), the auto-merge threshold, and whether lint's "slug not in affiliate-links.ts" is a hard failure in CI. Fix the gap on a branch + PR if it is in `.github/workflows/` or `qa/`; it must block a dead `/go/` link before merge. Also run `npm run qa:lint` on master now (#338 merged 10/03 after the fix).
3. **Worktrees:** `git worktree prune -v`; about 20 stale `.git/worktrees/*` entries are OneDrive-locked (clear attributes, remove only git-confirmed-stale dirs).

## Part A. First real attributed click (read-only, about 5 minutes)

Query PostHog 408442 for `affiliate_click` after 2026-10-02 01:21Z, host-scoped to `theautomationsguide.com`, with `source_path`, `source_component`, `source_via`, `$device_type`, `is_automated`. As of 10/02 20:05Z: 1 event, the cold `/go/runable/` entry. Only `source_via` `click` or `last_page` proves attribution; `is_automated=true` is QA or bot traffic. The redesign deployed about 21:55Z on 10/02: report clicks before and after it separately, and expect `tool-strip` (the new tools panel) to start appearing. A TAG-page click with `source_via=none` is a bug: check `src/components/ClickSource.astro` and `src/pages/go/[tool].astro`. Do not read the 10/15 or 11/26 metrics early.

## Part B. Parked checks (Claude only)

1. **Watchdog anchor (#333):** first scheduled run after 10/02 19:20Z. `gh run list -R homegrowngrowthco/theautomationsguide --workflow n8n-watchdog.yml --limit 5 --json event,conclusion,createdAt,databaseId`; the `Window ...` log line must say `previous run`, starting at the previous run's start minus 3.4 h. `fallback 13h` plus `GitHub API HTTP 403` means `actions: read` did not take.
2. **Topic stager** (after Sunday 2026-10-04 06:00Z, allow for lag): green, topics staged as Suggested.
3. **Cadence re-check round 3** (on or after 2026-10-04): `C:\Users\Ian\.venvs\gsc\Scripts\python gsc-search-analytics.py 35`; provisional 9/22 to 9/28 was 16 clicks on 7,618 impressions. Confirm or revise; close or update the TODO line.
4. **Indexing re-check** (about 2026-10-08): `gsc-index-status.py` for `/tools/calendly/`, the 9/06 Beehiiv post and the 10/01 Mailchimp-to-Kit post; confirm the "Google Indexing Submit" node returned 200 on the first post merged after 10/01.

## Part C. R8, then finish the redesign (the bulk of the session)

Everything follows `docs/DESIGN-SYSTEM.md`: ink only as the frame (nav, title band, footer), every reading surface cream or white, `ui/` components, no Tailwind, no dashes, no invented proof. Code changes go in a `C:\tmp` worktree on a branch and a PR; junction `node_modules`; remove the junction with PowerShell `[IO.Directory]::Delete(path, $false)` before `git worktree remove`.

0. **R8 first, with the template link from ask 1:** `EmailSignup` offers the RevOps Stack Audit (copy drafted in `NEWSLETTER.md`; one sentence on what it is, the Notion link delivered by the Beehiiv welcome email, which Ian turns on), plus one mid-post ask after the first comparison table on comparison posts, not a popup. Keep the Beehiiv form id. Pre-register the read: real signups per week, baseline 0, read at the 11/26 metrics.
1. **About and disclosure:** article layout in the system (title band with `Band`, 70ch column). The disclosure page lists every live affiliate program by name, generated from `src/data/affiliate-links.ts` (status `live`), never hand-typed.
2. **Tool hubs `/tools/<slug>/`:** title band with the logo tile, a pricing stat from the index with its read date (`ToolPricing`), the hub's posts as cards, one primary action. The CTA root class stays `tool-hub-actions` (ClickSource reports `hub-cta`).
3. **Listing pages:** blog index, `/guides/<section>/`, `/teams/<slug>/`, `/playbooks/`, `/reviews/`: band header plus the latest-guides table or card grid from home.
4. **Gates before Ian sees anything:** add the new routes to `qa/qa-shots.mjs` `DEFAULT_ROUTES`; `npm run build && npm run qa:shots && npm run qa:lighthouse` (median of 3; home is at 95 with no margin), then `qa:lint`, `qa:render`, `qa:overflow`, `qa:logos`, `qa:seo`, `qa:docs`. Look at every screenshot first. Prove a `/go/` click on the preview still carries `source_component` (capture and abort the ingest request, as Session 101 did).
5. **Lows if time allows:** defer `SideBySide`'s load-time `offsetHeight` read without adding CLS; check what Lighthouse best-practices (77 everywhere) flags.

## Part D. Date-gated asks for Ian (only once the date has passed)

- **N4 (on or after 2026-10-22): Alita n8n MCP key, which dies 2026-10-29.** Ian creates a key on `https://alitahealth.app.n8n.cloud` (Settings > n8n API > Create, label `claude-mcp-noexpiry-<date>`, Expiration: No expiration, no scopes) and copies it. Do not ask him to run a command from a question dialog; run it yourself with the PowerShell tool, printing nothing: `Get-Clipboard | Set-Content -NoNewline -Encoding ascii "$env:USERPROFILE\.n8n-alita-newkey.txt"`. Then the Session 97 swap pattern: probe `GET /api/v1/workflows?limit=1` and require 200 before writing; back up `~/.claude.json`; set `mcpServers["n8n-alita"].env.N8N_API_KEY`; write atomically, verify; delete the key file and clear the clipboard. Ian runs `/mcp` and reconnects.
- **N5 (about 2026-10-24): GEO citation re-run.** Repeat the 9/24 baseline (5 queries x 5 engines, baseline 1 of 25), now with the redesign live. Ask Ian whether he runs it or Claude drafts the queries.

## Rules

- Every question to Ian goes through AskUserQuestion; attach screenshots when asking him to choose. Commands he must run go in a chat code block.
- No secrets in chat, the transcript or the public repo. Never read `.env.local`. Never `git add -A`. Commit trailers name the model actually running (Session 101 ran as Opus 5.5; check the system prompt, do not copy an old trailer).
- Live n8n writes go through `n8n/live-patch.mjs` (backup, verify, restore), dry run first. Do not touch the engine, `n8n/` JSON, `backlog/`, `pricing/` scripts or `alita/` (except N4's `~/.claude.json`).
- The post component contract in `src/components/post/`, `src/data/tools.ts`, `src/data/affiliate-links.ts`, every `/go/` redirect, `ClickSource` and its root class names, `Analytics.astro`, the CSP and `_headers`, `trailingSlash: 'always'`, the sitemap and JSON-LD stay as they are.
- Do not name a component class `table` or `container`; keep buttons wrapping; give grid children `min-w-0`; use `:global(.x)` for a class passed to a child component's root; set `MSYS_NO_PATHCONV=1` when passing `/route/` arguments in Git Bash.

## Wrap-up

Session log entry (20 lines or fewer), `TODO.md` updated, `npm run qa:docs` 0 hard. Root ops log: check `git log` for the latest op number first (another instance logs there; #1191 and #1192 were taken the same evening). Rewrite this file in place with whatever is still open; `git rm` it only when nothing is.
