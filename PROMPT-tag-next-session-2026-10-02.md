# Next session (TAG): parked checks, finish the redesign's remaining pages, wire R8

Start inside `theautomationsguide/`. State which model you are running as. Run `git pull --ff-only` on `master`. `TODO.md` is the only source of truth for open tasks; this file is a snapshot written at the end of Session 101 (2026-10-02, after the redesign merged), so re-check every claim with a query or against the repo before acting.

Read first: `CLAUDE.md`, `TODO.md`, the top of `docs/SESSION_LOG.md` (Sessions 100 and 101), `docs/DESIGN-SYSTEM.md` (the rules every new page follows), `audits/DESIGN-TEARDOWN-2026-10.md`.

## NEEDS FROM IAN (AskUserQuestion, at the point where each is needed)

1. **#337 merged?** One line: the 6sense vs Lusha post (#334) links `/go/marketo/`, which 404s in production. Then find out how a content PR merged with `qa:lint` 1 hard.
2. **RevOps Stack Audit template published?** It exists in Notion ("RevOps Stack Audit Template", 6/02). Ian: Share > Publish to web, allow duplicating as a template, send the public link. With the link, wire R8 (Part C3).
3. **Beehiiv steps done?** (planned for 10/03 to 10/04: stack the input, hide the title, welcome email, recommendations). If done, screenshot the signup at 375 px on a post and confirm the email field shows in full inside the new `EmailSignup` block.
4. **Date-gated, only once the date has passed:** N4 on or after 2026-10-22 (Alita n8n MCP key, dies 2026-10-29) and N5 about 2026-10-24 (GEO citation re-run). Both are spelled out in Part D.

## Part A. First real attributed click (read-only, about 5 minutes)

Query PostHog 408442 for `affiliate_click` after 2026-10-02 01:21Z, host-scoped to `theautomationsguide.com`, with `source_path`, `source_component`, `source_via`, `$device_type`, `is_automated`. As of 10/02 20:05Z: 1 event, the cold `/go/runable/` entry. Only `source_via` `click` or `last_page` proves attribution; `is_automated=true` is QA or bot traffic. The redesign deployed about 21:55Z on 10/02: report clicks before and after it separately, and expect `tool-strip` (the new tools panel) to start appearing. A TAG-page click with `source_via=none` is a bug: check `src/components/ClickSource.astro` and `src/pages/go/[tool].astro`. Do not read the 10/15 or 11/26 metrics early.

## Part B. Parked checks (Claude only)

