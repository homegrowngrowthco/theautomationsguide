# Next session: finish the n8n retry stack (API key + GitHub secret), then a TAG TODO pass

Start this session inside `theautomationsguide/`. State which model you are running as before doing anything else.

## Context (read, don't re-derive)

On 2026-10-01 (Session 96, op #1179) a Notion API outage failed 3 scheduled n8n runs. In response, a 3-layer retry stack was built and is **already live in n8n**:

1. Retry On Fail (3x, 5s) on 30 safe-to-repeat nodes in the 7 active TAG workflows.
2. Error workflow "Error Trigger — TAG" (`FTIVt7L1ZXleNUf6`) re-runs temporary failures from the failed node at 15m / 45m / 2h, then posts a "needs a human" alert.
3. A GitHub Action watchdog (`.github/workflows/n8n-watchdog.yml` + `n8n/watchdog.mjs`) that checks every scheduled run succeeded or was recovered. **This layer is not running yet.** It needs PR #319 merged and an `N8N_API_KEY` repo secret.

Also live: the Daily Briefing flags Content Calendar topics stuck in "Generating" for 3h+.

Read first: `docs/SESSION_LOG.md` Session 96, and the "Retry stack" section of `n8n/README.md` (it lists the measured n8n API facts the design depends on). `TODO.md` is the only source of truth for open tasks. Any status below is a 10/01 snapshot, so re-check before acting on it.

Run `git pull --ff-only` on master first. The OneDrive checkout was behind origin on 10/01.

## Part 1: finish the retry stack (do this first)

### 1a. Preflight (Claude, read-only)
- `gh pr view 319 --json state,mergeCommit`. If it's already merged, skip 1d.
- Confirm the `n8n` MCP works now: call `mcp__n8n__n8n_list_workflows`. The dead key was swapped on 10/01, and a fresh session picks up the new one. If it still 401s, fingerprint the key without printing it: decode the JWT `exp` and probe `GET /api/v1/workflows?limit=1`. The swap script pattern is in Session 96.
- `node --env-file=../growth-engine/.env n8n/watchdog.mjs --dry`. Expect "All scheduled runs accounted for", or a real finding worth reporting.
- Check that the 10/02 7:30 Daily Briefing execution succeeded (the first live run with the stuck-Generating flag).
- Check whether any real failure has hit "Error Trigger — TAG" since 10/01 14:44Z, and how the re-run logic handled it. That would be the first production proof of layer 2.

### 1b. Ian creates one n8n API key (walk Ian through this; he does it, the key never enters chat)

1. Open `https://homegrowngrowth.app.n8n.cloud`, then Settings (bottom-left) > **n8n API**.
2. **Create an API key.** Label: `automation-github-watchdog`. Expiration: the longest option offered (or "No expiration" if it's there). If the form offers scopes, choose **full access**: scoped keys 403 on every endpoint on this instance (see memory `reference_n8n_api_key_scopes_403`).
3. **Copy the key now.** n8n shows it only once. Keep it on the clipboard for 1c and 1e.
4. Tell Claude the expiry date shown (just the date, not the key). Claude records it in the session log and the TODO.
5. Do **not** delete any existing key this session. The growth-engine `.env`, the `n8n` MCP, and the "n8n API (self) — watchdog" credential each hold one.

### 1c. Ian adds it to GitHub as a repo secret

Option A, terminal (Ian's own PowerShell window, not Claude's):

```
gh secret set N8N_API_KEY -R homegrowngrowthco/theautomationsguide
```

It prompts "Paste your secret". Paste and press Enter. Nothing is echoed.

Option B, browser: github.com/homegrowngrowthco/theautomationsguide > Settings > Secrets and variables > Actions > **New repository secret**. Name `N8N_API_KEY`, paste the value, then **Add secret**.

Claude then verifies with `gh secret list -R homegrowngrowthco/theautomationsguide`: `N8N_API_KEY` should be listed with today's date. That proves the name, not the value; 1d proves the value.

### 1d. Merge PR #319 and prove the watchdog end to end
- PR #319 carries only agent commits, so **Ian merges it** (or explicitly tells Claude to). Re-check CI is green first.
- Claude triggers it with `gh workflow run n8n-watchdog.yml -R homegrowngrowthco/theautomationsguide`, then `gh run watch`. Expected: green, with the log line "All scheduled runs accounted for". From 10/02 00:30 ET onward, the 10/01 morning failures are outside its window.
- A red run with "BLIND" means the secret is missing. A red run with "rejected (HTTP 401)" means a bad paste: redo 1c. Any other finding is real, so report it.
- The `qa-freshness.yml` `n8n-selftests` job should be green on master too.

### 1e. Optional, recommended: put the same key into the n8n credential the re-runs use
The error workflow's re-runs (and the HGC Pipeline Health Watchdog) use the n8n credential **"n8n API (self) — watchdog"** (`QqyCzwSckPL4rFXW`). Nobody knows that key's expiry. Putting the new key in it gives every automation key one known expiry date.
1. Ian: n8n > Overview > **Credentials** > "n8n API (self) — watchdog" > edit. Keep the header Name as `X-N8N-API-KEY`, paste the new key into **Value**, then Save. **Edit in place.** Never delete and recreate it: that mints a new id and breaks every node bound to the old one.
2. Claude proves it with a real execution, not curl (memory `reference_n8n_credentials_api_and_bearer`): the next hourly run of "10 — Pipeline Health Watchdog (HGC)" (`tfFGp26xxa2yIO3v`) must succeed, with its "Recent Executions" node returning data.

### 1f. Time-gated: the `n8n-alita` MCP key expires 2026-10-29
**If today is before 2026-10-22, PARK this** and say so in the final message. Otherwise:
1. Ian creates a key on `https://alitahealth.app.n8n.cloud` (Settings > n8n API, longest expiry, full access) and saves it to a one-line file, `%USERPROFILE%\.n8n-alita-newkey.txt`, without pasting it in chat.
2. Claude writes a small `.mjs` (not inline `node -e`, which a hook blocks). It backs up `~/.claude.json` to `.bak-good-<date>`, reads the key file, sets `mcpServers["n8n-alita"].env.N8N_API_KEY`, writes atomically, and verifies all MCP servers are still present and the new key returns 200 on `GET /api/v1/workflows?limit=1`. Then it deletes the key file. Never print the key. The same pattern was used on 10/01 for the `n8n` server (Session 96).
3. Ian runs `/mcp` and reconnects `n8n-alita`.

Also note for later (do not act): the `growth-engine/.env` key, now also used by the `n8n` MCP, expires **2026-12-31**.

## Part 2: TODO pass

Read `TODO.md` fresh. For every open item, decide which bucket it falls in, and **check status with a query, never from memory or this prompt**:

- **A. Claude can finish it this session.** Do it, verify it, delete the line (detail goes to the session log).
- **B. Needs an Ian decision or action.** Batch these into AskUserQuestion calls (at most 4 questions each, recommended option first). Don't ask one at a time, and don't ask about anything you can check yourself.
- **C. Time-gated.** Park it with its date. Do it only if the date has passed.
- **D. Possibly stale or closable.** Close only with evidence: a query or a file showing it's done.

Hints from 10/01 (verify each one):
- **Due now (A):** Apollo-cluster read round 2 (due ~10/01; rule: "apollo vs pipedrive" avg position < 20 is success, otherwise stop investing in the cluster). Cadence re-check round 3 (due ~10/02; `gsc-search-analytics.py` ends 3 days back, so the 9/22-9/28 week needs a run on 10/02 or later; judge on clicks AND impressions).
- **Checkable, may close (D):** `/tools/calendly/` indexation (run `gsc-index-status.py`; if it's indexed, delete the "Request Indexing" item). The 31-posts-without-`updatedDate` count (re-count; it drains passively). The second lead magnet is gated on about 100 subscribers (read the count from the Beehiiv MCP).
- **Small code Claude could do (A, on a branch in `C:\tmp`):** audit low L-10, the inline-style DRY-up still left in `tools.astro:100` and the empty-state idiom across 4 hub pages.
- **Ian decisions (B):** MoltSets post vs hub, the Google Indexing API branch, welcome-email automation, OG cards (Direction D), the 6 zero-mention hubs and the factors-ai/prospeo orphans (delete or keep), promoting the 16-tool Suggested batch (Claude can prepare a one-screen shortlist first).
- **Ian-only external (B, just ask for status):** pitching the pricing index, the authority sprint, affiliate applications (the 6 from 8/19 and the Affiliate desk list), PartnerStack Network.
- **Parked (C):** GEO citation re-run ~2026-10-24, quarterly pricing rebuild ~2026-11-12, Beehiiv templates (plan-gated), HubSpot/n8n affiliate re-apply (traffic-gated), MoltSets hands-on (key-gated).

**Optional, same n8n instance, HGC (`growth-engine/`), only with Ian's explicit go-ahead.** These are production writes in another project. List them in the B batch and don't act unprompted:
- Apply the layer-2 retry pattern to HGC's "09 — Error Handler" (`OYOVvMb0WPOsg35N`). This was planned as the follow-up after TAG; `n8n/build-error-retry.mjs` is the template. Canary first.
- Remove the WF10 watchdog `TEST Webhook` node (root TODO, ⚪).
- Re-check whether WF3/WF4's Enriched pool has drained (root TODO; expected empty around 10-05).

## Rules for this session
- Open the HubSpot/franchise memory index only if HubSpot gets touched (it shouldn't).
- Live n8n writes go through `n8n/live-patch.mjs` (backup, verify, restore). Dry-run before `--apply`. Ian approves before any production write that isn't covered above.
- No secrets in chat, in the transcript, or in the public repo. Never read `.env.local`.
- Never `git add -A`. Docs-only changes commit straight to master. Code changes use a branch and PR, with the worktree in `C:\tmp`.
- File edits use the Edit/Write tools, not inline `node -e` / `python -c` (a hook blocks those).

## Wrap-up
- TAG `docs/SESSION_LOG.md` Session 97 (20 lines or fewer), TODO.md updated (delete closed items, re-rank anything added), `npm run qa:docs` with 0 hard failures.
- Root ops log: check `git log` for the latest op number first (it was #1179 on 10/01), then add 1 to 2 lines with a pointer.
- Delete this prompt file (`git rm`) once Part 1 is done. If Part 1 can't finish, update this file in place rather than writing a second prompt.
- Final message: what's now live and proven, what Ian still owes, and what's parked (with dates).
