# Deployment & Rollback Guide

The "I don't know what I'm doing, what do I press?" doc. Bookmark this.

## Mental model — 30 second version

- **One change = one Pull Request (PR) = one merge commit on `master`.**
- **Every merge to `master` auto-deploys to production via Netlify** (~90 seconds).
- **Every merge can be reverted with one command** (`git revert <merge-sha>`) which creates a NEW commit that undoes the change. Netlify auto-deploys that revert, so production rolls back without any UI clicks.
- **n8n workflows are NOT auto-deployed** — they live in n8n Cloud and only change when you manually re-import a workflow JSON. To roll back an n8n change, find the previous version of the JSON in git history, copy it, paste into n8n.

## Rule of thumb when you're nervous

> If the live site looks broken or wrong after a deploy, **revert the most recent merge** first. Diagnose later. Production stays clean. Reverts are cheap.

---

## Part 1: Find out what was deployed when

### "What's the most recent thing that hit production?"

```bash
git fetch origin master
git log origin/master --oneline -10
```

Output looks like:

```
0ac804b Merge pull request #17 from homegrowngrowthco/fix/qa-workflow-grep-count
8733108 Merge pull request #13 from homegrowngrowthco/feat/right-size-models
c2c2b18 Merge pull request #12 from homegrowngrowthco/feat/qa-into-engine-autofix
...
```

Each `Merge pull request #N` line is one deployment. The short hash on the left (`0ac804b`) is the **merge SHA** — what you'll use to revert.

### "What changed in PR #N?"

```bash
gh pr view 17
gh pr diff 17       # full diff
```

Or in browser: `https://github.com/homegrowngrowthco/theautomationsguide/pull/17`.

---

## Part 2: Roll back a deployment (the safe pattern)

**The pattern**: create a new commit that undoes the change. This preserves history (you can always see what happened) and Netlify deploys the revert just like any other commit.

### Easy mode — GitHub UI

1. Open the PR you want to roll back: `https://github.com/homegrowngrowthco/theautomationsguide/pull/<N>`
2. Scroll to the bottom of the conversation tab.
3. Click the **"Revert"** button next to the merge confirmation.
4. GitHub opens a NEW PR with the revert.
5. Merge that PR.
6. Netlify auto-deploys within ~90 seconds.

That's it. The original change stays in history; the revert PR cleanly undoes its effects.

### Power-user mode — command line

```bash
# Pull latest master
git checkout master
git pull origin master

# Create a revert branch (one merge SHA at a time)
git revert -m 1 <merge-sha-from-git-log>
# (the `-m 1` flag tells git: "for this merge commit, undo by reverting to its first parent — master before the merge")

# Push and open PR
git push origin master   # if you have direct push (we don't — use a PR)

# Better: revert on a branch + PR
git checkout -b revert/pr-<N>
git revert -m 1 <merge-sha-from-git-log>
git push -u origin revert/pr-<N>
gh pr create --title "Revert PR #<N>" --body "Reverts <merge-sha>. Reason: ..."
gh pr merge --merge
```

---

## Part 3: Emergency rollback — Netlify direct (no git involved)

If git feels scary or you need production reverted in the next 30 seconds:

1. Go to https://app.netlify.com/projects/theautomationsguide/deploys
2. You'll see a list of every deploy ever made. Each row has a timestamp + commit hash + a status.
3. Find the **last known-good deploy** (the one before the broken one).
4. Click the row → "**Publish deploy**" button.
5. That older deploy is now live on `theautomationsguide.com` within seconds.

**Caveat**: this only rolls back the *live site*. The git `master` branch still has the bad commit. So as a follow-up, also do a `git revert` (above) to bring git in sync, otherwise Netlify will re-publish the bad commit the next time anything else merges.

Think of Netlify "Publish deploy" as the **panic button** that buys you time to do the proper git revert.

---

## Part 4: Rolling back an n8n workflow change

n8n Cloud doesn't connect to git automatically. Workflow JSONs in this repo are the **source of truth** — n8n Cloud is the **deployed copy**. When you "deploy" an n8n change, you manually re-import the JSON. To roll back:

### Find the previous version of the workflow JSON

```bash
# See history of one workflow file
git log --oneline n8n/blog-post-engine.json

# Output:
#   bfa25dd Right-size models — collapse social outputs
#   c23036c fix(engine): use JSX comments
#   83d80c6 fix(engine): use JSX comments (original)
#   ...

# Get the file as it existed at a previous commit
git show <commit-sha>:n8n/blog-post-engine.json > /tmp/blog-post-engine-rollback.json
```