1. **Watchdog anchor (#333):** first scheduled run after 10/02 19:20Z. `gh run list -R homegrowngrowthco/theautomationsguide --workflow n8n-watchdog.yml --limit 5 --json event,conclusion,createdAt,databaseId`; the `Window ...` log line must say `previous run`, starting at the previous run's start minus 3.4 h. `fallback 13h` plus `GitHub API HTTP 403` means `actions: read` did not take.
2. **Topic stager** (after Sunday 2026-10-04 06:00Z, allow for lag): green, topics staged as Suggested.
3. **Cadence re-check round 3** (on or after 2026-10-04): `C:\Users\Ian\.venvs\gsc\Scripts\python gsc-search-analytics.py 35`; provisional 9/22 to 9/28 was 16 clicks on 7,618 impressions. Confirm or revise; close or update the TODO line.
4. **Indexing re-check** (about 2026-10-08): `gsc-index-status.py` for `/tools/calendly/`, the 9/06 Beehiiv post and the 10/01 Mailchimp-to-Kit post; confirm the "Google Indexing Submit" node returned 200 on the first post merged after 10/01.

## Part C. Finish the redesign (the bulk of the session)

Everything follows `docs/DESIGN-SYSTEM.md`: ink only as the frame (nav, title band, footer), every reading surface cream or white, `ui/` components, no Tailwind, no dashes, no invented proof. Code changes go in a `C:\tmp` worktree on a branch and a PR; junction `node_modules`; remove the junction with PowerShell `[IO.Directory]::Delete(path, $false)` before `git worktree remove`.

1. **About and disclosure:** article layout in the system (title band with `Band`, 70ch column). The disclosure page lists every live affiliate program by name, generated from `src/data/affiliate-links.ts` (status `live`), never hand-typed.
2. **Tool hubs `/tools/<slug>/`:** title band with the logo tile, a pricing stat from the index with its read date (`ToolPricing`), the hub's posts as cards, one primary action. The CTA root class stays `tool-hub-actions` (ClickSource reports `hub-cta`).
3. **R8, once Ian sends the template link:** `EmailSignup` offers the RevOps Stack Audit (copy in `NEWSLETTER.md`), plus one mid-post ask after the first comparison table, not a popup. The Beehiiv welcome email delivers the link.
4. **Listing pages:** blog index, `/guides/<section>/`, `/teams/<slug>/`, `/playbooks/`, `/reviews/`: band header plus the latest-guides table or card grid from home.
5. **Gates before Ian sees anything:** add the new routes to `qa/qa-shots.mjs` `DEFAULT_ROUTES`; `npm run build && npm run qa:shots && npm run qa:lighthouse` (median of 3; home is at 95 with no margin), then `qa:lint`, `qa:render`, `qa:overflow`, `qa:logos`, `qa:seo`, `qa:docs`. Look at every screenshot first. Prove a `/go/` click on the preview still carries `source_component` (capture and abort the ingest request, as Session 101 did).
6. **Lows if time allows:** defer `SideBySide`'s load-time `offsetHeight` read without adding CLS; check what Lighthouse best-practices (77 everywhere) flags.

## Part D. Date-gated asks for Ian (only once the date has passed)

- **N4 (on or after 2026-10-22): Alita n8n MCP key, which dies 2026-10-29.** Ian creates a key on `https://alitahealth.app.n8n.cloud` (Settings > n8n API > Create, label `claude-mcp-noexpiry-<date>`, Expiration: No expiration, no scopes) and copies it. Do not ask him to run a command from a question dialog; run it yourself with the PowerShell tool, printing nothing: `Get-Clipboard | Set-Content -NoNewline -Encoding ascii "$env:USERPROFILE\.n8n-alita-newkey.txt"`. Then the Session 97 swap pattern: probe `GET /api/v1/workflows?limit=1` and require 200 before writing; back up `~/.claude.json`; set `mcpServers["n8n-alita"].env.N8N_API_KEY`; write atomically, verify; delete the key file and clear the clipboard. Ian runs `/mcp` and reconnects.
- **N5 (about 2026-10-24): GEO citation re-run.** Repeat the 9/24 baseline (5 queries x 5 engines, baseline 1 of 25), now with the redesign live. Ask Ian whether he runs it or Claude drafts the queries.

## Rules

- Every question to Ian goes through AskUserQuestion; attach screenshots when asking him to choose. Commands he must run go in a chat code block.
- No secrets in chat, the transcript or the public repo. Never read `.env.local`. Never `git add -A`. Commit trailers name the model actually running.
- Live n8n writes go through `n8n/live-patch.mjs` (backup, verify, restore), dry run first. Do not touch the engine, `n8n/` JSON, `backlog/`, `pricing/` scripts or `alita/` (except N4's `~/.claude.json`).
- The post component contract in `src/components/post/`, `src/data/tools.ts`, `src/data/affiliate-links.ts`, every `/go/` redirect, `ClickSource` and its root class names, `Analytics.astro`, the CSP and `_headers`, `trailingSlash: 'always'`, the sitemap and JSON-LD stay as they are.
- Do not name a component class `table` or `container`; keep buttons wrapping; give grid children `min-w-0`; use `:global(.x)` for a class passed to a child component's root; set `MSYS_NO_PATHCONV=1` when passing `/route/` arguments in Git Bash.

## Wrap-up

Session log entry (20 lines or fewer), `TODO.md` updated, `npm run qa:docs` 0 hard. Root ops log: check `git log` for the latest op number first. Rewrite this file in place with whatever is still open; `git rm` it only when nothing is.
