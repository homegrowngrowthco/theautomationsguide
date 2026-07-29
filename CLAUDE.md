# The Automations Guide (TAG)

RevOps/GTM automation blog at **theautomationsguide.com**. Affiliate-monetized (every tool links via `/go/<slug>`), with a fully automated daily content engine. Author identity: Ian (byline "Ian Chamberland" on site).

- **Repo:** `github.com/homegrowngrowthco/theautomationsguide`, branch `master` (not main). Public repo.
- **Deploy:** Netlify auto-deploys every push to master (~90s). Rollback guide: [DEPLOYMENT.md](DEPLOYMENT.md).
- **History:** full session-by-session log in [docs/SESSION_LOG.md](docs/SESSION_LOG.md). Open tasks ONLY in [TODO.md](TODO.md).

## Architecture map

| Area | Where | Notes |
|---|---|---|
| Posts | `src/content/blog/*.mdx` | MDX + component library in `src/components/post/` |
| Tool registry | `src/data/tools.ts` | `/tools/<slug>` hubs; `listed:false` = indexable but off homepage/grid |
| Affiliate registry | `src/data/affiliate-links.ts` | **Source of truth for every `/go/<slug>` redirect + program status.** Missing entry = 404 = hard lint fail |
| QA gates | `qa/` | `lint-content` `render-acceptance` `mobile-overflow` `lint-logos` `seo-scan` `auto-register-tools` + Vision review/fixer. npm: `qa:lint` `qa:render` `qa:overflow` `qa:logos` `qa:seo` `qa:docs` |
| Topic/LP builders | `backlog/` | `build-backlog.mjs` (weekly GHA, stages Notion `Suggested`; `--status` = queue census), `build-tool-lp.mjs` |
| Engine + deployers | `n8n/` | `blog-post-engine.json` + idempotent `update-engine-*.mjs` updaters; deploy via `deploy-engine.mjs --apply` (needs `N8N_API_URL`+`N8N_API_KEY` in env; source: `node --env-file=../growth-engine/.env`) |
| CI | `.github/workflows/` | `qa-content-pr.yml` (content gates), `auto-merge-content.yml` (2-day threshold, alerts on stuck PRs), `topic-backlog.yml` (weekly), `handle-tool-reply.yml` (PR-comment tool registration) |
| Analytics | `analytics/` + GSC scripts | `posthog-setup.mjs`; root `gsc-index-status.py` + `gsc-search-analytics.py` (OAuth cache `~/.gsc/`, venv `C:\Users\Ian\.venvs\gsc`) |
| Audits | `audits/` | Dated reports. Findings freeze at write time; resolution is tracked ONLY in TODO.md |

## Content engine (live)

- n8n Cloud `homegrowngrowth.app.n8n.cloud`, workflow **"Blog Post Engine — TAG (v3)"** id `sjZADhZGIuz9tZHK`, cron 8am ET daily, 32 nodes.
- Flow: Notion Content Calendar (`Status: Queued`) → generate/humanize (Sonnet) → sanitize → PR on `content/<slug>` branch → QA workflow (auto-register + gates + Vision) → human merge (auto-merge backstop after 2 days green).
- Notion DBs: Content Calendar `62f34586-4f78-4b83-b2ac-105f500d059e`, Drafts `7399699b-ef9d-4ef4-8c2c-4749f99b5b76`. Queue lives in Notion — never snapshot it into the repo.
- Engine changes: edit via an idempotent `n8n/update-engine-*.mjs` updater, dry-run, `deploy-engine.mjs --apply`, then GET-verify live. Keep `n8n/blog-post-engine.json` in sync with the live instance.
- Other live workflows: Topic Suggestor, Daily Briefing, PostHog Monitor, Notion Publish Status (webhook on PR merge), Error Trigger, PR + Backlink Monitor. All TAG Slack alerts lead with `🤖 *The Automations Guide*` (keep for any new alerting workflow).

## Docs + logging conventions (2026-07-17)

