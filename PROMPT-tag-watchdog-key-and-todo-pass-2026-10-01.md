# Next session: finish the n8n retry stack (API key + GitHub secret), then a TAG TODO pass

Start this session inside `theautomationsguide/`. State which model you are running as before doing anything else.

**Written to run SAME DAY, 2026-10-01 from about 11:15 ET.** Timing facts for today:
- The engine's next scheduled run is **16:00 ET**. Make no engine edits between 15:50 and 16:15 ET. Afterwards, check that its execution succeeded (or was re-run by layer 2).
- The watchdog's first scheduled run is **12:30 ET (16:30 UTC)**, but only if PR #319 is merged by then. The secret is already set (1b/1c done). Before the merge, make the acknowledgement change (1d), or that run will go red. **Go straight to 1d after the 1a preflight**; leave the Part 2 TODO pass until after the merge.
- Things you can only check tomorrow are parked; see 1a and Part 2.

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
- `node --env-file=../growth-engine/.env n8n/watchdog.mjs --dry`. **Today this is EXPECTED to report the 10/01 morning failures** (Topic Suggestor 7:30 = execution `22996`; after about 11:25 ET also Engine 8:00 = `23000` and Ian Queue Reminder 8:00 = `22998`). All three were recovered on 10/01 by fresh manual triggers (`23007`, `23006` opening PR #318, and `23008`), which are not linked as re-runs. Anything else it reports is a real finding.
- PARKED to the next session (date gate 2026-10-02 07:45 ET): check that the Daily Briefing's first live run with the stuck-Generating flag succeeded. Don't trigger it by hand today: it would post a duplicate briefing to Slack.
- Check whether any real failure has hit "Error Trigger — TAG" since 10/01 14:44Z, and how the re-run logic handled it. That would be the first production proof of layer 2.

### 1b + 1c. DONE: Ian created the n8n API key and set the GitHub secret
- **Done before this session started.** Ian created a new n8n API key and set the repo secret. `gh secret list` showed `N8N_API_KEY` updated **2026-10-01 15:22:35Z** (checked by the previous session). Re-run `gh secret list -R homegrowngrowthco/theautomationsguide` to confirm it's still there. Don't ask Ian to redo any of this.
- That proves the name exists, not that the key works. **The value is first proven by the watchdog run in 1d.** That can't run before the merge, because GitHub only offers manual runs for workflows already on the default branch.
- **Three unknowns. Ask Ian once, early, in a single AskUserQuestion:**
  1. **The key's expiry date** (as shown in n8n Settings > n8n API; just the date, never the key). Record it in the session log and in a dated TODO line ("renew N8N_API_KEY repo secret before <date>").
  2. **Full access or scoped?** If scoped, the watchdog needs `workflow:read` + `execution:list`. A scoped key may 403 on this instance (bug #26642, memory `reference_n8n_api_key_scopes_403`); 1d will show it.
  3. **Did he also paste the key into the n8n credential "n8n API (self) — watchdog" (step 1e)?** Only valid if the key is full access or includes `execution:retry`.
- Do **not** delete any existing n8n API key this session. The growth-engine `.env`, the `n8n` MCP, and the "n8n API (self) — watchdog" credential each hold one.
- If 1d shows the key rejected (HTTP 401/403): Ian creates a new **full access** key (n8n Settings > n8n API > Create an API key, label `automation-github-watchdog`, longest expiry), then in his own PowerShell window runs `gh secret set N8N_API_KEY -R homegrowngrowthco/theautomationsguide` and pastes it at the prompt. Re-run the watchdog.

### 1d. Acknowledge today's hand-recovered failures, merge PR #319, prove the watchdog end to end
- **Before merging, add an acknowledgement list to `n8n/watchdog.mjs`** on the PR branch (`ops/n8n-retry-layers`; its worktree is `C:\tmp\tag-n8n-retry`, so run `git pull` there first). Add a commented `ACKNOWLEDGED` map of execution id to reason, initially `22996`, `23000`, `22998` with "recovered by manual fresh trigger 2026-10-01 (23007 / 23006 / 23008)". `judge()` must treat an acknowledged root or failed execution as recovered. Add a selftest case: an acknowledged failure stays quiet, and an unacknowledged one still reports. Document in `n8n/README.md` ("Retry stack") that a hand-recovered incident is silenced by adding its id there. Rerun `node n8n/watchdog.mjs --selftest` and the live `--dry` (expect "All scheduled runs accounted for"), then push and wait for CI to go green.
- The 16:00 ET engine run can't be judged until about 19:25 ET (3.4h grace), so a green run this afternoon says nothing about it. The 04:30 UTC run tonight covers it.
- PR #319 carries only agent commits, so **Ian merges it** (or explicitly tells Claude to). The secret is already set, so the only gate is the acknowledgement change. Aim to merge before 12:30 ET (16:30 UTC) so the first scheduled run is useful. Merged later, just run it by hand. Re-check CI is green first.
- Claude triggers it with `gh workflow run n8n-watchdog.yml -R homegrowngrowthco/theautomationsguide`, then `gh run watch`. Expected: green, with the log line "All scheduled runs accounted for".
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
- **Due now (A):** Apollo-cluster read round 2 (due 10/01, i.e. today; rule: "apollo vs pipedrive" avg position < 20 is success, otherwise stop investing in the cluster).
- **Cadence re-check round 3 (due ~10/02):** today `gsc-search-analytics.py` ends on about 9/28, so the 9/22-9/28 week may just be in, but its last days are provisional GSC data. Run it. If the end date reaches 9/28, give a PROVISIONAL read (clicks AND impressions) and keep the TODO open for a confirming pull on or after 10/04. Otherwise PARK it.
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
- Once Part 1 is done, don't delete this file. Rewrite it in place as the next session's single prompt, holding only what's still parked: the 10/02 Daily Briefing check, tonight's 04:30 UTC watchdog run (first one to judge the 16:00 ET engine run), the confirming cadence pull ≥10/04, and the alita key ≥10/22. Delete it (`git rm`) only when nothing is parked.
- Final message: what's now live and proven, what Ian still owes, and what's parked (with dates).
