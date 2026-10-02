# Next session (TAG): first attributed click, then the parked checks

Start inside `theautomationsguide/`. Before anything else, state which model you are running as. Run `git pull --ff-only` on master first.

`TODO.md` is the only source of truth for open tasks. This file is a 10/02 snapshot written after Session 100, so re-check every claim below with a query before acting on it.

**Order:**
1. Part A: first attributed click.
2. Part 0: parked checks whose gate has passed.
3. Beehiiv follow-up: Ian planned the `NEWSLETTER.md` steps for the weekend of 10/03-10/04 (not done as of 10/02). Ask whether they are done; if so, re-screenshot the post signup at 375px and confirm the email field shows in full.
4. Date-gated asks.

---

## Part A. First real click with attribution (Claude, ~5 min)

#326 merged **2026-10-02 01:21Z**. Count from there; events before it come from the old beacon and carry no source props. On 10/02 at 19:00Z there was 1 event since: a cold Google-referred entry straight to `/go/runable/` (`source_via=none`, correct for a cold entry). There has been no click from a TAG page yet.

1. **Query PostHog 408442** for `affiliate_click` after 2026-10-02 01:21Z.
   - Each must carry `source_path`, `source_component`, `source_via`, `$device_type` and `is_automated`.
   - Treat `is_automated = true` as QA or bot traffic and report how many there are.
   - `source_via` values: `click` (a TAG link click within 2 min), `last_page` (a TAG page within 30 min) or `none` (a cold entry). Only `click`/`last_page` prove attribution.
   - **If there are zero real clicks from a TAG page yet,** say so; do not trigger one.
   - **If a click from a TAG page is missing the props** (`source_via=none` although `$referrer`/session show an on-site visit), that is a bug. Investigate `src/components/ClickSource.astro` and `src/pages/go/[tool].astro`.
2. **Dashboard:** "Affiliate clicks by source block" (dashboard 1699394) should then show non-null blocks.
3. **Metric reads** are dated in TODO.md and pre-registered in `audits/AUDIT-CONVERSION-2026-10-01.md` §3:
   - about 2026-10-15: `source_path` coverage over 90%;
   - about 2026-11-26: the 8-week reads.
   - Do not read them early.

## Part 0. Parked checks

Claude does these; no input is needed. Do only those whose gate has passed, and say "parked" for the rest in the final message.

1. **Watchdog anchor, first scheduled run after #333** (gate: the run after 10/02 19:20Z; slots 16:30Z and 04:30Z fire hours late).
   - `gh run list -R homegrowngrowthco/theautomationsguide --workflow n8n-watchdog.yml --limit 5 --json event,conclusion,createdAt,databaseId`.
   - In `gh run view <id> --log`, the `Window ...` line must say `previous run`, and its start must equal the previous run's start minus 3.4h.
   - `fallback 13h` with `GitHub API HTTP 403` means the `actions: read` permission did not take: fix it in `.github/workflows/n8n-watchdog.yml`.
2. **Topic stager, first real run in 3 weeks** (gate: after Sunday 2026-10-04 06:00Z, allow for lag). The scheduled run must be green and stage topics as Suggested; check the run summary.
3. **Cadence re-check, round 3** (gate: on or after 2026-10-04).
   - Run `C:\Users\Ian\.venvs\gsc\Scripts\python gsc-search-analytics.py 35`.
   - The provisional 9/22-9/28 read was 16 clicks / 7,618 impressions.
   - Confirm or revise, judging both clicks and impressions, then close or update the TODO line.
4. **Indexing re-check** (gate: about 2026-10-08).
   - Run `gsc-index-status.py` for `/tools/calendly/`, the 9/06 Beehiiv post and the 10/01 Mailchimp-to-Kit post.
   - On the first post merged after 10/01, confirm that the "Google Indexing Submit" node in "Notion Publish Status — TAG" returned 200.

## Date-gated asks for Ian

Use AskUserQuestion, and only once the date has passed.

- **N4 (on or after 2026-10-22): Alita n8n MCP key, which dies 2026-10-29.**
  1. Ian creates a key on `https://alitahealth.app.n8n.cloud`: Settings > n8n API > Create, label `claude-mcp-noexpiry-<date>`, Expiration: No expiration, no scopes. He copies it.
  2. Do NOT ask him to run a PowerShell command from a question dialog; he cannot copy from it. Run it yourself with the PowerShell tool, printing nothing: `Get-Clipboard | Set-Content -NoNewline -Encoding ascii "$env:USERPROFILE\.n8n-alita-newkey.txt"`.
  3. Run the Session 97 swap-script pattern:
     - probe `GET /api/v1/workflows?limit=1` and require 200 before writing;
     - back up `~/.claude.json`;
     - set `mcpServers["n8n-alita"].env.N8N_API_KEY`;
     - write atomically, then verify;
     - delete the key file and clear the clipboard.
  4. Ian then runs `/mcp` and reconnects.
- **N5 (about 2026-10-24): GEO citation re-run.** Repeat the 9/24 baseline: 5 queries x 5 engines, baseline 1/25. Ask Ian whether he runs it or Claude drafts the queries.

## Context (read, don't re-derive)

- **Session 100** (`docs/SESSION_LOG.md`): Daily Briefing confirmed green; the watchdog window was anchored to the previous run (#333); auto-register now skips deep-link variants instead of minting a hub (#332).
- **Session 99** fixed the `/tools/` taxonomy and wrote the conversion audit.
  - 0 real subscribers, and the site cannot see a signup.
  - Click source was unknowable before #326.
  - About 63 post pageviews a week means no A/B tests; judge changes by pre-registered before/after rates.
- **Ian parked R8** (lead magnet). The Beehiiv steps (form layout, welcome email, recommendations) are drafted in `NEWSLETTER.md` for Ian to apply.
- **Authority** (zero independent referring domains) is still the binding SEO constraint. HGC outreach is dormant: do not build outreach plumbing.

## Rules

- Every question to Ian goes through AskUserQuestion. Commands he must run go in a chat code block, never only inside a question (he cannot copy from the dialog).
- No secrets in chat, the transcript, or the public repo. Never read `.env.local`. Never `git add -A`.
- **Live n8n writes:** go through `n8n/live-patch.mjs` (backup, verify, restore), dry run first. Ian approves any production write not listed here.
- **Code changes:** branch + PR, worktree in `C:\tmp` (junction `node_modules`; remove the junction before `git worktree remove`, using PowerShell `[IO.Directory]::Delete(path, $false)` if `cmd //c rmdir` fails).
- **Docs-only changes:** straight to master.

## Wrap-up

- Session log entry (20 lines or fewer).
- `TODO.md` updated.
- `npm run qa:docs` with 0 hard.
- Root ops log: check `git log` for the latest op number first, since another instance also logs there.
- Rewrite this file in place with whatever is still open; `git rm` it only when nothing is.