### Re-import the older version

n8n Cloud → Workflows → open the workflow → **⋯ menu → Import from File** → paste the contents of `/tmp/blog-post-engine-rollback.json`.

That's the rollback. Same file, older version. Activate.

**Tip:** always note in your CLAUDE.md `Session Log` when you re-import an n8n workflow — that way the audit trail of "which version is live in n8n Cloud right now" is documented somewhere outside n8n.

---

## Part 5: Recent deployments reference

For this project, here are the most consequential merges to date (newest first). Update this section as new significant PRs land.

| Date | PR | Merge SHA | What | Revert command |
|---|---|---|---|---|
| 2026-06-04 | PR #54 (+ live n8n API) | `b558960` | **Editorial polish round.** Layout-level (uplifts all existing posts): visible **FAQ** section from frontmatter faqs (`PostFaqs`); **enriched BlogPosting JSON-LD** (image, mainEntityOfPage, keywords, about/mentions of compared tools, author sameAs, publisher.logo); top collapsible **TableOfContents**; tag-scored **RelatedPosts**; inline affiliate-disclosure microcopy; per-post **OG images** (astro-og-canvas, build-time → og:image/twitter:image/JSON-LD image; `/og/` excluded from sitemap). New body components for new posts: **KeyTakeaways / Sources / BottomLine** wired into the engine (`update-engine-editorial.mjs`, imports 12→15, Humanize parity, single-brace, 1/1). `/disclosure` refreshed (live programs + How-we-test). RSS left as-is. Engine redeployed + verified live. | `git revert -m 1 b558960`; engine: re-run `deploy-engine.mjs --apply` against a prior JSON |
| 2026-06-04 | PR #53 (+ live n8n API) | `0204c74` | **Decision-aid formats** (Ian proposal): new `<ChooseIf>` ("Choose X if" self-select cards, the new default for "which is for me"), `<IntentTable>` (job-to-be-done intent x tool matrix), `<SpectrumBar>` (static 2-tool philosophy spectrum). Engine COMPARISON FORMAT rotation expanded 3 -> 6 options + **DecisionTree demoted to sequential-only**; Humanize 9 -> 12 imports. Re-deployed live + verified (ChooseIf import, 6-option fmt, tree demoted, 1/1 braces, active). | `git revert -m 1 <sha>`; engine: re-run `deploy-engine.mjs --apply` against a prior JSON |
| 2026-06-04 | PR #52 (+ live n8n API) | `fbb2d97` | Post formatting polish + brand (Ian review): **ToolBreakdown** 2-col (narrative left / bullets right) + auto-resolved brand logo top-right + prominent pricing; **DecisionTree** nested sub-decisions now a clean labeled vertical list (fixes the Yes->leaf->No misread); **newsletter** copy-beside-form 2-col (~half height) + em-dash fix; **last name removed site-wide** (now "Ian") in JSON-LD/About/privacy/author card/engine prompts; header **LinkedIn -> TAG company page** + new **X icon** (x.com/the_automations); personal LinkedIn kept only on About. Engine prompt (name + pricing-tier hint) re-deployed live + verified (no last name, 1/1 braces, active). | `git revert -m 1 fbb2d97`; engine: re-run `deploy-engine.mjs --apply` against a prior JSON |
| 2026-06-04 | direct + live n8n API | `86ce22c` | **Engine hotfix** — the 2026-06-04 08:00 run died at Generate Draft with "invalid syntax": the DecisionTree schema I added used literal `tree={{ … }}`, and n8n treats `{{`/`}}` as expression delimiters so the inner `}}` closed the `={{ … }}` body early. `fix-engine-double-braces.mjs` spaces every inner `{{`→`{ {` / `}}`→`} }` (valid JSX), deployed live + verified (1/1 braces, active); stuck topic "Kit vs Beehiiv" reset Generating→Queued. (`new Function` compile-test does NOT catch this — n8n's tokenizer does.) | `git revert 86ce22c` then re-run `deploy-engine.mjs --apply` |
| 2026-06-04 | PR #50 | `eb6aa5a` | Session 19 follow-up: product visuals for the **last 4** comparison posts (Smartlead waterfall-verification + lead view, Gong AI Composer, Salesforce Flow Builder), sourced from each tool's own product page / official docs by rendering the page + capturing the real visual. Closes screenshot coverage on all 11 comparison posts. | `git revert -m 1 eb6aa5a` |
| 2026-06-03 | direct (live n8n API) | n/a (JSON in PR #49 + PR #48) | Session 19 follow-up: re-deployed the engine LIVE after the component PRs merged, so it now emits `<DecisionTree>` AND rotates the comparison format (full / compact `<ComparisonTable>` / `<ToolBreakdown>`). Verified live: ToolBreakdown import + COMPARISON FORMAT section present, node count 24, active. **No re-import.** | re-run `deploy-engine.mjs --apply` against a prior `blog-post-engine.json` (e.g. `git show 9aa651a~1:n8n/blog-post-engine.json`) |
| 2026-06-03 | PR #49 | `8075dc4` | Session 19 follow-up: comparison **format variety** — new `<ToolBreakdown>` (section-per-product) component + `compact` mode on `<ComparisonTable>`; retrofit make-vs-zapier-vs-n8n + gong → ToolBreakdown, apollo-vs-clay-vs-linkedin + lemlist-vs-smartlead-vs-instantly → compact; engine updater `update-engine-comparison-formats.mjs` makes new posts rotate format. | `git revert -m 1 8075dc4` |
| 2026-06-03 | PR #48 | `0dbc6c7` | Session 19 follow-up: validated product screenshots on 7 comparison posts (sourced from each tool's official help/docs/CDN, linked to `/go/<slug>`, capped 600px + spaced from the DecisionTree); `Figure` gains a `class` prop. Also converted pipedrive-vs-apollo's card table to `<ToolBreakdown>`. | `git revert -m 1 0dbc6c7` |
| 2026-06-03 | PR #47 | `09292ff` | Session 19: roll `<DecisionTree>` across all 11 remaining comparison posts (replaces hand-drawn SVG decision trees, drops stale indigo in pipedrive-vs-apollo); new idempotent `n8n/update-engine-decision-tree.mjs` makes the engine emit `<DecisionTree>` + 2-3 visuals on new posts; `CONTENT_CALENDAR.md` + 16 Notion topics staged at `Status: Suggested`. Content/docs + engine JSON. | `git revert -m 1 <merge-sha>` |
| 2026-06-03 | direct (live n8n API) | n/a (JSON committed in PR #47) | Session 19: deployed the DecisionTree prompt changes LIVE to "Blog Post Engine, TAG (v3)" via `deploy-engine.mjs --apply` (node count 24 unchanged, activation untouched, verified via API GET). **No manual re-import.** | re-run `deploy-engine.mjs --apply` against a prior `blog-post-engine.json` (e.g. `git show 4176908~1:n8n/blog-post-engine.json`) |
| 2026-06-01 | direct | `2a24420` | Affiliate pipeline: 20 unlisted `/tools/<slug>` landing pages (data + content + FAQ schema) + `listed` flag so they stay off homepage/grid; new `AFFILIATE_PIPELINE.md` tracker. Additive only. | `git revert 2a24420` |
| 2026-06-01 | direct | `ce9ac76` | Engine: update `n8n/blog-post-engine.json` for the new light format (DIAGRAM COLORS rule in Generate Draft + Humanize prompts, deterministic `colorFixes` remap in `sanitizeMdx()`) **+ requires n8n re-import**; regenerate `apple-touch-icon.png` (180x180 from brand mark); fill design-refresh merge SHA. | `git revert ce9ac76` (then re-import prior `blog-post-engine.json` from `git show ce9ac76~1:n8n/blog-post-engine.json` into n8n Cloud) |
| 2026-06-01 | PR #41 (branch `design-refresh-brand-kit-v2`) | `7d03d0d` | Design (Session 14 + 15, merged together): apply Brand Kit v2.2 — **light mode (warm cream #fdfcf8)**, teal `#14a890`, web fonts (Inter / Source Serif 4 / JetBrains Mono / Outfit), serif headlines, exact-match wordmark, favicon recolor, `public/brand/` + `brand-kit/` assets, **rich `/tools/<tool>` hub pages**, mobile polish, homepage rebuild, tool logos, working blog tag filter + search, **GA4 `G-RKWHJ95P3H`**, in-post SVG diagram recolor to teal/ink. CSS/asset/page/content + one analytics component. | `git revert -m 1 7d03d0d` (Session-15 commit `11d6cf7`; outreach-post recolor `f51dc09` is a separate revert) |
| 2026-05-22 | direct | `805cb28` | SEO: add IndexNow + Google Indexing API submit to PR-merge n8n workflow (key file `dde35cca97309131104c0505957f0948.txt` + 5 new workflow nodes) | `git revert 805cb28` (also: re-import the old workflow JSON from `git show 2a84738:n8n/notion-publish-status.json` into n8n Cloud) |
| 2026-05-22 | direct | `e09acdc` | SEO: filter noindex URLs out of sitemap + single robots meta in BaseLayout | `git revert e09acdc` |
| 2026-05-20 | direct | `88033dc` | Add Kit MCP section to Kit + n8n post (Kit partner promo) | `git revert 88033dc` |
| 2026-05-12 | #17 | `0ac804b` | Fix grep -c bug in QA workflow | `git revert -m 1 0ac804b` |
| 2026-05-11 | #13 | `8733108` | Right-size Anthropic models (social outputs → Haiku) | `git revert -m 1 8733108` |
| 2026-05-11 | #12 | `c2c2b18` | QA-into-engine auto-fix pipeline | `git revert -m 1 c2c2b18` |
| 2026-05-11 | #11 | `52e6807` | Backfill 8 existing posts to MDX | `git revert -m 1 52e6807` |
| 2026-05-11 | #10 | `b9f4932` | Automation improvements (Node 22, monitors, auto-merge GHA) | `git revert -m 1 b9f4932` |
| 2026-05-11 | #9 | `d1f4c3c` | Session 7 docs log | `git revert -m 1 d1f4c3c` |
| 2026-05-11 | #8 | `c23036c` | Engine SVG comment fix | `git revert -m 1 c23036c` |
| 2026-05-11 | #7 | `a83b5cd` | Visual post format redesign + MDX engine upgrade | `git revert -m 1 a83b5cd` |
| 2026-05-11 | #6 | `abb50d3` | First MDX-format post (Apollo Alternatives) | `git revert -m 1 abb50d3` |

(Refresh with `git log origin/master --oneline --merges -15`.)

---

## Part 6: Pre-deploy checklist (when you're about to merge a PR)

Before clicking **Merge**, eyeball:

- [ ] **All checks green?** GitHub shows a checkmark next to the PR (Netlify deploy preview ✓, redirect rules ✓, etc.) Specifically: `netlify/theautomationsguide/deploy-preview` must be `SUCCESS` — that means the new code actually built.
- [ ] **Deploy preview looks right?** Click the Netlify deploy preview link in the PR comments. Check that the change does what you expect. For content PRs, click around the post URL on the preview.
- [ ] **Conflicts?** If GitHub shows "This branch has conflicts that must be resolved," don't merge. Either resolve in the GitHub UI (small conflicts) or ask Claude to rebase the branch.
- [ ] **What does it touch?** `gh pr view <N> --json files --jq '.files[].path'` shows the file list. If a PR claims to "fix a typo" but touches 30 files, slow down.

If all four pass → merge with confidence. If anything fails → don't merge.

---

## Part 7: When something feels weird, ask Claude

Common questions you can paste in:

- *"What did PR #N change? Walk me through the diff."*
- *"Revert PR #N for me."*
- *"The live site looks broken. What's the most recent thing that deployed?"*
- *"The QA action is failing on PR #M, what's wrong?"*
- *"Roll back the n8n blog engine to the version before today's right-size-models change."*

Claude has access to git history, the GitHub API, and Netlify deploy URLs. You don't need to know commands — just describe the problem and Claude executes the safe pattern.

---

## TL;DR cheat sheet

| What I want | What to do |
|---|---|
| "What's live right now?" | `git log origin/master --oneline -5` |
| "Undo the last thing I shipped" | Open the merge commit's PR in GitHub → click **Revert** → merge the revert PR |
| "Production is on fire — get the site back to yesterday" | Netlify dashboard → Deploys tab → pick yesterday's deploy → **Publish deploy** |
| "I want to undo a specific PR from a week ago" | Same as the first row — open that PR → Revert button |
| "I changed an n8n workflow and now it's broken" | `git log --oneline n8n/<workflow>.json` → `git show <prev-sha>:n8n/<workflow>.json` → re-import in n8n Cloud |
| "I have no idea what I'm doing" | Ask Claude — describe the symptom, not the command |