- **TODO.md holds open tasks only.** Delete an item when it closes (its detail lives in the session log). Re-rank on add. `npm run qa:docs` fails on any `[x]` left in TODO.md and on CLAUDE.md >400 lines.
- **Session log:** one entry per session in [docs/SESSION_LOG.md](docs/SESSION_LOG.md), newest first, target ≤20 lines (shipped / PRs+SHAs / verify one-liner / revert / gotchas). Root ops-log gets 1-2 lines + a pointer here.
- **Docs-only changes commit direct to master** — no PR, no worktree.
- **Audits** go in `audits/AUDIT-<TYPE>-<date>.md`; remediation items go to TODO.md; do not maintain resolution state inside the audit file beyond a header note.
- Do not re-create: AFFILIATE_PROGRAMS.md (merged into [AFFILIATE_PIPELINE.md](AFFILIATE_PIPELINE.md)), CONTENT_CALENDAR.md (queue is in Notion), GSC-TIER2-CHECKLIST.md (done).

## Key IDs / integrations

- PostHog project **408442** (dashboard 1699394); GA4 `G-RKWHJ95P3H`; GSC property `sc-domain:theautomationsguide.com`; Beehiiv form `d41efc59-7041-482b-8178-6d238e6c3cfa`; IndexNow key file `dde35cca97309131104c0505957f0948.txt`.
- Repo secrets: `ANTHROPIC_API_KEY`, `NOTION_TOKEN`, `SLACK_WEBHOOK_URL` (+ `GSC_TOKEN_JSON` pending, see TODO).

## Evergreen gotchas (earned the hard way — details in the session log)

1. **No em/en dashes in any published content.** Hard rule. Enforce deterministically (sanitizer/lint), never by prompt alone.
2. **n8n expression tokenizer:** prompt bodies are `={{ ... }}` expressions. No backticks, no inner `{{`/`}}` (space them `{ {`), keep brace count 1/1. `new Function` compile tests do NOT catch this class.
3. **Worktrees in `C:\tmp`** for any branch work (no OneDrive churn). Junction node_modules for sharp: `cmd //c "mklink /J <link> <target>"` (Git Bash eats bare backslashes); `cmd //c rmdir` the junction before `git worktree remove`. OneDrive locks stale worktree metadata — fix via `git worktree prune -v` + remove ONLY git-confirmed-stale dirs.
4. **A pre-gate fixer must scan the same surface as the gate it feeds** (auto-register vs lint-content class). Auto-register's guards: parked/placeholder/app-shell rejection, brand-stem host check, registry-first homepage, logo transparency validation.
5. **GITHUB_TOKEN pushes from inside the qa job** create permanently-stuck `action_required` run stubs; read the qa verdict from the pre-push sha. `issue_comment` workflows run from the DEFAULT branch, so reply-handler fixes only apply once merged to master.
6. **"Fixed (PR open)" is not shipped** — check `gh pr view <n> --json state` before assuming a logged fix is live. Content PRs carrying only agent commits are classifier-gated: Ian merges.
7. **Trailing slash always** (`trailingSlash:'always'`, directory build): internal links, JSON-LD, and screenshot URLs all need the slash form.
8. **Strict CSP:** Pagefind/WASM needs `'wasm-unsafe-eval'`; new third-party endpoints need `_headers` updates; test search on deploy previews, not local preview.
9. **HubSpot-style enum/label traps don't apply here, but Excel-mangled IDs and quote-sensitive regex parsers do:** registry parsers must be quote-agnostic and CRLF-aware (recurring bug class).
10. **`/audit-seo` slash command** only loads when the session starts inside `theautomationsguide/`; output goes to `audits/`.

## Current strategic state (2026-07-17)

Publishing HOLD at 1/day; authority/CTR is the bottleneck, not supply. Queue was data-triaged S68 (2026-07-15) to **14 Queued / 18 Suggested / 126 Skipped** — re-fill from Suggested, don't bulk-promote; migration guides are the only reliable page-1 format, "alternatives" is the worst. Mesh + schema + freshness shipped (PR #180); engine slug feed live (S63); anti-slop NO_ANCHOR fence + --audit-queue shipped (PR #202). Watch: title/CTR read due ~2026-07-30; GSC index re-check ~2026-07-27 (140/145 indexed at the 7/13 audit). See [TODO.md](TODO.md).
