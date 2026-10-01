# Next session: parked checks after the n8n retry stack went live (written 2026-10-01, Session 97)

Start inside `theautomationsguide/`. State which model you are running as before doing anything else. Run `git pull --ff-only` on master first.

**Earliest useful start: 2026-10-02 after 07:45 ET.** Items below carry their own date gates; do only those whose date has passed, and keep the rest parked here. `TODO.md` is the only source of truth for open tasks; this file holds only time-gated checks.

## Context (read, don't re-derive)

Session 96 built a 3-layer n8n retry stack; Session 97 (2026-10-01) finished it: PR #319 merged (`5812090`) with an `ACKNOWLEDGED` map in `n8n/watchdog.mjs` silencing the 10/01 hand-recovered failures (22996, 23000, 22998). The `N8N_API_KEY` repo secret is a **full-access key with no expiry** (Ian, 10/01), proven by manual watchdog run `36885639756` ("All scheduled runs accounted for"). Read `docs/SESSION_LOG.md` Sessions 96-97 and n8n/README.md "Retry stack".

## Parked checks

1. **Daily Briefing's first live run with the stuck-Generating flag (gate: 2026-10-02 07:45 ET).** `mcp__n8n__n8n_executions` list for `HbCayxHdzdYdfvfP`: the 07:30 ET (11:30Z) run must be `success`. Do not trigger it by hand (duplicate Slack briefing).
2. **The 04:30 UTC watchdog run on 10/02 (gate: 2026-10-02 00:35 ET).** First run that judges the 16:00 ET 10/01 engine run. `gh run list -R homegrowngrowthco/theautomationsguide --workflow n8n-watchdog.yml --limit 3`: expect green with "All scheduled runs accounted for". Red with any finding = real, report it. Also confirm the 16:30 UTC 10/01 scheduled run (the first unattended one) was green, if Session 97's log does not already record it.
3. **Prune `ACKNOWLEDGED` (any time after 2026-10-02).** The three 10/01 ids are outside the ~16h window by then; removing them is optional tidying (code change, so branch + PR). Leave it if nothing else touches the file.
4. **Cadence re-check, round 3, confirming pull (gate: on/after 2026-10-04).** Run `C:\Users\Ian\.venvs\gsc\Scripts\python gsc-search-analytics.py 35`. Session 97's provisional read for 9/22-9/28 was 16 clicks / 7,618 impr. Confirm or revise, judge on clicks AND impressions, then close or update the TODO line.
5. **`n8n-alita` MCP key expires 2026-10-29 (gate: on/after 2026-10-22; PARK if earlier).** Ian creates a full-access, longest-expiry key on `https://alitahealth.app.n8n.cloud` (Settings > n8n API) and saves it to `%USERPROFILE%\.n8n-alita-newkey.txt` (never in chat). Claude writes a small `.mjs` (no inline `node -e`): back up `~/.claude.json` to `.bak-good-<date>`, set `mcpServers["n8n-alita"].env.N8N_API_KEY` from the file, write atomically, verify every MCP server is still present and `GET /api/v1/workflows?limit=1` returns 200 with the new key, then delete the key file. Never print the key. Ian runs `/mcp` and reconnects `n8n-alita`.

Note for later (do not act): the `growth-engine/.env` key, also used by the `n8n` MCP, expires **2026-12-31**.

## Rules
- No secrets in chat, the transcript, or the public repo. Never read `.env.local`. Never `git add -A`.
- Live n8n writes go through `n8n/live-patch.mjs` (backup, verify, restore), dry run first; Ian approves production writes not listed above.

## Wrap-up
- Log the session in `docs/SESSION_LOG.md` (≤20 lines), update `TODO.md`, `npm run qa:docs` 0 hard. Root ops log: check `git log` for the latest op number first.
- Rewrite this file in place with whatever is still parked; `git rm` it only when nothing is.
