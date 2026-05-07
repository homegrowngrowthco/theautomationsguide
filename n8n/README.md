# Content Engine Setup

End-to-end pipeline: Notion topic queue → Claude generates + humanizes a blog post → opens a PR on GitHub → Netlify auto-builds a deploy preview → you review on the preview URL → merge to publish.

Twitter threads and video scripts are generated in parallel and saved to a Notion drafts DB for review.

The full system is three workflows that compose:

```
                         Topic Suggestor (Mon + Thu 7:30am)
                                    │
                                    ▼
                         Notion: topics with Status = Suggested
                                    │
                          Ian flips good ones → Queued
                                    │
                                    ▼
                         Blog Post Engine (Weekday 8am)
                                    │
                                    ▼
                         GitHub PR + Netlify preview + social drafts
                                    │
                                    ▼
                         Daily Briefing (7:30am every day)
                                    │
                                    ▼
                         Single Slack ping: what needs you today
```

## What's in this folder

| File | Purpose |
|---|---|
| `blog-post-engine.json` | The main workflow — generates a post, opens a PR, queues social drafts. **v4 (2026-05-07)**: outputs MDX with components, per-post-type templates, dual `.md`/`.mdx` idempotency. |
| `topic-suggestor.json` | Runs Mon/Thu — Claude suggests 5 new topics based on coverage gaps, writes them as `Suggested` for batch approval |
| `daily-briefing.json` | Runs daily 7:30am — single Slack message summarizing what needs your attention (open PRs, topics to approve, drafts to post) |
| `create-content-databases.js` | One-off script that creates the two Notion DBs and seeds 3 sample topics |
| `update-engine-for-mdx.mjs` | One-shot Node script (record only) that converted v3 → v4. Source of truth for how the v4 prompts were constructed. Don't re-run on post-update JSON — it errors on missing original node names. |
| `blog-post-engine-v2-archive.json` | Archived v2 of the engine for reference |
| `README.md` | This file |

**v4 changes (2026-05-07).** Engine now produces `.mdx` instead of `.md`. Generate Draft prompt picks one of four post-type skeletons (`comparison` / `tutorial` / `framework` / `opinion`) based on the Notion `Tag` field, and uses the Astro MDX component library at [src/components/post/](../src/components/post/). Idempotency check now GETs both `.md` and `.mdx` paths to protect legacy slugs from collision. Humanize verifies that the import block, `/go/<slug>` affiliate links on first mention, and the `<MyTake>` block (zero or one allowed) are intact. **After editing this JSON, re-import into n8n Cloud — the live engine doesn't auto-pull from this file.**

## One-time setup (~15 min)

### 1. Create the Notion databases

```powershell
# In a new terminal at C:\Users\Ian\OneDrive\Documents\claude_projects\
$env:NOTION_TOKEN = "ntn_your_integration_token"
$env:NOTION_PARENT_PAGE_ID = "page_id_where_dbs_should_live"
node theautomationsguide/n8n/create-content-databases.js
```

The script:
- Creates **Content Calendar** (where you queue topics)
- Creates **Content Drafts (Social)** (where Twitter threads + scripts land for review)
- Seeds 3 starter topics
- Prints both database IDs to paste into the n8n workflow

You need `@notionhq/client` installed globally or in the parent dir:
```bash
npm install @notionhq/client
```

Make sure the Notion integration is shared with the parent page (Share → Connect to integration → pick your integration).

### 2. Import the workflow into n8n Cloud

1. n8n Cloud → Workflows → **Import from File** → pick `blog-post-engine.json`
2. The workflow imports inactive — leave it inactive until step 5

### 3. Configure credentials in n8n

The workflow uses 3 Header Auth credentials. Create them under Credentials → New:

| Name (must match exactly) | Type | Header name | Header value |
|---|---|---|---|
| `Anthropic API Key` | Header Auth | `x-api-key` | `sk-ant-...` |
| `GitHub PAT` | Header Auth | `Authorization` | `token ghp_...` (PAT needs `repo` scope) |
| `Notion Integration Token` | Header Auth | `Authorization` | `Bearer ntn_...` |

After creating each, open the corresponding HTTP Request node in the workflow and select the credential — n8n will auto-fix the `REPLACE_WITH_*_CREDENTIAL_ID` placeholder.

### 4. Fill in the Config node

Open the **Config** node and replace these values:

| Field | What to put |
|---|---|
| `topicsDatabaseId` | The Content Calendar DB ID printed by the script |
| `draftsDatabaseId` | The Content Drafts DB ID printed by the script |
| `slackWebhookUrl` | Incoming Webhook URL from your Slack app (or remove the Slack node if not using Slack) |
| `githubOwner`, `githubRepo`, `githubBaseBranch`, `siteBaseUrl` | Already filled, change if you fork |

### 5. Test once with the manual trigger

1. Make sure at least one topic in Content Calendar has Status = `Queued`
2. Click **Execute Workflow** at the bottom of the n8n canvas
3. Wait ~30 sec — you should see:
   - Topic status flip to `Generating` then `In Review` in Notion
   - A new PR open in GitHub at `homegrowngrowthco/theautomationsguide`
   - Netlify comment on the PR with the deploy preview URL within ~2 min
   - Slack ping
   - Twitter thread + video script saved to Content Drafts DB

If everything looks right, set the workflow to **Active**. The Weekday 8am trigger will run it every weekday morning.

