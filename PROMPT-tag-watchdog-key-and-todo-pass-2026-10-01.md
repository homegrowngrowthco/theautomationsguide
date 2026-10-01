# Next session (TAG): run the parked checks, then the date-gated asks

Start inside `theautomationsguide/`. State which model you are running as before doing anything else. Run `git pull --ff-only` on master first.

**Earliest useful start: 2026-10-02 after 07:45 ET.** `TODO.md` is the only source of truth for open tasks; re-check every status below with a query before acting (this file was rewritten 10/01 after Session 98; N1-N3 are done, see `docs/SESSION_LOG.md` S98).

---

## Date-gated asks for Ian (AskUserQuestion, only when the date has passed)

- **N4 (≥2026-10-22): Alita n8n MCP key**, which dies 2026-10-29. Ian creates a key on `https://alitahealth.app.n8n.cloud` (Settings > n8n API > Create, label `claude-mcp-noexpiry-<date>`, Expiration: No expiration, no scopes) and copies it. Do NOT ask him to run a PowerShell command from a question dialog (he cannot copy from it). Instead run it yourself with the PowerShell tool, printing nothing: `Get-Clipboard | Set-Content -NoNewline -Encoding ascii "$env:USERPROFILE\.n8n-alita-newkey.txt"`. Then run the swap script pattern from Session 97 (probe `GET /api/v1/workflows?limit=1` = 200 before writing; back up `~/.claude.json` to `.bak-good-<ts>`; set `mcpServers["n8n-alita"].env.N8N_API_KEY`; atomic write; verify all MCP servers still present; delete the key file; clear the clipboard). Ian then runs `/mcp` and reconnects `n8n-alita`.
- **N5 (~2026-10-24): GEO citation re-run** (TODO line, @ian): repeat the 9/24 baseline (5 queries x 5 engines; baseline 1/25 cited, in `OFF_SITE_SEO_CHECKLIST.md`). Ask Ian whether he runs it or Claude drafts the queries for him.

## Parked checks (Claude, no input needed; do only those whose gate has passed)

1. **Daily Briefing's first live run with the stuck-Generating flag (gate: 2026-10-02 07:45 ET).** `mcp__n8n__n8n_executions` list for `HbCayxHdzdYdfvfP`: the 11:30Z run must be `success`. Do not trigger it by hand (duplicate Slack briefing).
2. **Watchdog scheduled runs + GitHub cron lag (gate: 2026-10-02 morning).** `gh run list -R homegrowngrowthco/theautomationsguide --workflow n8n-watchdog.yml --limit 5 --json event,conclusion,createdAt`. Expect the 10/01 16:30Z and 10/02 04:30Z `schedule` runs green ("All scheduled runs accounted for"); together they judge the 16:00 ET 10/01 engine run. Red with a finding = real, report it. Measure the lag (createdAt minus cron slot): this repo's scheduled runs landed 5-7h late on 10/01 (memory `reference_tag_github_scheduled_runs_lag_hours`). If lag is over ~1h or uneven, change `n8n/watchdog.mjs` to anchor each window's start to the previous completed watchdog run's `run_started_at` (GitHub API with `GITHUB_TOKEN`, `permissions: actions: read`; cap 36h; fall back to 13h), with selftests. Branch + PR.
3. **"Leadfeeder vs RB2B" post (queued 10/01, High).** When the engine opens its PR, confirm it links `/go/leadfeeder/` (or `/go/leadfeeder-web-visitors/`), not a raw URL.
4. **Topic stager's first real run in 3 weeks (gate: after Sunday 2026-10-04 06:00Z, allow for lag).** PR #322 fixed its selftest; a dry-run dispatch was green on 10/01. The scheduled run must be green AND stage topics as Suggested (check the run summary).
5. **Cadence re-check round 3, confirming pull (gate: on/after 2026-10-04).** `C:\Users\Ian\.venvs\gsc\Scripts\python gsc-search-analytics.py 35`. Provisional 9/22-9/28 read was 16 clicks / 7,618 impr (vs 11 / 4,671). Confirm or revise; judge clicks AND impressions; close or update the TODO line.
6. **Indexing re-check (gate: ~2026-10-08).** `gsc-index-status.py`: `/tools/calendly/`, the 9/06 Beehiiv post and the 10/01 Mailchimp-to-Kit post were pushed via the Google Indexing API on 10/01 (HTTP 200). The Indexing API is now live in "Notion Publish Status — TAG"; on the first post merged after 10/01, confirm its "Google Indexing Submit" node returned 200.
7. **Prune `ACKNOWLEDGED` in `n8n/watchdog.mjs` (any time after 10/02; optional).** Remove the three 10/01 ids only if the file is being edited anyway (e.g. item 2).

## Context (read, don't re-derive)
Session 98 put 9 PartnerStack programs live + listed (PR #323 `73b04d8`); Ian dropped pricing-index pitching. Sessions 96-97 built and proved the n8n retry stack, turned on the Google Indexing API, fixed the topic stager (PR #322), and moved every homegrowngrowth n8n key in use to **no expiry**. The old 2026-12-31 key is unused by anything known; if something breaks on 12/31, that is the lead. HGC outreach is dormant (growth-engine S57): do not build outreach plumbing.

## Rules
- Every question to Ian goes through AskUserQuestion; commands he must run go in a chat code block, never only inside a question (he cannot copy from the dialog).
- No secrets in chat, the transcript, or the public repo. Never read `.env.local`. Never `git add -A`.
- Live n8n writes go through `n8n/live-patch.mjs` (backup, verify, restore), dry run first. Ian approves production writes not listed here. Code changes: branch + PR, worktree in `C:\tmp`; docs-only straight to master.

## Wrap-up
Session log entry (≤20 lines), `TODO.md` updated, `npm run qa:docs` 0 hard; root ops log (check `git log` for the latest op number first; another instance also logs there). Rewrite this file in place with whatever is still open; `git rm` it only when nothing is.
