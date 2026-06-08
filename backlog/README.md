# Topic Backlog Builder

A standalone "topic engine" that surfaces the highest-leverage NET-NEW topics from
the tools we already know about, ranks them, and guarantees they do not cannibalize
anything already published or staged. It feeds the same Content Calendar the publishing
engine reads, but never publishes anything itself.

## Phase 1 (this folder) — known-universe ranking, local output only

`build-backlog.mjs`:

1. Loads the universe: `src/data/tools.ts` (29 tools with `/tools/<slug>` LPs) + the
   "Full backlog" section of `AFFILIATE_PIPELINE.md` (~75 more, by category, with
   first-mover stars). ~104 tools total.
2. Loads the dedup corpus: every published `src/content/blog/*.mdx` (title + tags
   resolved to a tool set) + the staged `CONTENT_CALENDAR.md` rows.
3. ONE Claude call proposes N ranked net-new topics, told what is already covered.
4. A DETERMINISTIC dedup guard (one shared `norm()` helper) hard-drops exact keyword/
   title/tool-set collisions and within-batch dupes, and flags partial overlaps. The
   LLM is not trusted to dedup.
5. Sanitizes (no em/en dashes) + sorts by priority, then writes the batch.

Run from the project root (so dotenv finds `./.env` with `ANTHROPIC_API_KEY`):

```
node backlog/build-backlog.mjs               # 25 topics (default)
node backlog/build-backlog.mjs --count=40
node backlog/build-backlog.mjs --model=claude-opus-4-8
```

Outputs (regenerate any time; safe to delete or gitignore):
- `backlog-batch.md`  — human-readable ranked table to eyeball
- `backlog-batch.json` — same data + the dropped list, for the Phase 2 stager

Nothing here writes to Notion. Review `backlog-batch.md`, delete rows you do not want,
then the Phase 2 stager pushes the survivors to Notion as `Suggested` (never `Queued`).

## Phase 2 (BUILT) — scheduled on GitHub Actions

`.github/workflows/topic-backlog.yml` runs the same script weekly (Sunday 06:00 UTC)
and stages the survivors. We host on GitHub Actions, not n8n, because the universe and
dedup corpus are all repo files the script already parses, so CI keeps the script as the
single source of truth (no logic duplicated into n8n Code nodes). The publishing engine
stays in n8n; only topic discovery lives here.

Two differences from a plain local run, both via the `--stage` flag:
- The dedup corpus becomes a LIVE Notion query of ALL Content Calendar rows (any status:
  published, queued, generating, in-review, staged), superseding the local
  `CONTENT_CALENDAR.md` snapshot. With no `NOTION_TOKEN` it falls back to the snapshot.
- It creates each surviving topic in the Content Calendar DB at `Status: Suggested`. It
  NEVER sets `Queued` - flipping to `Queued` (what the publishing engine fires on) stays a
  human decision. The DB id defaults to the engine's `topicsDatabaseId`
  (`62f34586-4f78-4b83-b2ac-105f500d059e`); override with the `NOTION_DATABASE_ID` repo
  variable.

### To turn it on (one-time)
1. Add a repo secret **`NOTION_TOKEN`** = the Notion internal integration token the engine
   uses (get it from https://www.notion.so/profile/integrations - open the integration
   that already has the Content Calendar shared with it, copy its Internal Integration
   Secret). It must have access to the Content Calendar DB - it does, since the engine
   reads/writes it. The n8n credential can't be read back via API, so this value has to
   come from the Notion integrations page (or be re-copied there).
2. `ANTHROPIC_API_KEY` is already a repo secret. `SLACK_WEBHOOK_URL` is NOT a repo secret
   (the n8n engine has its webhook hardcoded) - add it only if you want the "N staged"
   ping; the workflow runs fine without it.
3. Test without writing: Actions tab -> "Topic backlog builder" -> Run workflow ->
   `dry_run: true`. Inspect the run summary + the `backlog-batch` artifact.
4. When happy, let the weekly schedule run, or Run workflow with `dry_run: false` to stage
   immediately.

### To pause it
Disable the workflow in the Actions tab, or comment out the `schedule:` block. Manual
`workflow_dispatch` still works while paused.

## Phase 2.5 (idea, not built) — auto-refill cap
A tiny companion job could promote the top-N `Suggested` rows to `Queued` to hold a fixed
buffer and make cadence hands-off. Deliberately NOT built: it removes the per-topic human
veto, which we want to keep while the domain is young.

## Phase 3 (later) — web discovery

Add a discovery pass that surfaces brand-new tools/categories (launch feeds, rising
keywords) into the universe before they exist in `AFFILIATE_PIPELINE.md`, so the backlog
stays ahead of the market, not just ahead of our own coverage.