## How to add a topic

Just add a row to the Content Calendar DB:

| Field | Required | Notes |
|---|---|---|
| Topic | yes | The post idea — be specific |
| Status | yes | Set to `Queued` |
| Priority | recommended | Engine picks highest priority first, ties broken by created date |
| Tag | recommended | Used as the first frontmatter tag |
| Target Keyword | optional | Hint to the LLM for SEO focus |
| Notes | optional | Angle, must-include points, contrarian takes to push |

The engine takes one queued topic per run (configurable — change `page_size: 1` in the **Get Next Topic** node).

## How review works

1. Engine opens a PR titled `content: [post title]`
2. Netlify auto-builds the preview within ~2 min and comments the URL on the PR (e.g., `deploy-preview-7--theautomationsguide.netlify.app`)
3. You get a Slack ping with the PR link
4. Open the preview URL on phone or desktop, read the post like a visitor would
5. To edit: edit the file directly on GitHub (pencil icon) → commit to the same branch → preview rebuilds in ~2 min
6. To publish: click Merge on the PR → master deploys → live within ~2 min
7. To kill: close the PR + delete the branch + flip Notion status to `Skipped`

## Failure modes & gotchas

- **Notion DB schema must match exactly** — the property names `Topic`, `Status`, `Priority`, `Tag`, `Notes`, `Target Keyword`, `PR URL`, `Pub Date` are case-sensitive
- **No queued topics** → workflow stops cleanly, no PR opened. Add topics and it'll pick up next run
- **Topic produces same slug as an existing post** → idempotency check throws an error. Either change the topic wording or delete the existing post first
- **GitHub PAT scope** → needs `repo` (not `public_repo` — branch creation needs full repo access on private repos; for public repos `public_repo` is enough)
- **Notion 2000-char limit on rich_text** → Twitter thread + video script are truncated to 1999 chars in Notion. The full text isn't stored anywhere else — if you need the long version, regenerate from the post

## Adjusting the engine

| Want to | Change |
|---|---|
| Change schedule | Edit cron in **Weekday 8am** node (default `0 8 * * 1-5` = 8am Mon-Fri) |
| Run multiple posts per day | Change `page_size` in **Get Next Topic** to N, then split-out (n8n Loop) |
| Switch model | Edit `model: 'claude-sonnet-4-6'` across the 4 Anthropic nodes |
| Add LinkedIn post | Duplicate the Twitter Thread branch, change prompt, add a Type option to Drafts DB |
| Skip humanize step | Delete **Humanize** node and reconnect **Generate Draft** → **Parse Draft** |
| Change writer voice | Edit the system prompt in **Generate Draft** + **Humanize** nodes |

## Cost (rough)

Per post: ~$0.05-0.10 in Anthropic API calls (4 LLM calls — generate, humanize, twitter, video). Notion + GitHub APIs are free under their normal usage tiers.

At 5 posts/week: ~$2/month in API costs. n8n Cloud is the bigger fixed cost.

---

## Topic Suggestor setup

Same Anthropic / GitHub / Notion credentials as the blog engine — no new credentials needed.

### One-time

1. **Add `Suggested` status to Content Calendar in Notion** (the script that originally created the DB has been updated, but your DB already exists — add the option manually):
   - Open Content Calendar in Notion → click the `Status` column header → `Edit property`
   - Add option: name `Suggested`, color pink
   - Save

2. **Import `topic-suggestor.json`** into n8n
3. Open the `Config` node, paste your Slack webhook URL into `slackWebhookUrl`. Other fields (DB IDs, repo, etc) are pre-filled with your real values.
4. Activate. Runs Mon + Thu at 7:30am.

### How review works

After it runs, you'll get a Slack ping listing the 5 suggestions. In Notion, filter Content Calendar by `Status = Suggested`. For each row:
- **Like it →** change Status to `Queued`. The Blog Post Engine picks it up next run, ordered by Priority.
- **Don't like it →** change Status to `Skipped`. It stays in the DB so the suggestor doesn't re-suggest it next time.
- **Want to tweak →** edit the Topic / Notes / Target Keyword fields, then flip to `Queued`.

Cost: ~$0.02 per run. Twice a week → negligible.

---

## Daily Briefing setup

Same credentials as above. No new credentials needed.

### One-time

1. **Import `daily-briefing.json`** into n8n
2. Open the `Config` node, paste your Slack webhook URL into `slackWebhookUrl`. Other fields are pre-filled.
3. Activate. Runs daily at 7:30am.

### What it sends

Single Slack message every morning summarizing:
- 📰 Content PRs awaiting review (with deep links to each)
- 💡 Topics waiting for your approval (Suggested status)
- ✏️ Twitter threads / video scripts pending in the Drafts DB
- ⏳ Topics queued and ready for the engine
- 🔧 Any non-content PRs open

If nothing is pending, it skips the post entirely so you don't get trained to ignore the channel.

### Adjusting

| Want to | Change |
|---|---|
| Run at a different time | Cron in `Daily 7:30am` node — default `30 7 * * *` (7:30am every day) |
| Send to a different channel | Use a different Slack webhook URL |
| Always post even when nothing pending | In `Build Briefing` node, change the `if (totalPending === 0 && otherPRs.length === 0)` early return to `if (false)` |
| Add more buckets (Plausible numbers, affiliate clicks, etc) | Add HTTP Request nodes querying those services + extend the message in `Build Briefing` |
