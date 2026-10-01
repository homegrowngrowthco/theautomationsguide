# Next session: parked checks after the n8n retry stack went live (written 2026-10-01, Session 97)

Start inside `theautomationsguide/`. State which model you are running as before doing anything else. Run `git pull --ff-only` on master first.

**Earliest useful start: 2026-10-02 after 07:45 ET.** Items below carry their own date gates; do only those whose date has passed, and keep the rest parked here. `TODO.md` is the only source of truth for open tasks; this file holds only time-gated checks.

## Context (read, don't re-derive)

Session 96 built a 3-layer n8n retry stack; Session 97 (2026-10-01) finished it: PR #319 merged (`5812090`) with an `ACKNOWLEDGED` map in `n8n/watchdog.mjs` silencing the 10/01 hand-recovered failures (22996, 23000, 22998). The `N8N_API_KEY` repo secret is a **full-access key with no expiry** (Ian, 10/01), proven by manual watchdog run `36885639756` ("All scheduled runs accounted for"). Read `docs/SESSION_LOG.md` Sessions 96-97 and n8n/README.md "Retry stack".

## Parked checks

1. **Daily Briefing's first live run with the stuck-Generating flag (gate: 2026-10-02 07:45 ET).** `mcp__n8n__n8n_executions` list for `HbCayxHdzdYdfvfP`: the 07:30 ET (11:30Z) run must be `success`. Do not trigger it by hand (duplicate Slack briefing).
2. **Scheduled watchdog runs + GitHub cron lag (gate: 2026-10-02 morning).** `gh run list -R homegrowngrowthco/theautomationsguide --workflow n8n-watchdog.yml --limit 5 --json event,conclusion,createdAt`. Expect the 10/01 16:30Z and 10/02 04:30Z `schedule` runs green ("All scheduled runs accounted for"); together they judge the 16:00 ET 10/01 engine run. Red with a finding = real, report it. **Measure the lag** (createdAt minus the cron slot). Session 97 saw this repo's scheduled runs land 5-7h late (auto-merge cron 14:00Z ran 18:45-20:20Z; seo-freshness 13:00Z ran 20:03Z) and no 16:30Z watchdog run by 18:04Z. If lag > ~1h or uneven, the fixed 13h SPAN can leave gaps: change `watchdog.mjs` to anchor each window's start to the previous completed watchdog run's `run_started_at` (GitHub API via `GITHUB_TOKEN`, `actions: read`; cap at 36h; fall back to 13h), with selftests. Branch + PR.
3. **Topic stager's first real run in 3 weeks (gate: after Sunday 2026-10-04 06:00Z, allow for lag).** PR #322 fixed its selftest; a dry-run dispatch was green on 10/01. The scheduled run must be green AND stage topics as Suggested in Notion (check the run summary). Its queue self-clean also runs for the first time since 9/06.
4. **Prune `ACKNOWLEDGED` (any time after 2026-10-02).** The three 10/01 ids are outside the ~16h window by then; removing them is optional tidying (code change, so branch + PR). Leave it if nothing else touches the file.
5. **Cadence re-check, round 3, confirming pull (gate: on/after 2026-10-04).** Run `C:\Users\Ian\.venvs\gsc\Scripts\python gsc-search-analytics.py 35`. Session 97's provisional read for 9/22-9/28 was 16 clicks / 7,618 impr. Confirm or revise, judge on clicks AND impressions, then close or update the TODO line.
6. **`n8n-alita` MCP key expires 2026-10-29 (gate: on/after 2026-10-22; PARK if earlier; Ian chose to wait on 10/01).** Ian creates a full-access, longest-expiry key on `https://alitahealth.app.n8n.cloud` (Settings > n8n API) and saves it to `%USERPROFILE%\.n8n-alita-newkey.txt` (never in chat). Claude writes a small `.mjs` (no inline `node -e`): back up `~/.claude.json` to `.bak-good-<date>`, set `mcpServers["n8n-alita"].env.N8N_API_KEY` from the file, write atomically, verify every MCP server is still present and `GET /api/v1/workflows?limit=1` returns 200 with the new key, then delete the key file. Never print the key. Ian runs `/mcp` and reconnects `n8n-alita`.

Note (do not act): since 10/01 every homegrowngrowth n8n key in use has **no expiry** (repo secret, the "n8n API (self) — watchdog" credential, `growth-engine/.env` + the `n8n` MCP). The old key that expires 2026-12-31 is no longer used by anything known; if something breaks on 12/31, that is the lead. The script that swapped keys without printing them is described in Session 97 (clipboard -> `%USERPROFILE%\.n8n-*newkey.txt` -> probe 200 -> write with backups -> delete file); reuse that pattern for the alita key.

## Rules
- No secrets in chat, the transcript, or the public repo. Never read `.env.local`. Never `git add -A`.
- Live n8n writes go through `n8n/live-patch.mjs` (backup, verify, restore), dry run first; Ian approves production writes not listed above.

## Wrap-up
- Log the session in `docs/SESSION_LOG.md` (≤20 lines), update `TODO.md`, `npm run qa:docs` 0 hard. Root ops log: check `git log` for the latest op number first.
- Rewrite this file in place with whatever is still parked; `git rm` it only when nothing is.
