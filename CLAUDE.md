# Session Log — last updated 2026-06-14

## Quick reference — recent additions (Session 32, 2026-06-14)

**Ian: identity/E-E-A-T + GEO + IA overhaul (About headshot + full name, answer-first byline/TL;DR on every post, audience nav, de-cluttered blog index). Site changes on branch `feat/eeat-geo-nav-overhaul` (PR open for Ian to review on the Netlify preview, not merged). Engine deployed LIVE.**

**1. Identity + "Ian Chamberland" everywhere.** [about.astro](src/pages/about.astro) hero is now two-column: headshot ([public/images/ian-headshot.jpg], copied from homegrown-growthco) + name + role + a prominent "Connect on LinkedIn" button at the top (mobile: photo stacks first via `order:-1`). Surname added to founder JSON-LD ([BaseLayout.astro](src/layouts/BaseLayout.astro)), the author card ([AuthorNote.astro](src/components/AuthorNote.astro)), [privacy.astro](src/pages/privacy.astro), and the about meta/intro/contact. Also stripped 8 pre-existing em-dashes from the About prose + 1 in the author bio (`feedback_no_em_dashes`).

**2. Global byline + TL;DR (existing + future).** [BlogPostLayout.astro](src/layouts/BlogPostLayout.astro): byline is now "By Ian Chamberland" linked to `/about/` with `rel="author"` (the `displayAuthor` fallback flip drives JSON-LD `author.name` too), one file, all posts. Added optional `tldr` (+ `audiences`) to the [content schema](src/content/config.ts); the layout renders a bolded `.post-tldr` answer box at the very top of each post. Backfilled all 36 posts via [backfill-tldr.mjs](backfill-tldr.mjs) (lifts each inline `quick-answer` div into `tldr:` frontmatter + removes the now-duplicate div; CRLF-aware + uses a function replacer so a `$` in pricing text stays literal, both bit me on the first run). Bottom "Bottom line" CTA kept at the end.

**3. Engine (future posts), DEPLOYED LIVE.** [n8n/update-engine-tldr.mjs](n8n/update-engine-tldr.mjs) (idempotent, token-self-check, no new `{{`/backtick/`${` tokens) edits [blog-post-engine.json](n8n/blog-post-engine.json): frontmatter emits `tldr:`, the 3 inline quick-answer skeleton bullets + QUICK ANSWER RULES become TL;DR-frontmatter rules, author voice = "Ian Chamberland"; Humanize preserve-list keeps tldr, drops the quick-answer bullet. Deployed via `deploy-engine.mjs --apply` (28 nodes, active unchanged, GET-verified, 0 quick-answer refs). **Timing note:** engine is now AHEAD of the live site, so merge the site PR before the next 8am cron post or one new post briefly renders without a visible answer block on the old layout.

**4. Nav overhaul + audience hubs.** [BaseLayout.astro](src/layouts/BaseLayout.astro) nav is now **Teams (dropdown) | Playbooks | Tool Reviews | Latest** (green Newsletter CTA + search + social icons untouched). Teams dropdown = new accessible vanilla-JS toggle + hover/focus CSS, renders inline in the mobile drawer; items For Sales/RevOps/Marketing/Founders + About. New [audiences.ts](src/data/audiences.ts) maps each role to REAL topic tags (taxonomy is dominated by `automation` 27/36 + `comparison` 17, so those are excluded as audience signals; only `tech stack` is multi-word). [teams/[role].astro](src/pages/teams/[role].astro) + [teams/index.astro](src/pages/teams/index.astro) + [playbooks.astro](src/pages/playbooks.astro) reuse a new shared [PostCard.astro](src/components/PostCard.astro). Hub counts: Sales 17 / RevOps 12 / Marketing 7 / Founders 10 / Playbooks 7. Footer + breadcrumb labels aligned.

**5. Blog index ([blog/index.astro](src/pages/blog/index.astro)).** H1 to "The RevOps & GTM Automation Blog", keyword-rich subhead + meta. Tag farm (~35 buttons) replaced by **All + 5 pillar buttons** (Cold Email/CRM/Workflow Automation/Lead Enrichment/Newsletter, each OR-matching a tag group) **+ a "Filter by Topic" select** holding all tags. Filter JS generalized to group/single-tag matching with `?tag=` URL sync; the `data-tags` delimiter switched from space to `|` so the multi-word `tech stack` tag filters correctly (PostCard + the filter both updated).

**Verification:** `npm run build` clean (142 pages); qa:lint 0 hard / qa:render 0 hard / qa:overflow 0 / qa:logos clean; 0 em/en dashes in content; Playwright desktop+mobile confirmed About (2-col / stacked photo-first), post (TL;DR box + linked byline), Teams dropdown (desktop popover + mobile drawer), blog filters (Cold Email 15, tech stack 2, URL sync); rendered JSON-LD author + homepage founder = "Ian Chamberland".

**Revert:** site = close the PR (or `git revert -m 1 <merge-sha>` after merge). Engine = re-run `deploy-engine.mjs --apply` against the prior `blog-post-engine.json`, or `git revert` the JSON + redeploy.

**Open follow-ups:** (a) "Workflow Automation" pillar maps to platform tags only (~3 posts), NOT the `automation` catch-all (would be ~27), broaden if Ian prefers; (b) "Tool Reviews" points at the existing /tools hub (no separate articles-only /reviews page built).

---

## Quick reference — recent additions (Session 31, 2026-06-12)

**Ian: "the mobile homepage looks like trash, I thought we did QA?" Three visual defects that passed every gate green, fixed + a new deterministic guard for the class. PR #84 MERGED (`54b764e`).**

Root cause of the QA miss: every existing gate checks post **structure** (render-acceptance/linkedom) or **horizontal overflow** (mobile-overflow at 390px) — none check **visual balance** or **brand-image backgrounds**, and the Vision bot only runs on `content/` PRs, not homepage/component changes. So "all green" was true and meaningless here.

**1. "Tools we cover" logo strip ([global.css](src/styles/global.css)).** Logos were normalized on **height only** (`height:32px;width:auto`) in a `flex-wrap` row, so a wide wordmark (Cal.com) ballooned while a compact mark (KIT) stayed tiny and rows wrapped ragged (4/2/2/2, centered). Fixed to **equal-width cells capped on BOTH axes** (`flex:0 0 33.333%` mobile / `20%` desktop, img `max-height:28px;max-width:100%;object-fit:contain`) → consistent visual weight, centered trailing rows. Wordmark fallback also constrained (ellipsis) so it can't overflow its cell.

**2. beehiiv.png white box ([public/brand/tools/beehiiv.png](public/brand/tools/beehiiv.png)).** Shipped `hasAlpha:false`, pure-white background → sat in a white box on the cream page. Rebuilt as a transparent navy mark via per-pixel inverse-luminance alpha (sharp). (First attempt with a sharp `.linear` invert mask came out inverted — switched to explicit raw per-pixel: `alpha=255-luminance`, RGB forced to `#0a0a14`.)

**3. Hero flowchart on mobile ([global.css](src/styles/global.css)).** The `.hero-visual` had `order:-1` at `<=860px`, **forcing the decorative SVG node-diagram above the headline** when stacked (the "janky af, shouldn't be at the top" report). Removed the flip (copy leads everywhere) + **hide the diagram on phones `<=600px`** (it's `aria-hidden`, purely decorative, cramped at phone width); tablets 600-860px keep it below the copy. Desktop unchanged.

**4. New deterministic guard ([qa/lint-logos.mjs](qa/lint-logos.mjs)) — the class fix.** Samples each raster logo's 4 corners; **HARD-fails if all 4 are opaque** (a baked-in background rectangle — the beehiiv class) + WARNs on aspect-ratio outliers. `npm run qa:logos`; **`sharp` pinned as a devDep** (was transitive via astro-og-canvas) + lockfile updated; wired as a CI step right after `npm ci` in [qa-content-pr.yml](.github/workflows/qa-content-pr.yml) (cheap, no build needed). Tested both ways: passes the 8 current logos (0 hard), fails (exit 1) on the original opaque beehiiv.

**Verification:** local prod build clean (135 pages), 0px mobile overflow at 320/375/390, Playwright shots of the strip (3-col balanced grid, no white box) + hero (phone copy-only, tablet copy-then-flowchart) + desktop (5-col strip, side-by-side hero unchanged). NOT viewed on the Netlify preview — flagged to Ian. (Touches a workflow file → Ian merged #84 in the UI, `reference_gh_token_no_workflow_scope`.)

**Revert:** `git revert -m 1 54b764e` — all CSS/string/asset edits + one additive script.

### Session 31 follow-up (2026-06-12) — QA run investigation: auto-fixer fails the job on a correct decline

Ian asked me to investigate GHA **run 27414522866** (the daily engine's content PR #85, "Gong alternatives"). The `qa` job went red at **Apply Claude fix**, but the **content was clean** — the harness failed, not the post.

**Root cause:** the Vision bot returned `shouldFix:true` with 3 "major" component-internal issues (incl. a hallucinated "illegible flowchart" — on mobile the DecisionTree renders as the legible vertical labeled-list, no flowchart exists; plus the recurring ChooseIf/StatRow "over-padded/cramped" misreads from Sessions 21/24/29). The job branched to auto-fix; the fixer model **correctly declined** and returned a prose explanation instead of MDX; [qa/qa-pr-fix.mjs](qa/qa-pr-fix.mjs) hit its `!startsWith('---')` branch and did `process.exit(1)` → **failed the whole job** on a verdict it was right to decline. Verified the post locally (checked out the branch + built): 0px overflow at 375/768, DecisionTree = clean vertical list, ChooseIf stacks to single-column cards — all flags false positives.

**Actions:** (1) **merged PR #85** (`aaf0c3b`) — content was never the problem. (2) **PR #86 MERGED** (`fd5ac9c`, Ian merged in UI — workflow scope): **#1** [qa/qa-pr-fix.mjs](qa/qa-pr-fix.mjs) treats "no editable MDX returned" like the existing band-aid path (no write, `exit 0`, route to human) instead of `exit 1`; **#2** [qa-content-pr.yml](.github/workflows/qa-content-pr.yml) — the commit step emits `pushed=true/false`, "fix applied" is gated on `pushed==true`, and a new honest **"auto-fix declined → manual review"** comment fires on `pushed==false` (the old comment fired unconditionally on the fix branch, falsely promising a fix + a re-run; this also repairs the band-aid path's mislabel). Net: a component-internal/false-positive verdict ends **green with the post untouched + an accurate manual-review note**, not a red blocking job; real crashes still fail loudly via build/render-acceptance gates + `failure()` ping. Validated `node --check` + js-yaml parse (26 steps).

**Deferred to a separate session (#3, the deeper root cause):** harden the Vision-bot prompt ([qa/qa-pr-review.mjs](qa/qa-pr-review.mjs)) so it stops false-flagging the deliberately-stacked components (ChooseIf/StatRow/DecisionTree-vertical-list) as cramped/illegible — that's what marks fine posts `shouldFix:true` in the first place.

**Revert:** PR #86 `git revert -m 1 fd5ac9c` (both edits additive/behavioral).

### Session 31 follow-up #2 (2026-06-12) — DONE: #3 Vision-prompt hardening (PR #87 MERGED `acfc62f`)

Closed out the deferred #3. The prompt's own "recurring defects" bullets were *inviting* the false positives (the "SQUISHED / CRAMPED COMPONENTS" bullet named StatRow/ChooseIf/etc.; "AWKWARD DECISION TREES" invited flagging the legible vertical list). **Natural-language-only** edits — the verdict JSON schema + `severity`/`viewport` enums are byte-identical, so [qa-content-pr.yml](.github/workflows/qa-content-pr.yml) (`shouldFix` branch) and [qa-pr-fix.mjs](qa/qa-pr-fix.mjs) (`blocker|major` filter) parsing is untouched (this is why it's a plain `qa/` PR, no UI-merge needed).

**[qa/qa-pr-review.mjs](qa/qa-pr-review.mjs) (the auto-fix bot):** (1) re-scoped SQUISHED/CRAMPED to fire only on genuine *multi-column* collisions (a single-column stack is explicitly NOT cramped); (2) re-scoped AWKWARD DECISION TREES to exclude the vertical labeled-list; (3) two emphatic "correct by design" carve-outs (mobile single-column stacks for StatRow/ChooseIf/ComparisonTable/ToolBreakdown/IntentTable/SideBySide which only go multi-column at >=640px + the DecisionTree vertical list, connectors hidden <=560px by design), covering the tablet 2-4-across grid too, mirroring the proven content-width carve-out; (4) a **CRITICAL shouldFix rule** — shouldFix=true ONLY when a blocker/major exists; minor nitpicks never trigger a fix (this was the last residual: v1 of the edit downgraded everything major→minor but still set shouldFix:true, which still routes to the fix branch). **[qa/qa-claude-review.mjs](qa/qa-claude-review.mjs) (human report):** same carve-outs + dropped its "text too wide" bullet that contradicted the full-width design.

**Verified live, before/after on identical screenshots** of the 2026-06-12 Gong-alternatives post (the actual Session-31 false positive): OLD prompt = `shouldFix:true`, confidence **HIGH**, **4 major** issues (ChooseIf mobile+tablet, StatRow "cramped/run together", DecisionTree "connectors overlapping" — exactly the documented misreads). NEW prompt = `shouldFix:false`, high confidence, **0 issues**, stable across **3 consecutive runs**. (Did NOT separately test a true-positive case; the genuine-defect bullets are all retained + the deterministic gates — mobile-overflow@390, render-acceptance — backstop real structural breaks, and the change deliberately biases toward false-negatives on these component classes only.)

**Revert:** PR #87 `git revert -m 1 acfc62f` — pure prompt-string changes, no behavior/schema/dependency change.

---

## Quick reference — recent additions (Session 30, 2026-06-11)

**Closed out PR #74 (merged) + three follow-ups Ian raised: Wave-2 affiliate approvals, a ToolBreakdown restyle from his PR #74 feedback, and a QA screenshot-scope fix.** Three PRs: **#81 + #82 MERGED**, **#83 OPEN for Ian** (workflow scope).

**1. Affiliate Wave-2 approvals live (PR #81, merge `950059f`).** Lusha, Instantly, lemlist, Pabbly approved 2026-06-11 — all four were pre-staged (`status:'pending'`/`listed:false`), so this just dropped in real links + logos and surfaced them. [affiliate-links.ts](src/data/affiliate-links.ts): real `url` + `status:'live'` (lemlist `get.lemlist.com/dj5hqvgo1g1g`, instantly `refer.instantly.ai/rpo8nmijrywl`, lusha `partnerstack.lusha.com/fn90rbodn3k4-omvn4r`, **pabbly → Pabbly Connect (Recurring)** `payments.pabbly.com/api/affurl/...?target=9Z2AHyhSldo6KI1Fn`). [tools.ts](src/data/tools.ts): `listed:true` on all four + logos for instantly/pabbly/lusha (lemlist already had one) + **added `'Cold Email & Deliverability'` and `'Lead Data & Enrichment'` to `toolCategories`** (instantly/lusha categories weren't registered → would've rendered hubs but stayed off the `/tools` grid, the Session-24 trap). Logos → [public/brand/tools/](public/brand/tools/): `instantly.webp` (partnerfleet PNG, `sharp.trim` 300×67), `pabbly.svg` + `lusha.svg` (vendor wordmarks). **Pabbly handling (Ian chose):** Pabbly issues a separate affiliate link per product; `/go/pabbly` points at **Pabbly Connect** (the automation product our content compares) — the other 15 per-product links are parked in [AFFILIATE_PIPELINE.md](AFFILIATE_PIPELINE.md) for product-specific posts. (Note: the two Lusha links Ian sent were byte-identical.) Verified: build clean, all four `/go` redirects resolve to the real URLs in `dist`, all four on the homepage strip + correct `/tools` category, `/go` excluded from sitemap, lint 0-hard.

**2. ToolBreakdown restyle (PR #82, merge `6b22a2e`).** From Ian's PR #74 feedback on the HubSpot block: pricing wasted a vertical line under the sub-headline, and the body prose vs the highlight bullets read as different font sizes with no visual split. [ToolBreakdown.astro](src/components/post/ToolBreakdown.astro) (component-only, no post/engine change — `tagline`/`pricing`/`body`/`highlights` field names unchanged, so it uplifts every existing ToolBreakdown post): (a) **pricing now shares the tagline's row** — tagline grows and pushes the price to the right edge of the text column, `flex-wrap` drops a long price to its own right-aligned line; pricing `1.05rem`→`0.95rem`. (b) **body bumped to explicit `0.95rem`** to match the bullets (was inheriting ~1rem next to 0.9rem). (c) **highlights moved into a tinted rounded `var(--bg-secondary)` panel** with a small uppercase "Highlights" eyebrow, so bullets read as a distinct block from prose (esp. stacked on mobile). Verified: build clean, mobile-overflow gate passes, Playwright desktop 1280 + mobile 390 shots of the HubSpot + Pipedrive-vs-Apollo blocks (inline right-aligned pricing, equal body/bullet size, tinted panel, no clipping).

**3. QA screenshot scope fix (PR #83, merge `c1e517a`; Ian merged in the UI, workflow scope).** Ian flagged the QA bot grabbing **171 screenshots across all ~35 posts** on a one-post PR. Root cause: [qa-content-pr.yml](.github/workflows/qa-content-pr.yml) already computes the changed post's `slug` (used by the Vision review + render-acceptance + mobile-overflow gates) but the "Capture screenshots" step ran [qa-screenshots.mjs](qa/qa-screenshots.mjs) **with no args**, so it globbed every post. Fix: added an optional `--slug` to the script (captures only `/blog/<slug>` → the `blog_<slug>` dir the Vision bot reads; argless = unchanged full-site sweep for local dev) + the workflow passes `--slug "${{ steps.slug.outputs.slug }}"`. Drops a one-post PR to **~4 screenshots** (~96% fewer Vision images), no coverage loss (render-acceptance + mobile-overflow already check structure on every build). Ian chose **per-PR scoping only**, no biweekly sitewide sweep. Verified locally: scoped run wrote exactly the one post's 4 viewports. **Touches a workflow file → Ian merges #83 in the UI** (`reference_gh_token_no_workflow_scope`).

**Note:** the QA workflow only triggers on `content/` branches, so PRs #81/#82/#83 (`affiliate/`,`style/`,`ci/`) merge clean without running it.

**Revert:** PR #81 `git revert -m 1 950059f`; PR #82 `git revert -m 1 6b22a2e`; PR #83 `git revert -m 1 c1e517a`. All additive/behavior-preserving.

---

## Quick reference — recent additions (Session 29, 2026-06-11)

**Two net-new builds Ian asked for after the project moved into monitor-and-grow mode: PostHog dashboards (read the analytics that have been collecting for weeks) + real Anthropic token-usage/cost logging on the engine.** Branch `feat/posthog-dashboards-and-cost-logging`.

**1. PostHog dashboards ([analytics/posthog-setup.mjs](analytics/posthog-setup.mjs), NEW `analytics/` dir).** Idempotent, two-phase (DRY RUN default / `--apply`) setup script mirroring the `backlog/`+`n8n/` convention (`.mjs` + `dotenv`, bare `fetch` -> `{ok,status,json}`, fail-fast env guards). Creates the 4 ANALYTICS.md dashboards as **6 insights** (current PostHog `InsightVizNode` query format) pinned to one **"TAG Overview"** dashboard: traffic-by-referrer + traffic-by-UTM (Trends), **affiliate funnel pageview->affiliate_click by `tool_name`** (FunnelsQuery, the monetization view) + affiliate-clicks-over-time, top-content-by-`/blog/`-path, newsletter/form-intent. Event schema verified against [go/[tool].astro](src/pages/go/[tool].astro) (`affiliate_click` payload: tool/tool_name/destination_url/is_affiliate_url/referrer). Ian supplied a PostHog personal key (`phx_...`, NOT the `phc_` ingest key) in root `.env` as `POSTHOG_PERSONAL_API_KEY` and **the apply ran LIVE**: created the **TAG Overview** dashboard (id 1699394) + 6 insights on project **408442** ("The Automations Guide"), GET-verified all 6 tiles pinned + a re-run as a clean idempotent no-op. Two gotchas surfaced + fixed mid-apply: a **project-scoped** key 403s on the org-level `/api/projects/` list (resolve via the `@current` alias instead) and the key needs **read** scopes too (`dashboard:read`/`insight:read`) for the idempotency check, not just write. Host defaults to the `us.posthog.com` management host (differs from the `us.i.posthog.com` ingest host). README at [analytics/README.md](analytics/README.md).

**2. Engine token-usage / cost logging (live, deployed).** [n8n/update-engine-usage-logging.mjs](n8n/update-engine-usage-logging.mjs) (idempotent updater, sentinel = node existence) adds a **purely additive tail off the social branch**: `Parse Social Outputs -> Compute Cost (code) -> Log Cost to Slack (http)`. The social branch is the last to run with all 3 Claude usage objects available (the existing "Slack Notification" runs in PARALLEL with "Generate Social Outputs", so Haiku usage isn't ready there). **Compute Cost** is a plain `jsCode` node (no `{{`/backtick tokens, immune to the engine's expression-tokenizer footgun) that sums `usage.{input,output,cache_creation,cache_read}_tokens` from Generate Draft + Humanize (Sonnet 4.6) + Generate Social Outputs (Haiku 4.5) and computes USD. **Pricing pulled live via the claude-api skill (not memory):** Sonnet $3/$15, Haiku $1/$5 per MTok; cache write 1.25x / cache read 0.1x on the input rate. Posts a one-line Slack cost summary (e.g. `Cost ~$0.170 for "..." | Sonnet 16.7k in / 6.7k out | Haiku 7.8k in / 520 out`). Smoke-tested the math on sample usage (~$0.17/article, matches the Session-27 ~$0.13 Sonnet + ~$0.01 Haiku estimate). The existing `Parse Social Outputs -> Save Twitter/LinkedIn` happy path is untouched, so it can't break post generation. **Deployed live** via `deploy-engine.mjs --apply` (node count 26->28, active=true unchanged) + GET-verified the 2 new nodes + wiring on `Blog Post Engine — TAG (v3)`.

**Status:** BOTH shipped + LIVE. Part 1 (PostHog dashboard created on project 408442) + Part 2 (cost logging on the live n8n engine). Both additive and separately revertable.

**Revert:** Part 1 — delete `analytics/` (additive, nothing else touched). Part 2 — `git revert -m 1 <sha>` for the JSON + re-run `deploy-engine.mjs --apply` against the prior `blog-post-engine.json` to drop the 2 live nodes (or delete "Compute Cost" + "Log Cost to Slack" in the n8n UI).

### Session 29 follow-up (2026-06-11) — flowchart QA: component fix + mobile-overflow gate + flat-tree engine rule

Ian flagged PR #74's flowchart as "horrific, especially on mobile" and asked why QA didn't catch it. Three things shipped:

**1. DecisionTree mobile fix (PR #76, merged `44c2724`).** A fully-nested tree (every top branch leads to a sub-question) renders the vertical labeled-list layout, but that layout had **no mobile handling for the nested rows**: they stayed `[LABEL]`-beside-content, so at ~340px the content **clipped off the right edge** (leaves overflowing +190px) and the centered labels stranded huge empty vertical gaps. Fix in [DecisionTree.astro](src/components/post/DecisionTree.astro): on `<=560px` stack `[LABEL]` ABOVE its content (full-width) + tighten per-level indent; desktop polish top-aligns the label when a row holds a sub-decision (`:has(> .dtree-node)`). Verified against #74's actual post (mobile 1419px->1043px, no clipping).

**2. Mobile-overflow QA gate ([qa/mobile-overflow.mjs](qa/mobile-overflow.mjs), NEW).** Root cause of why it reached Ian: the qa job's ONLY failing step was the **Netlify-wait timeout** (infra), which runs BEFORE the Vision review + auto-fixer, so those were **skipped** — and `render-acceptance` uses `linkedom` (no layout engine) so it can't see visual clipping. New deterministic gate serves `dist/` + renders each post in headless Chromium at **390px**, hard-failing on SEVERE overflow (an element >96px / 25% of viewport past the edge; `pre`/`code` + `overflow-x:auto` exempt). **Validated: fails #74's pre-fix render (+203/+190px), passes all 35 existing posts (0 false positives).** Wired into [qa-content-pr.yml](.github/workflows/qa-content-pr.yml) right after the Playwright install + BEFORE the Netlify wait (so this class is caught even when Netlify times out) and into the auto-fix verify step; `npm run qa:overflow`. **Ian merges the PR in the UI** (touches a workflow file, `reference_gh_token_no_workflow_scope`).

**3. Engine flat-tree rule (live).** [n8n/update-engine-flat-trees.mjs](n8n/update-engine-flat-trees.mjs) (idempotent, sentinel `Keep the tree FLAT`, token self-check) adds a Generate Draft rule + Humanize verify: keep `<DecisionTree>` FLAT (one question, 2-4 leaf branches, no nested sub-questions; use `<ChooseIf>`/`<IntentTable>` if two levels are needed). Shrinks the surface so the cramped-nested shape stops being generated. Deployed live via `deploy-engine.mjs --apply` + GET-verified (both prompts carry it, 1/1 braces, active unchanged).

**Deferred (recommended next):** point the Vision bot at a LOCAL preview build instead of waiting on Netlify, so the Netlify-wait timeout stops skipping the visual-review/auto-fix steps entirely (the overflow gate already removes the dependency for the overflow class, but the broader Vision pass still hangs off Netlify).

**Revert:** PR #76 `git revert -m 1 44c2724`; the gate + flat-tree are additive — `git revert -m 1 <sha>` + re-run `deploy-engine.mjs --apply` against the prior `blog-post-engine.json` for the engine.

### Session 29 follow-up #2 (2026-06-11) — executed the deferred Vision-bot-to-local move + flattened PR #74; found+fixed two more things

Continued straight from follow-up #1. Four PRs (#78/#79/#80 merged; #74 content branch ready).

**1. Vision bot off Netlify, onto a local build (PR #78, merge `e19071b`).** The deferred item from follow-up #1. [qa-content-pr.yml](.github/workflows/qa-content-pr.yml): replaced the "Wait for Netlify deploy preview" github-script step (the up-to-8-min wait whose timeout ran BEFORE the Vision review, skipping it) with a background `npx astro preview --port 4321` over the already-built `dist/` + a curl readiness poll; `qa-screenshots` now points at `http://localhost:4321`. Anthropic Vision cost unchanged (same screenshots), faster, no external dependency. Netlify still builds its own preview for human review. Pre-flight-verified `qa-pr-review.mjs` reads screenshots from disk, not a URL. Ian merged in the UI (workflow scope).

**2. Trailing-slash screenshot bug the local move EXPOSED (PR #79, merge `46f225d`).** First #74 re-run "passed" but the Vision verdict said it reviewed "a default Astro 404 page" — a FALSE pass. Root cause: `qa-screenshots.mjs` requested `/blog/<slug>` (no trailing slash); the site is `trailingSlash:'always'` + directory format, so a static host (`astro preview`) serves `dist/<path>/index.html` only at the SLASH URL and 404s the non-slash form (Netlify had been redirecting it, masking the bug). Fix: request the canonical trailing-slash URL in the `goto` (slug/slugify stay non-slash so the `blog_<slug>` filename lookup still matches). Verified 200 + real `<h1>`. **Lesson: reading the Vision verdict text caught a green-but-wrong check.**

**3. Auto-fixer structural guard (PR #80, merge `531639f`).** With the Vision bot now actually running every PR, its trigger-happiness surfaced: it false-flagged the fine 3-up `<StatRow>` as "cramped on mobile" (it stacks one-per-row by design, render verified perfect) and the auto-fixer band-aided it by **splitting the row into a 2-up + a lonely 1-up** ([qa-fix-1] on #74) — the recurring StatRow misdiagnosis (Sessions 21/24). Hardened [qa/qa-pr-fix.mjs](qa/qa-pr-fix.mjs): removed the "splitting an overlong StatRow into two" license, forbade restructuring any component prop ARRAY, and added a **deterministic structural guard** — if the count of any structural component tag (StatRow/ChooseIf/ComparisonTable/SideBySide/StepRow/ToolBreakdown/IntentTable/SpectrumBar/DecisionTree) changed vs the original, discard the fix (exit 0, no commit → routes to a human). Unit-tested (blocks the split, allows prose fixes). Memory `reference_tag_qa_autofixer_injects_css` extended.

**4. Flattened PR #74's tree (content branch, HEAD `cb2a326`).** Per Ian: the component fix killed #74's mobile clipping, but the nested labeled-list still read narrow/left-clustered on desktop (the inherent limit of nesting on wide screens). Replaced the nested `<DecisionTree>` with `<ChooseIf>` "Choose X if…" cards (HubSpot Sales Hub Pro vs Pipedrive Professional, `/go/hubspot` + `/go/pipedrive` CTAs) — full-width balanced cards on desktop, clean vertical stack on mobile (Playwright-verified both). Dropped the auto-fixer's StatRow band-aid + merged master (hardened fixer) into the branch via force-push. lint/build/render-acceptance/mobile-overflow all clean. **Ready for Ian to merge once its QA run is green.**

**Revert:** PR #78 `git revert -m 1 e19071b`; #79 `git revert -m 1 46f225d`; #80 `git revert -m 1 531639f`. All additive/behavioral; #74 is content.

---

## Quick reference — recent additions (Session 28, 2026-06-10)

**Executed the Session-27 QA-hardening plan (Part A) end to end, plus a found-and-fixed LP-builder dedup bug and a second first-mover LP batch.** Five PRs: #65, #66, #67, #69 MERGED; #68 (workflow) + #70 (LP content) OPEN for Ian.

**1. PR #65 merged** (`488286a`) — the Instantly-alternatives post fixes from Session 27 shipped. (Its red `qa` check was the known Netlify-wait timeout; the Netlify deploy-preview itself was green.)

**2. Part A2 — component guards + shape-agnostic DecisionTree (PR #66, merge `a720671`).** Added `(prop ?? [])` / destructuring defaults to every unguarded array access in the 8 post components (ToolBreakdown, ChooseIf, StatRow, IntentTable, SpectrumBar, DecisionTree, StepRow, [ComparisonTable](src/components/ComparisonTable.astro) + nested `tool.pros`/`cons`/`conditions`/`row.cells`) so a malformed LLM-emitted prop **degrades, never crashes the build**. [DecisionTree.astro](src/components/post/DecisionTree.astro): when **any** top-level branch nests another decision, the whole tree now renders the vertical labeled-list layout instead of the cramped horizontal `max-width:14rem` bus — the exact PR #65 flowchart defect, fixed at the source. Verified via a throwaway fixture post (mixed-shape tree rendered vertical, Playwright-confirmed; degraded props kept the build green).

**3. Part A1/A3 — deterministic render-acceptance gate + registry checks (PR #67, merge `af36f3a`).**
- **[qa/render-acceptance.mjs](qa/render-acceptance.mjs)** (A1, NEW) — parses the BUILT `dist/blog/<slug>/index.html` with `linkedom` (new devDep) and hard-fails on rendered-result invariants the regex linter + compiler can't see: post actually rendered (non-empty + `<h1>`), every DecisionTree source branch rendered (rendered `.dtree-leaf`/`.dtree-q` ≥ source `result:`/`question:` counts), and every registry-backed tool logo actually shows up (`.tbd-logo`/`.ci-logo`). `--post|--slug|--all`; needs `npm run build` first.
- **[qa/lint-content.mjs](qa/lint-content.mjs)** (A3) — added **registry integrity** (a `tools.ts` `logo:` path pointing at a missing file → HARD) and **logo completeness** (a tool compared in a ToolBreakdown/ChooseIf with no registry logo → WARN, deliberately not hard so it can't wedge the daily auto-merge pipeline — the engine compares many legitimately logo-less tools).
- **[qa/registry.mjs](qa/registry.mjs)** (NEW) — shared registry/MDX-parse helpers (logo map, affiliate status, brace-matched `extractTagBlocks`, `refdLogoSlugs`) imported by both gates so they can't drift (`feedback_unified_fuzzy_match_key`). Uses a **quote-agnostic** `slug:\s*['"]...` read (the same bug class that bit the LP builder — see #6).
- npm scripts `qa:lint` / `qa:render`; QA README documents the gates. Cleared the 2 Session-25-flagged pre-existing HARD lint failures with `--fix`, so `lint --all` + `render-acceptance --all` are both **0-hard across all 34 posts**. Three negative tests confirmed each gate fails when it should (dropped DecisionTree branch, broken logo path, lost logo render).

**4. Part A4 — CI wiring + stop-silent-failures (PR #68, OPEN — Ian merges in UI, workflow scope).** [qa-content-pr.yml](.github/workflows/qa-content-pr.yml): render-acceptance hard gate after `npm run build`; the auto-fix path must build **and** pass render-acceptance before it's pushed (a bad fix fails the job instead of landing); **`failure()` steps** post a "manual review needed" PR comment + Slack on ANY failed step (gate/build/Netlify/fixer crash) — the exact PR #65 silent-death gap; Netlify-wait 5→8 min. **Ian must merge this in the GitHub UI** (`reference_gh_token_no_workflow_scope`). Part A is "green" once #68 is merged and a content PR exercises the gate — that gates Part B.

**5. LP-builder dedup quote-bug (PR #69, merge `c3126b7`).** [backlog/build-tool-lp.mjs](backlog/build-tool-lp.mjs) emits `tools.ts` entries via `JSON.stringify` (**double-quoted**) but `parseToolsTs` read `slug:`/`name:`/`category:` **single-quote-only**, so it was blind to its own 5 prior (Session-23) additions → re-proposed 3 already-shipped tools and would have spliced **duplicate** registry entries on `--apply`. Fixed: quote-agnostic read (`['"]`). (`feedback_scripts_are_source_of_truth`.)

**6. Second first-mover LP batch (PR #70, OPEN).** With the dedup fixed, `--from-stars --count=8` proposed 8 genuinely-new tools; applied via `--apply-cached`: **Mailforge, Surfe, LeadMagic, BetterContact, Vector, Vapi, Circleback, Fillout** (tools.ts 35→43). All `listed:false` + `status:pending` (indexable `/tools/<slug>` hubs, off the homepage strip/grid until a program approves or an article publishes). Verified: build clean, each renders FAQPage JSON-LD + `/go` CTA, all 8 in sitemap + `/tools` A-Z index, homepages 200, 0 dashes, lint 0-hard. **Open for Ian to eyeball the deploy preview + merge.**

**7. Part B — engine now posts 7 days/week + no-queued-topic alert (PR #72, DEPLOYED LIVE).** After Ian merged #68 (Part A green), flipped the engine Schedule Trigger cron `0 8 * * 1-5`→`0 8 * * *` and added a **side branch** off "Get Next Topic" via idempotent updater [n8n/update-engine-daily-and-empty-alert.mjs](n8n/update-engine-daily-and-empty-alert.mjs): IF "Queue Empty?" (`results.length == 0`) → "Slack Queue Empty", so an empty Content Calendar queue pings Slack instead of silently skipping the day. **Additive only — the existing Get Next Topic → Parse Topic happy path is untouched, so the alert can't break post generation.** Deployed via `deploy-engine.mjs --apply` + GET-verified live: "Blog Post Engine — TAG (v3)" active=true, cron `0 8 * * *`, node count 24→26, both new nodes + the `Queue Empty?[true]→Slack Queue Empty` wiring present. **Supply dependency:** the cron doesn't create topics — needs ≥7 `Queued`/week (backlog builder auto-stages Suggested Sun 6/14; Ian flips to Queued) or the alert fires.

**Status:** Part A + Part B both shipped. #68 merged by Ian; #65/#66/#67/#69/#70/#71/#72 merged. GitHub's GraphQL API was 401'ing late-session (REST fine) — #69–#72 were created/merged via REST.

**Revert:** each PR `git revert -m 1 <sha>` (component guards behavior-preserving for well-formed input; LPs via the fenced "LP-builder additions" blocks). Engine cron: re-run `deploy-engine.mjs --apply` against the prior `blog-post-engine.json` (restore `0 8 * * 1-5`) or set cron back + delete the 2 alert nodes.

---

## Quick reference — recent additions (Session 27, 2026-06-10)

**Reworked the engine-generated "Instantly Alternatives 2026" post (PR #65) + 3 site-wide post-layout changes Ian requested, then root-caused why formatting defects keep reaching him and wrote a QA-hardening + daily-scheduling + cost plan for next session.** PR #65 fixes are SHIPPED to the branch (`content/2026-06-10-instantly-alternatives-2026-when-youve-hit-the-limits`, commit `0acf2f0`, pushed) but **PR #65 is still OPEN** — merge it first next session. The QA/scheduling/cost work is a written plan (approval pending), NOT yet built.

**1. PR #65 post fixes (Smartlead/Lemlist/Reply.io comparison).**
- **Flowchart**: the `<DecisionTree>` mixed a *nested* branch (`next`) beside two *leaf* branches at the top level; the component crammed the nested sub-tree into a `max-width:14rem` flex column. Flattened the post's `tree` to **4 sibling leaf branches** (no nesting) — the shape the component renders cleanly. Content-only fix for this post.
- **Quick Answer**: `.quick-answer` was `display:flex; flex-wrap:wrap`, which turned each text fragment + inline `<a>` into a separate wrapping flex item, fragmenting the multi-link sentence (the "looks like mobile" report). Changed to `display:block` in [global.css](src/styles/global.css) — **site-wide**, uplifts every post's quick-answer.
- **Missing logos**: `<ToolBreakdown>` auto-resolves logos from `tools.ts`; Smartlead had one, Reply.io had no `logo:` field, Lemlist wasn't in the registry at all. Sourced **official brand logos** (Lemlist `logotype.svg` from web-assets.lemlist.com; Reply.io `1280px-Reply-io-logo.png` from reply.io, `sharp`-trimmed → `reply-io.webp` 400×120) into [public/brand/tools/](public/brand/tools/); added a Lemlist hub entry (`listed:false`) + Reply.io `logo:` in [tools.ts](src/data/tools.ts). (`lemlist`/`reply-io` already existed in affiliate-links.ts.)

**2. Site-wide layout changes (all in [BlogPostLayout.astro](src/layouts/BlogPostLayout.astro) / [TableOfContents.astro](src/components/post/TableOfContents.astro), affect every post):**
- "On this page" TOC: `columns:2` → horizontal single-line inline list with dot separators (compact, wraps gracefully on mobile).
- Affiliate disclosure moved from under the byline to the **very bottom** of the article (after `<AuthorNote/>`), per Ian (he was explicit; noted the FTC near-the-links convention but honored the request).
- Byline now **"By Ian @ The Automations Guide"**. The post had no `author` frontmatter so it fell back to the org default; added `displayAuthor = (!author || author === 'The Automations Guide') ? 'Ian' : author` driving both the byline and the JSON-LD `author.name`.

**Verification:** `npm run build` clean at **118 pages**, `lint-content --slug ...` clean, Playwright (msedge) desktop 1280 + mobile 390 element shots confirmed all 6 items (4-branch tree, full-width quick-answer, 3 logos in ToolBreakdown, single-line TOC, disclosure only at bottom, byline). **Revert:** `git revert -m 1 <merge-sha>` after merge.

**3. Root-cause analysis + plan (NOT built — see plan file).** Ian asked why defects keep slipping despite all the engine hardening. Evidence from PR #65's CI: **both QA runs failed for unrelated infra reasons and surfaced none of the 3 defects** — the first run's Vision auto-fixer edited the post and crashed the build (`TypeError: Cannot read properties of undefined (reading 'length')` at render), the second timed out at "Wait for Netlify deploy preview." Diagnosis: QA validates **syntax** (regex `lint-content.mjs`) + **compilation** (build gate) but **never the rendered result**; the only renderer-aware check (the Vision fixer) is non-deterministic, MDX-only, and currently fails closed-but-silent. Plan at **`~/.claude/plans/theautomationsguide-claude-md-i-need-to-woolly-ripple.md`** (approval pending):
- **A — QA hardening:** new deterministic `qa/render-acceptance.mjs` (parse built `dist/blog/<slug>/index.html` with `linkedom`; assert post rendered, every compared tool has a logo `<img>`, DecisionTree leaf-count ≥ branch-count) wired as a hard CI gate after build; add `?? []` array guards to the 8 unguarded post components (ToolBreakdown/ChooseIf/StatRow/IntentTable/SpectrumBar/DecisionTree/StepRow/ComparisonTable) so a bad prop degrades not crashes; make `<DecisionTree>` render vertical-list layout whenever *any* top-level branch is nested (kills the cramped shape at source); extend `lint-content.mjs` with a registry-completeness check (referenced tool with no logo file fails); demote the auto-fixer (no push, spacing-only) + move "manual review needed" comment/Slack to an `if: always()`/failure path + raise Netlify-wait 5→8 min. **A's workflow-file edits need Ian to merge in the UI** (gh token lacks `workflow` scope).
- **B — post 7 days/week:** engine Schedule Trigger cron `0 8 * * 1-5` → `0 8 * * *` in `n8n/blog-post-engine.json`, deploy via `deploy-engine.mjs --apply`; topic supply (≥7 `Queued`/week) is the real constraint, so add a "no queued topic" Slack alert in Get Next Topic's empty branch.
- **C — cost:** ~**$0.24/article** (Generate Draft + Humanize on Sonnet 4.6 ≈ $0.13; Generate Social on Haiku 4.5 ≈ $0.01; QA Vision + ~0.5 fix ≈ $0.08–0.10), ~**$8–10/mo** at daily cadence. Pricing pulled live via the claude-api skill (Sonnet 4.6 $3/$15, Haiku 4.5 $1/$5, Opus 4.x $5/$25 per 1M in/out; cache neutral at 1/day). No token logging exists; optional follow-up to log `usage` for real figures.

---

## Quick reference — recent additions (Session 26, 2026-06-09)

**GSC live index audit + orphan-LP internal-link fix (follow-up to Session 25's PR #63, now merged `cc85638`).** After deploying the trailing-slash fix, ran a live Search Console URL Inspection audit of all 71 sitemap URLs and fixed the actual discovery gap it surfaced.

**1. Live GSC audit ([gsc-index-status.py](gsc-index-status.py)).** New root-level script (couldn't go in `scripts/` — that's a tracked Node file, not a dir) adapted from [homegrown-growthco/scripts/gsc-index-status.py](../homegrown-growthco/scripts/gsc-index-status.py): inspects every sitemap URL via the URL Inspection API and prints a table + an explicit "NEEDS INDEXING" list. Shares auth with the homegrown script (OAuth user creds at `~/.gsc/`, read-only `webmasters.readonly`, venv `C:\Users\Ian\.venvs\gsc`); same Google account owns both properties so the cached token works. Takes a host arg (`python gsc-index-status.py https://homegrowngrowth.co` reuses it). **Result: 39 indexed / 32 `URL is unknown to Google`** (i.e. never crawled, NOT crawled-and-rejected). Zero live "Redirect error"/"Crawled-not-indexed" on canonical URLs, confirming the Session-25 diagnosis (the GSC UI report was historical/no-slash noise). The 32 = the 9 newest blog posts + 23 `/tools/` LPs. Full list exported to `gsc-needs-indexing-2026-06-09.csv` (gitignored artifact) for Ian to work through Request Indexing (he's at the daily cap, starting 2026-06-10).

**2. Root cause of the 23 tool LPs: orphaned pages.** 22 of them are `listed:false` (kept off the homepage strip + `/tools` grid per the Session-17 pipeline design), so their ONLY inbound link was the sitemap → Googlebot never found them. (rb2b + relevance-ai are `listed:true` but were only surfaced today in Session 24, so the homepage just hasn't been recrawled — time fixes those.)

**3. Fix ([tools.astro](src/pages/tools.astro), branch `fix/tools-index-internal-links`).** Added an "Every tool we cover" A-Z text-link index at the bottom of `/tools` linking ALL 34 tool hubs (neutral links, not promoted cards, so it doesn't change which tools are featured in the category grid above). This gives every `listed:false` hub an internal link from the already-indexed `/tools/` page → a crawl path. Self-maintaining (any future tool auto-appears). Build clean; dist confirms 34 `/tools/<slug>/` links incl. all former orphans.

**Revert:** PR #63 `git revert -m 1 cc85638`; this PR `git revert -m 1 <merge-sha>` (additive: one `<section>` + CSS in tools.astro, one script, gitignore).

### Session 26 follow-up (2026-06-10) — GSC re-run + Request-Indexing pass

Re-ran [gsc-index-status.py](gsc-index-status.py) (read-only; no code/output changes). **Result unchanged from 06-09: 39 indexed / 32 `URL is unknown to Google`**, all in the never-crawled bucket (zero Redirect/Crawled-not-indexed on canonical URLs) — confirms no movement yet, expected given the orphan-link fix is fresh and Request Indexing was capped. Notable since 06-09: six `listed:true` tool hubs now **Submitted and indexed** (cal-com, clay, instantly, kit, make, beehiiv, crawled 06-09). Ian began working the NEEDS-INDEXING list in GSC, front-loaded the 9 blog posts, hit the daily quota, and is deferring the **22 `/tools/` hubs + rb2b to 2026-06-11**. No CSV exported this run (the 06-09 `gsc-needs-indexing-2026-06-09.csv` still covers it).

---

## Quick reference — recent additions (Session 25, 2026-06-09)

**Trailing-slash canonicalization to fix Google Search Console index issues (branch `fix/trailing-slash-canonical-links`).** Ian reported GSC refusing to index the site for weeks (Redirect Error / Page-with-redirect / Crawled-not-indexed buckets). Investigated live with curl: the **production redirect setup is mechanically correct** (every canonical page 200s at its trailing-slash URL, no-slash forms do a clean single 301, www→apex + http→https work, no loops/chains). Root cause was a **signal mismatch**: the sitemap + `<link rel="canonical">` + 200-served pages all use the **trailing-slash** form (Astro directory format default), but nearly every internal `<a href>` and every JSON-LD URL was written **without** a trailing slash, so the site's own discovery path + structured-data canonical pointed Google at the redirecting non-canonical form of every URL. On a young domain that wastes crawl budget and feeds the redirect/duplicate buckets.

**Fix = standardize internal links + JSON-LD onto the already-canonical trailing-slash form** (NOT no-slash, which would fight Astro/Netlify defaults). Touches only `.astro`/`.ts`/`.mjs` + config — **zero content MDX changed**:
- **[astro.config.mjs](astro.config.mjs):** added `trailingSlash: 'always'` + `build: { format: 'directory' }` (explicit hardening; directory is already the default so output/sitemap unchanged — value is dev-server strictness + documented intent).
- **Indexable links → slash:** `/blog/<slug>/`, `/tools/<slug>/`, `/blog/?tag=` across [index.astro](src/pages/index.astro), [blog/index.astro](src/pages/blog/index.astro), [tools.astro](src/pages/tools.astro), [tools/[tool].astro](src/pages/tools/[tool].astro).
- **JSON-LD / canonical signals → slash:** [BlogPostLayout.astro](src/layouts/BlogPostLayout.astro) `postUrl` (drives BlogPosting `url`+`mainEntityOfPage`), tool `about`/`mentions` urls, author/publisher urls; [BaseLayout.astro](src/layouts/BaseLayout.astro) org url + breadcrumb crumb urls.
- **Nav/footer/utility → slash:** `/blog/`, `/tools/`, `/about/`, `/disclosure/`, `/privacy/`, `/terms/`, search `action="/search/"` across BaseLayout + about/terms/404/AuthorNote + [llms.txt.ts](src/pages/llms.txt.ts).
- **Affiliate CTA `/go/<slug>/` → slash** in the 7 Astro components (ComparisonTable, ChooseIf, IntentTable, ToolBreakdown, BottomLine, tools.astro, tools/[tool].astro) so the money buttons skip a 301 hop. **Deliberately left no-slash:** the ~30 existing MDX posts' inline `[Make](/go/make)` prose links + the n8n engine prompt — `/go/*` is sitemap-excluded + never indexed, so zero SEO benefit and a live n8n deploy is disproportionate. They keep working via the existing 301.

**Out of scope (correctly):** "Crawled, currently not indexed" is Google's trust/quality call on a ~5-week scaled-content domain — this change removes wasted crawl hops but indexing is a time+authority grind, not a config toggle. The 404s (`/affiliate-disclosure/`, `/wp-admin/...`, `/lorem-ipsum-.../`) are correct 404s of legacy WordPress-era/spam URLs. The single `//` double-slash GSC URL has no source in code (slugs carry no slashes) and 301s cleanly.

**Ian to do in GSC (cannot automate):** confirm registered sitemap is `sitemap-index.xml`; click **Validate Fix** on the Redirect-Error + Page-with-redirect reports after deploy; **Request Indexing** for the 5-10 best posts; expect the Crawled-not-indexed bucket to clear slowly.

**Verification:** `npm run build` clean at **115 pages** (Pagefind indexed 76); `git diff --name-only` = 17 source files, no `.mdx`; grep of `src/` for no-slash internal links = **0 remaining**; built `dist/index.html` hrefs all end in `/` (incl. `/blog/?tag=`); blog-post JSON-LD `url`/`mainEntityOfPage`/tool-url end in `/`, canonical unchanged, `og:image` still `.png`; `/go/<slug>/` + `/search/` build as directories with meta-refresh intact; sitemap still trailing-slash with 0 `/go/` entries. (Note: `lint-content --all` shows 2 PRE-EXISTING hard failures in `2026-05-21-kit-vs-substack-vs-beehiiv` (`<style>` block) + `2026-05-22-best-mailchimp-alternatives` (inline grid wrapper) — untouched by this PR; the CI content gate only lints changed posts so they don't block it, but worth a cleanup pass.)

**Revert:** `git revert -m 1 <merge-sha>` — every change is a string/config edit (add a `/`); no schema/route/data changes.

---

## Quick reference — recent additions (Session 24, 2026-06-09)

Affiliate Wave-1 approvals + a durable fix for the MDX build-break class + PR cleanup. Shipped across PRs #61, #62, #60 (plus #59 merged, #37 closed).

**1. Affiliate Wave-1 links live + surfaced (PR #61, merge `34f7a8e`).** Ian got the first three Wave-1 approvals. Pasted real `/go` URLs + flipped `status:'live'` in [affiliate-links.ts](src/data/affiliate-links.ts) for **RB2B** (`rb2b.com/?via=theautomationsguide`), **Relevance AI** (`relevanceai.com/?via=theautomationsguide`), **Cal.com** (`refer.cal.com/theautomationsguide`). Surfaced them: `logo` + `listed:true` in [tools.ts](src/data/tools.ts), and added their categories (`Website Visitor ID & Signals`, `AI Agents`, `Scheduling`) to `toolCategories` — they weren't in the hardcoded grid list, so without that they'd appear on the homepage strip but silently NOT on `/tools`. [AFFILIATE_PIPELINE.md](AFFILIATE_PIPELINE.md) marked all 10 Wave-1 applied + the 3 approved. Shipped as its own branch off master (not folded into #59), per Ian.

**2. Homepage logo fix (part of PR #61).** Ian flagged the 3 new logos as "super small." Root cause: square source canvases (RB2B 1080×1080, Cal.com 320×320, Relevance webp) that are ~75% internal whitespace, so at the strip's fixed height the mark rendered ~8px tall next to the tight-cropped existing wordmarks. Fix: `sharp .trim({threshold:10})` to each logo's bounding box (1080² → 943×279, 320×241 → 224×40, 320² → 288×60) so they fill the height like the others; capped `.logo-strip` `max-width:900px` centered so the 12-logo set wraps into two balanced rows (Ian's "stacked" suggestion), bumped img height 30→32px. QA'd via Playwright at desktop + mobile. (sharp is resolvable in the repo, no new dep; the relevance webp overwrite hit a transient OneDrive lock → wrote via a temp file + PowerShell copy.)

**3. MDX build-break prevention (PR #62, merge `9a5959e`) — the core of the session.** Today's content PR #60 ("Lemlist vs Clay") failed CI. Root cause: the engine wrote literal mail-merge placeholders **`{{first_name}}` / `{{company_name}}` in plain MDX prose** (inside `<MyTake>`). MDX parses `{{...}}` as a JSX expression → `ReferenceError: first_name is not defined` at build → the Netlify deploy preview failed → the `qa` job timed out waiting 5 min for a preview that never went green. The deterministic linter ([qa/lint-content.mjs](qa/lint-content.mjs)) is regex-only and never compiles MDX, so it couldn't catch it; the same gap had let PR #37 (Gong) sit broken for two weeks on an unclosed-SVG-quote compile error. A regex `{{ }}` linter check is NOT viable: many posts legitimately use `={{...}}` object props (the `DecisionTree tree={{...}}` blocks in ~10 posts) and `{{merge_tags}}` inside JS-string props / code fences, so it would false-positive. So two layers, leaning on the real compiler:
- **CI build gate** ([.github/workflows/qa-content-pr.yml](.github/workflows/qa-content-pr.yml)): an explicit `npm run build` step right after `npm ci`, before the Playwright install / Netlify wait. The actual MDX compiler catches the whole class (bare `{{ }}`, unclosed SVG quotes, hallucinated JSX) in ~30s with the real error instead of an opaque 5-min Netlify timeout, and build correctness is no longer hostage to Netlify queue flakiness. (Ian merged #62 in the GitHub UI: the local gh token lacks `workflow` scope, so `gh pr merge` refuses PRs that touch `.github/workflows/`. Saved to memory.)
- **Engine merge-tag guard** ([n8n/update-engine-merge-tag-guard.mjs](n8n/update-engine-merge-tag-guard.mjs) + [n8n/blog-post-engine.json](n8n/blog-post-engine.json)): idempotent updater (find-node + sentinel + token-count self-check, mirroring `update-engine-squish-guard.mjs`) adds a Generate Draft rule + Humanize verify line — never put a literal mail-merge placeholder in prose; wrap merge-field examples in inline code. The inserted text introduces no `{{`/`}}`/backtick/`${` tokens (verified by a before/after token-count check) so it can't break n8n's expression tokenizer (the Session-19 #2 family). Deployed live via `deploy-engine.mjs --apply` (node count 24, activation untouched, GET-verified both prompts carry the rule).

**4. PR #60 fixed + bad auto-fix reverted (merge `3b08ccf`).** Backtick-wrapped the two placeholders (matching the safe `{{custom_variable}}` already in the post). After Netlify went green, the QA auto-fixer pushed a `[qa-fix-1]` commit that split the standard 3-up `<StatRow>` into a 2-up + a lonely 1-up row (a Vision-bot StatRow misdiagnosis, per the Session-21 pattern) — reverted it to the 3-up before merging. Diagnostic miss worth noting: my first local "build clean" used a `_tmp`-prefixed copy, which Astro silently excludes from content collections, so the post was never actually built — caught only when the forced rebuild failed deterministically. Saved to memory.

**5. PR housekeeping.** #59 (Session-23 LP-builder) merged `36a64e7`; #61 + #62 merged; #37 (Gong) closed and **scrapped** per Ian (topic NOT re-staged). Merged master builds clean at 115 pages.

**Verification:** trimmed logos confirmed (943×279 / 224×40 / 288×60) + Playwright strip shots desktop+mobile (two balanced rows, sizes matched); `npm run build` clean (post + OG image generate; 115 pages on merged master); updater idempotent + JSON round-trips + token counts unchanged; live engine GET shows the rule in Generate Draft + Humanize; #60 Netlify preview green; all merges verified.

**Revert:** PR #61 `git revert -m 1 34f7a8e`; PR #62 `git revert -m 1 9a5959e` (the CI step) + re-run `deploy-engine.mjs --apply` against the prior `blog-post-engine.json` for the engine; PR #60 `git revert -m 1 3b08ccf`. All additive.

---

## Quick reference — recent additions (Session 23, 2026-06-08)

Picked up the two actionable open items after the Session 22 backlog builder: the **LP-builder** (the @high monetizable-supply track) and the **Node 20 action bump** (the ~2026-06-16 deadline item). Both done + verified. NOT yet committed (on `master`; awaiting Ian's go to branch + PR).

**1. Tool LP-builder ([backlog/build-tool-lp.mjs](backlog/build-tool-lp.mjs)) + first 5 first-mover LPs shipped.** The companion to `build-backlog.mjs`: most top backlog topics come back flagged "needs LP", and an LP is what makes a post double as an internal-link + affiliate hook, so LP build rate is the real volume-ramp pacer. The script generates a full `/tools/<slug>` hub entry per tool (blurb, bestFor, 2 positioning paragraphs, 3 FAQs) + the matching pending `/go/<slug>` affiliate entry, then splices both into the registries, exactly mirroring how the Session 17 pipeline tools were added by hand.
- **Input modes:** `--tools="A,B,C"` (explicit), `--from-backlog` (anchors flagged `needsLP` in `backlog/backlog-batch.json`), `--from-stars` (the ⭐ first-mover tools in AFFILIATE_PIPELINE.md's Full backlog). `--count=N` caps; `--model=` overrides (default `claude-sonnet-4-6`).
- **ONE batched Claude call** writes all LPs as strict JSON (neutral/editorial voice, named real competitors, June-2026 framing). Grounded with each tool's category + note parsed from AFFILIATE_PIPELINE.md, and told the existing 17 category labels to reuse.
- **Deterministic guards** (LLM not trusted to sanitize, per `feedback_deterministic_sanitizer_over_prompt`): strip em/en dashes; enforce kebab slug matching the affiliate-links key convention; require >=2 body paragraphs + >=3 FAQs (drops thin content); dedupe within batch; **drop any tool already in tools.ts (idempotent/re-runnable)**; and **strip a leading "Best for" off `bestFor`** (the template renders `Best for: <bestFor>`, so the model's "Best for ..." phrasing double-rendered, the one real bug caught in review). Aliases kept distinctive (e.g. `Bland AI`/`Bland.ai`, never bare `Bland`) so no false post-matches.
- **Homepage reachability check:** a lightweight GET on each proposed homepage annotates the preview with the HTTP status, so a wrong `/go` fallback URL surfaces immediately (per `feedback_validate_status_with_content`). All 5 returned 200.
- **Two-phase, review-then-apply** (mirrors the backlog builder): a plain run writes `backlog/lp-batch.{json,md}` (git-ignored) for eyeballing and changes nothing; `--apply` splices fresh output; **`--apply-cached` re-sanitizes and splices the exact reviewed `lp-batch.json`** so what ships is what was reviewed (no unreviewed regeneration). I used `--apply-cached` after reviewing.
- **Shipped LPs:** Maildoso (Cold Email & Deliverability), Trigify (Website Visitor ID & Signals), FullEnrich (Lead Data & Enrichment), Attio (CRM), Bland AI (AI Voice & Dialers). All `listed:false` (indexable hub + in sitemap, but OFF the homepage strip/`/tools` grid until a program is approved or an article publishes) + `status:'pending'` affiliate entries (homepage+UTM fallback). tools.ts 29 -> 34 entries.

**2. Node 20 action bump (the deadline item).** `qa-content-pr.yml` + `auto-merge-content.yml` still ran Node-20-runtime actions (GitHub forces Node 24 ~2026-06-16). Bumped to match the already-done `topic-backlog.yml`: `actions/checkout@v4->v6`, `actions/setup-node@v4->v6`, `actions/github-script@v7->v8` (v8 is the Node 24 runtime). All three workflows now clean (grep confirmed no `@v4`/`@v7` left).

**Verification:** `node --check` clean on the builder; live dry-run generated all 5 LPs dash-free with all homepages 200; `--apply-cached` spliced cleanly; `npm run build` clean at **75 pages** (+10: 5 hubs + 5 redirects); each `/tools/<slug>` confirmed in `dist` with FAQPage JSON-LD, rendered bestFor (no double-prefix), `/go/<slug>` CTA, present in sitemap, `/go/` excluded, and absent from the `/tools` grid (listed:false honored).

**Revert:** all additive + uncommitted. To undo the LP content: delete the 5 `LP-builder additions` entries from [src/data/tools.ts](src/data/tools.ts) + [src/data/affiliate-links.ts](src/data/affiliate-links.ts) (each block is fenced by a `// --- LP-builder additions` comment). The builder script + workflow bumps are independently revert-safe. Memory: extend `project_tag_topic_backlog_builder`.

---

## Quick reference — recent additions (Session 22, 2026-06-08)

**Topic Backlog Builder** — a standing topic-discovery engine, SEPARATE from the publishing engine, built after Ian asked whether to ramp publishing volume (toward 2/day, 7 days/week). The finding that shaped it: raw topic supply is NOT the constraint (the known universe yields 100+ viable posts), so the lever is a tool that keeps the queue topped up with deduped, ranked, net-new ideas. Shipped in **PR #57** (merge `bee15f5`) + a follow-up action-version bump (`48eebc8`).

- **[backlog/build-backlog.mjs](backlog/build-backlog.mjs)** — parses a ~104-tool universe (`src/data/tools.ts` 29 tools-with-LP + the "Full backlog" section of [AFFILIATE_PIPELINE.md](AFFILIATE_PIPELINE.md), ~75 more by category with first-mover stars; regex, no TS loader, same pattern as `lint-content.mjs`). Builds a dedup corpus from every published `src/content/blog/*.mdx` (title+tags → tool set) + the Content Calendar. ONE Claude (`claude-sonnet-4-6`) call proposes ranked net-new comparison/alternatives/best-of topics, told what is already covered. A **deterministic dedup guard** (one shared `norm()` helper, per `feedback_unified_fuzzy_match_key`) then hard-drops exact keyword/title/tool-set collisions + within-batch dupes and flags partial overlaps — the LLM is NOT trusted to dedup. No em dashes (sanitized, not just prompted). Outputs `backlog/backlog-batch.{json,md}` (git-ignored).
- **`--stage` flag** — with `NOTION_TOKEN` set, the dedup corpus becomes a LIVE query of the whole Content Calendar (any status), and survivors are created as **`Status:Suggested`**. It NEVER sets `Queued` (what the publishing engine fires on), so the human publish gate stays intact. DB id defaults to the engine's `topicsDatabaseId` `62f34586-4f78-4b83-b2ac-105f500d059e`, Notion-Version `2022-06-28`, Bearer header — matching the engine's `httpHeaderAuth` "Notion Integration Token" credential (probed off the live engine; n8n won't expose the value via API).
- **[.github/workflows/topic-backlog.yml](.github/workflows/topic-backlog.yml)** — runs it weekly (Sun 06:00 UTC) + manual dispatch with a `dry_run` preview. Run summary + artifact + optional Slack ping. **Hosted on GitHub Actions, not n8n** (deliberate): the universe + corpus are repo files the script already parses, so CI keeps the script as the single source of truth instead of duplicating ~100 lines of parsing into n8n Code nodes. The publishing engine stays in n8n; only topic discovery lives here.
- **Secrets:** Ian added `NOTION_TOKEN` (the existing "TAG - Content Engine" integration's Internal Integration Secret — an access token, NOT OAuth) and `SLACK_WEBHOOK_URL` (was NOT previously a repo secret; the engine's webhook is hardcoded in n8n). `ANTHROPIC_API_KEY` already existed.
- **Actions bumped** to Node24-era versions (`checkout@v6`, `setup-node@v6`, `upload-artifact@v7`) to clear the Node 20 deprecation (GitHub forces Node 24 ~2026-06-16). The other two workflows (`qa-content-pr.yml`, `auto-merge-content.yml`) still need the same bump — left as a `@low` TODO.

**Verification:** `node --check` clean; local dry-run works (uses the CONTENT_CALENDAR.md snapshot when no token); the within-batch dedup guard fired on a real collision. A `dry_run:true` CI dispatch (run `27136633692`) confirmed the token end-to-end: read **82 live Content Calendar rows + 30 published posts** for dedup, proposed 25, **zero writes to Notion**.

**Next / strategic takeaway:** first REAL stage is the **Sun 2026-06-14** schedule (or a manual `dry_run:false` run). The volume-ramp pacers are NOT supply but (1) young-domain SEO/scaled-content risk (watch GSC indexation) and (2) monetizable-topic supply gated by `/tools/<slug>` LP build rate — most top first-mover topics come back flagged "needs LP", so a parallel **LP-builder** is the recommended follow-up (now a `@high` TODO). [TODO.md](TODO.md) re-ranked; the stale "re-import engine" item dropped (superseded by `deploy-engine.mjs`). Memory: `project_tag_topic_backlog_builder`.

**Revert:** `git revert -m 1 bee15f5` (or just delete `.github/workflows/topic-backlog.yml` to stop it); `git revert 48eebc8` for the action bump. Additive only — no change to the publishing engine, the site, or existing workflows.

---

## Quick reference — recent additions (Session 21, 2026-06-04)

**Proactive QA gate** so formatting defects stop reaching the live preview (Ian: "I feel like I'm constantly bringing issues"). Shipped in **PR #55** (merge `0c73b8a`) + an engine redeploy. Three layers: prevent at generation (engine sanitizer), hard-gate in CI (deterministic lint), and review with a smarter Vision bot.

- **Deterministic content linter** ([qa/lint-content.mjs](qa/lint-content.mjs)) — `--post | --slug | --all [--fix]`. HARD-fails on: camelCase SVG attrs, em/en dashes, **multi-column inline grid/flex wrappers** (the PR #51 squish vector; width-only/single-col left alone), unknown `/go/<slug>` + `/tools/<slug>` (404s), used-but-unimported / hallucinated components, `<style>` blocks (promoted from warn — nothing legit carries one now). Reads the affiliate + tools registries as text (regex, no TS loader). Normalizes CRLF before parsing (Windows line-ending gotcha that initially false-flagged every file as "missing title"). Wired into [.github/workflows/qa-content-pr.yml](.github/workflows/qa-content-pr.yml), **replacing** the old camelCase-only grep step → hard gate on every content PR.
- **Refreshed Vision bot** ([qa/qa-pr-review.mjs](qa/qa-pr-review.mjs)) — prompt was stale (said "dark theme"; site has been light cream since Session 14; listed 7 of 18 components). Now: correct light brand, full component list, explicit flags for **squished/cramped components, empty column gaps, awkward yes/no decision trees, oversized embeds**. Kept the "never flag full-width prose" rule.
- **Engine squish-guard** ([n8n/update-engine-squish-guard.mjs](n8n/update-engine-squish-guard.mjs)) — `sanitizeMdx()` now strips multi-column inline grid/flex wrappers at generation (prevention upstream of CI). Deployed live via `deploy-engine.mjs --apply` + verified (node count 24, active, placeholders intact).
- **ROOT CAUSE found + closed: the QA auto-fixer was itself manufacturing the squish bug.** First PR run: the Vision bot flagged a *component-internal* issue (ToolBreakdown columns "unequal" — a **misdiagnosis**; ToolBreakdown stacks tools vertically, the `1.6fr 1fr` grid is each block's internal body/highlights split) and [qa/qa-pr-fix.mjs](qa/qa-pr-fix.mjs) "fixed" it by injecting `<style>{.tool-breakdown-equal{grid-template-columns:repeat(3,1fr)}}</style>` + a wrapper div — the exact PR #51 vector, against a non-bug, with inert (un-applied) classes. The fixer can only edit post MDX, so it can never fix a component's CSS; it was flailing with wrappers. Fixes: (a) fixer prompt now forbids ALL `<style>` + ALL layout wrapper divs and is scoped to MDX-expressible changes — component-internal issues route to manual review (output unchanged); (b) the fixer **deterministically sanitizes its own output** before writing (strip `<style>`, multi-col wrappers, em/en dashes → hyphen for ranges / comma else) after it reintroduced an en-dash in `$800-$1,200` despite the prompt rule (prompt rules fail for dashes — `feedback_deterministic_sanitizer_over_prompt`).
- **One genuine component bug fixed** ([src/components/post/TableOfContents.astro](src/components/post/TableOfContents.astro)) — the TOC `columns: 2` read lopsided/cramped on tablet; now single-column up to 900px, two only on the wide desktop container. Uplifts all posts. (The recurring Vision "TOC cut off on mobile" + "ToolBreakdown squished" flags on the test post are a screenshot-framing artifact + the stacking misdiagnosis respectively — no real bug; the hardened fixer correctly no longer acts on them.)
- **All 28 existing posts brought to a green baseline** (`--fix`): removed em/en dashes (Ian's hard rule), stripped dead component-override `<style>` band-aids (`.stat-row-grid{repeat(3,1fr)!important}` etc. — the mobile-squish *source*) + a no-op `StatRow style=` prop + a dead `.stat-row-wrapper` div. No component/copy/schema changes; build clean at 66 pages.

**Verification:** `lint-content --all` = 0 hard; `npm run build` clean (66 pages); engine updater idempotent + inserted regex compiles; deploy dry-run + apply verified; the gate **self-tested live** on PR #55 (CI lint step passed; Vision bot caught real squish-class issues; hardened fixer made no harmful change).

**Revert:** `git revert -m 1 0c73b8a` (all repo changes); engine — re-run `deploy-engine.mjs --apply` against `git show 0c73b8a~1:n8n/blog-post-engine.json`, or revert just the squish-guard line.

---

## Quick reference — recent additions (Session 20, 2026-06-04)

Final editorial-polish round before letting the engine run: professionalism + SEO/GEO/AI-citability + affiliate conversion. Shipped in **PR #54** (merge `b558960`) + an engine redeploy. An editorial audit (3 explore agents) found the foundation strong; these are the polish gaps.

**Layout-level (uplifts ALL ~20 existing posts immediately — reads existing frontmatter, no post-body edits):**
- **Visible FAQ** ([src/components/post/PostFaqs.astro](src/components/post/PostFaqs.astro)) rendered from frontmatter `faqs`, which were JSON-LD-only before (invisible to readers + on-page AI). Always-expanded, anchor ids, matches the FAQPage JSON-LD (Google parity). 27/28 posts now show it.
- **Enriched BlogPosting + author JSON-LD** in [BlogPostLayout.astro](src/layouts/BlogPostLayout.astro): `image` (the OG png), `mainEntityOfPage`, `keywords` (tags), `inLanguage`, `isAccessibleForFree`, `publisher.logo`, and **`about`/`mentions`** = the compared tools (via `postMentionsTool()` over the registry → SoftwareApplication entities at `/tools/<slug>`), plus author `sameAs` + conditional `jobTitle`. Links posts into the tool entity graph for GEO.
- **TableOfContents** ([src/components/post/TableOfContents.astro](src/components/post/TableOfContents.astro)) — full-width collapsible top block of H2 jump-links (NOT a sidebar, to avoid touching the single-column reading layout); hidden < 3 H2s (20/28 show it). `headings` passed from `[slug].astro`.
- **RelatedPosts** ([src/components/post/RelatedPosts.astro](src/components/post/RelatedPosts.astro)) — tag-scored top-3 (fallback to recent), computed in `[slug].astro`.
- **Inline affiliate-disclosure** microcopy under the byline (FTC-correct placement).
- **Per-post OG images** — `astro-og-canvas@0.7.0` (devDep, Astro-4-compatible, wasm/build-time, free), endpoint [src/pages/og/[...route].ts](src/pages/og/[...route].ts) → `/og/<slug>.png` (branded cream/teal card). Wired into `og:image` + `twitter:image` (BaseLayout) + JSON-LD `image`; `/og/` excluded from the sitemap filter. 28 generated; verified served 200 on the preview. **No `og:image` existed before** so purely additive.

**New body components (NEW engine posts only; existing bodies untouched):** [KeyTakeaways](src/components/post/KeyTakeaways.astro) (after quick-answer), [Sources](src/components/post/Sources.astro) (cited links, end), [BottomLine](src/components/post/BottomLine.astro) (verdict + recommended `/go` CTA, end). Wired via [n8n/update-engine-editorial.mjs](n8n/update-engine-editorial.mjs): 3 imports (12→15), KeyTakeaways after quick-answer + BottomLine/Sources at the COMPARISON close, Humanize parity. Single-brace JSX only; **braces verified 1/1, 13 expression bodies compile**. Re-deployed live via `deploy-engine.mjs --apply` AFTER the PR merged (components must exist on master first) + verified (imports present, active).

**`/disclosure` refreshed**: live-program list corrected (Make/Apollo/Clay/Beehiiv/Smartlead/Kit) + a "How we test" methodology section. **RSS left as-is** — full-content for component-laden MDX needs the experimental Container API (fragile); deferred.

**Verification:** build clean; all JSON-LD parses (BlogPosting enriched + FAQPage + BreadcrumbList); empty-state guards hold (no empty FAQ/TOC chrome: 0/0); Playwright desktop+mobile QA of every new block; existing reading column unchanged; Netlify preview green + OG image 200.

**Revert:** `git revert -m 1 b558960`; engine — re-run `deploy-engine.mjs --apply` against `git show 217a123~1:n8n/blog-post-engine.json`. Each new block is additive + guarded (partial revert safe).

**PR #51 formatting bugs — RESOLVED (commit `f378472`, deployed live).** Ian flagged a generated post (Motion vs Reclaim vs Akiflow) with (1) a StatRow squished into 1/3 width and (2) an awkward `<SideBySide>`+yes/no `<DecisionTree>`. Root causes, fixed engine-side for all future posts: (1) the model had wrapped `<StatRow>` in a per-post `<style>.stat-row-3up{grid-template-columns:repeat(3,1fr)}</style>` + `<div>` (StatRow is one self-contained element, so the 3-col wrapper put it in 1/3); `sanitizeMdx()` now **strips all post-level `<style>` blocks** (components are self-styled + responsive; the bare div left behind is harmless) via [n8n/update-engine-layout-hygiene.mjs](n8n/update-engine-layout-hygiene.mjs). (2) Removed the hardcoded `<SideBySide><DecisionTree>` "how to choose" skeleton step (empty-column gap + the yes/no tree); the rotating COMPARISON FORMAT block already covers compare+decide (prefers ChooseIf/IntentTable). Plus a LAYOUT prompt rule + Humanize verify (no `<style>`/grid-width wrapper divs). PR #51 closed + branch deleted. Note: existing live posts still carry their (QA'd, rendering-OK) `<style>` wrappers; the strip only affects newly-generated posts.

---

## Quick reference — recent additions (Session 19, 2026-06-03)

Closed out the three deferred items from Session 18 in one session. PR #47 open (`content/decisiontree-rollout-2026-06-03`); engine change already LIVE; 16 content topics staged in Notion.

**1. DecisionTree rolled out across all 11 remaining comparison posts (PR #47).** Session 18 proved `<DecisionTree>` on clay-vs-zapier only; this session converted every other post that hand-drew an inline `<svg>` decision tree. Each was translated into the data-driven `tree` schema inside the existing `<SideBySide>` (prose left, tree right), matching the proof pattern. Posts: apollo-alternatives, beehiiv-vs-substack-vs-hubspot (nested), gong-vs-outreach-vs-salesloft (3-way), lemlist-vs-apollo (nested), why-revops-abandoning-outreach (nested, also dropped its `overflow-x` min-width:560 SVG wrapper), n8n-vs-make (nested), lemlist-vs-smartlead-vs-instantly (nested), outreach-alternatives (nested), best-salesforce-automation-tools (nested), pipedrive-vs-apollo, instantly-alternatives (nested). Each got `import DecisionTree from '@/components/post/DecisionTree.astro';`. **The pipedrive-vs-apollo SVG still carried stale dark-theme indigo (`#6366f1`/`#1e293b`)** — converting to the component cleaned that too. **Left as SVG on purpose:** `2026-05-11-kit-n8n-4-newsletter-automations` and `2026-05-12-newsletter-automation-stack` carry **process/workflow** flows, not decision trees (DecisionTree is decisions-only). Tone convention used: `primary` (teal) = the post's recommended pick, `alt` (amber) = viable alternative, `neutral` = fallback. Faithfully reproduced each tree's branch logic; where an original SVG's mapping was muddled (lemlist-vs-apollo) the prose was the tiebreaker.

**2. Engine now emits `<DecisionTree>` + 2-3 visuals on new posts (LIVE).** New idempotent updater [n8n/update-engine-decision-tree.mjs](n8n/update-engine-decision-tree.mjs) (same find-node-by-name + string-guard pattern as `update-engine-v5.mjs`): (a) adds the DecisionTree import to Generate Draft's REQUIRED IMPORTS block; (b) swaps the COMPARISON skeleton's hand-drawn `<Figure><svg>` tree for a `<DecisionTree>` usage (also fixed a stray em dash in the skeleton); (c) adds **DECISION TREES** (component schema + "hand-drawn decision-tree SVGs are banned") and **VISUALS** ("2-3 visuals per post; do NOT invent/hot-link product screenshots, a human adds those") prompt sections, placed before the SVG/MDX rule which **stays** for process-flow diagrams; (d) Humanize import-count 7→8, `<DecisionTree>` added to its component list, plus a DECISION TREE verify line. **Parse Draft unchanged** — its import check only asserts the SideBySide import (still present) and `sanitizeMdx()` still serves process-flow SVGs. **All injected text avoids backticks and `${`** (the Generate Draft/Humanize bodies are `={{ JSON.stringify({...prompt-as-template-literal...}) }}` expressions; per `feedback_no_backticks_in_template_literal_prompts`). Deployed via [n8n/deploy-engine.mjs](n8n/deploy-engine.mjs) `--apply` to "Blog Post Engine, TAG (v3)" on `homegrowngrowth.app.n8n.cloud`; verified live (node count 24 unchanged, activation untouched, live Generate Draft prompt confirmed to contain the DecisionTree import + DECISION TREES section). **No manual re-import.**

**3. Ranked content calendar ("E" deferred item) + staged in Notion.** New [CONTENT_CALENDAR.md](CONTENT_CALENDAR.md): 16 fresh comparison topics ranked by first-to-compare leverage (AI SDR agents / AI voice / visitor ID / AI agent builders / GEO first), each anchored on a Wave 1/2 tool from AFFILIATE_PIPELINE.md that already has a `/tools/<slug>` landing page (so each post = internal-link + affiliate hook). All 16 created in the Notion **Content Calendar** DB (data source `3536c795-1a40-4ddf-a210-05a117df3848`) at **`Status: Suggested`** — the engine fires only on `Queued`, so they are staged Ideas, not auto-publishing. (The DB has no "Idea" status; `Suggested` is the non-publishing staging state.) Instantly omitted: already covered by existing posts.

**Verification:** `npm run build` clean at **100 pages**; compiled `dist/blog/<slug>/index.html` shows `.dtree-flow` markup and **zero** `viewBox="0 0 360` trees in converted posts (spot-checked gong/beehiiv/pipedrive). No em/en dashes introduced in authored copy (DecisionTree blocks scanned clean; pre-existing dashes in untouched StatRow/FAQ/MyTake prose left alone). Engine JSON: `JSON.parse` OK, all 13 `={{ }}` expression bodies + 6 jsCode nodes compile via `new Function` (no template-literal break), updater idempotent on re-run. Notion: 16 rows confirmed created with Topic/Status/Priority/Tag/Target Keyword/Pub Date/Notes.

**Deferred (needs Ian):** per-post **product screenshots** — NOT in PR #47 (additive; every post already lands 2-3 visuals via StatRow + ComparisonTable + DecisionTree). A per-post shot list (recommended tool per post → official vendor source only, never third-party blogs) is going to Ian for download approval, then lands as a follow-up commit on the same branch. `public/screenshots/n8n.png` (Session 18) can be reused for n8n-vs-make with no download.

**Revert paths:** PR #47 content/docs/engine-JSON — `git revert -m 1 09292ff`. Live engine — re-run `deploy-engine.mjs --apply` against an earlier `blog-post-engine.json`. Notion topics — set `Status: Skipped` (or delete the 16 rows).

### Session 19 follow-up (same day) — screenshots, comparison-format variety, engine re-deploy

After the Session 19 PRs, Ian reviewed and asked for two changes; both shipped (all merged to master + engine re-deployed):

**A. Product screenshots (PR #48, merge `0dbc6c7`).** Added real product-UI screenshots to **7** comparison posts, each sourced from the tool's **own domain** and visually verified before use (the reliable source was vendor **help/docs centers**, not marketing pages, which lazy-load UI — see `reference_product_screenshots_from_help_docs`): why-revops + outreach-alternatives → HubSpot Sequences (knowledge.hubspot.com), apollo-alternatives → Clay (clay.com), beehiiv-vs-substack → Beehiiv (media.beehiiv.com), n8n-vs-make → reused `public/screenshots/n8n.png`, lemlist-vs-apollo → Apollo (apollo public KB / GCS), pipedrive-vs-apollo → Pipedrive (kb-cms.pipedriveassets.com). Per Ian's review: screenshots are **spaced** from the DecisionTree above (`.figure.post-screenshot { margin-top: 2.5rem }`) and **capped at 600px** centered (`Figure` gained a `class` prop). **Deferred** (no clean official UI sourceable headlessly; sites lazy-load or are SPAs): Smartlead, Gong, Salesforce Flow → those posts keep their 3 data visuals. Ian can drop a login screenshot into `public/screenshots/<tool>.png` + add the same `<Figure>` block.

**B. Comparison-format variety (PR #49, merge `8075dc4`).** Every comparison using the identical 3-column card table read as an AI tell. Added two alternate formats: **`<ToolBreakdown>`** (new `src/components/post/ToolBreakdown.astro`, section-per-product editorial blocks) and a **`compact`** mode on `<ComparisonTable>` (slim at-a-glance rows, no pros/cons). Retrofit: make-vs-zapier-vs-n8n + gong-vs-outreach-vs-salesloft + pipedrive-vs-apollo → ToolBreakdown; apollo-vs-clay-vs-linkedin + lemlist-vs-smartlead-vs-instantly → compact. (pipedrive-vs-apollo was the one Ian flagged as "format stinks" — converted from its sparse 2-col card table; verified on the regenerated preview before merge.) Engine updater `n8n/update-engine-comparison-formats.mjs` adds the ToolBreakdown import + a **COMPARISON FORMAT rotation** rule (pick one of three by fit, do not default to the card table) + Humanize parity (8→9 imports, ToolBreakdown in the component list, a format-verify line).

**C. Engine re-deployed LIVE** via `deploy-engine.mjs --apply` **after** both component PRs merged (ordering matters: the engine emits `<ToolBreakdown>`, which had to be on master first or a scheduled run's PR would fail to build). Verified live: ToolBreakdown import + COMPARISON FORMAT section present, node count 24, active. The 16 staged Notion topics remain `Suggested` so nothing auto-fired during the gap.

**Verification:** `npm run build` clean at 100 pages throughout; both new formats confirmed in compiled HTML; pipedrive-vs-apollo ToolBreakdown verified on the live #48 preview (Playwright element shot) before merging; live engine confirmed via API GET.

### Session 19 follow-up #2 (2026-06-04) — engine hotfix + last 4 screenshots

**D. Engine broke on the first run with the new prompt, hotfixed (commit `86ce22c`, deployed live).** The 2026-06-04 08:00 scheduled run failed at Generate Draft with `invalid syntax`. Root cause: the DecisionTree schema I added (Session 19) used **literal `tree={{ … }}`**, and the node body is itself an n8n expression `={{ JSON.stringify(...) }}` — n8n treats `{{`/`}}` as the expression delimiters, so the first inner `}}` closed the expression early. **Same family as the Session 10 backtick break, and my `new Function` compile-test passed because the JS is valid — only n8n's tokenizer breaks.** Fix [n8n/fix-engine-double-braces.mjs](n8n/fix-engine-double-braces.mjs): keep only the outer `={{ }}`, space every inner `{{`→`{ {` and `}}`→`} }` (renders identically in MDX; single braces were always fine). Deployed via `deploy-engine.mjs --apply`, verified live (exactly 1 `{{` / 1 `}}`, active). Reset the stuck topic **"Kit vs Beehiiv"** Generating→Queued so the next run retries it. `update-engine-decision-tree.mjs` source also spaced + a CRITICAL comment added; memory `feedback_no_backticks_in_template_literal_prompts` extended to cover `{{`/`}}`. (The Morning Briefing / daily-briefing workflow was unaffected.)

**E. Product visuals for the last 4 comparison posts (PR #50, merge `eb6aa5a`) — screenshot coverage now complete on all 11.** Ian pointed at specific product pages and said "screenshots **or features**." Their UI is client-loaded, so I rendered each page with Playwright and element-captured the real visual: lemlist-vs-smartlead-vs-instantly → Smartlead waterfall-verification engine; instantly-alternatives → Smartlead lead view; gong-vs-outreach-vs-salesloft → Gong AI Composer; best-salesforce → Salesforce Flow Builder (from help docs). Each validated by eye, linked to `/go/<slug>`, `post-screenshot` (spaced + 600px). No more deferred screenshots.

### Session 19 follow-up #3 (2026-06-04) — formatting polish + brand (PR #52, merge `fbb2d97`)

Six edits from Ian's review (all verified locally via Playwright, deployed):
- **ToolBreakdown** ([src/components/post/ToolBreakdown.astro](src/components/post/ToolBreakdown.astro)): narrative left / highlight bullets right (cuts vertical space), brand **logo top-right auto-resolved** from the tools registry (matches affiliateSlug/name/alias; nothing for tools without a registry logo), **prominent pricing**. Engine prompt hints a second pricing tier.
- **DecisionTree** ([src/components/post/DecisionTree.astro](src/components/post/DecisionTree.astro)): nested sub-decisions now render as a **labeled vertical list under a teal guide line** (`.dtree-branches--nested` / `.dtree-node--nested`), each answer its own row. Fixes the funky "Yes -> Use Akiflow -> No -> Use Reclaim" misread on deep trees (top-level horizontal branching unchanged).
- **Newsletter** ([src/components/EmailSignup.astro](src/components/EmailSignup.astro) + global.css): copy sits **beside** the Beehiiv form on desktop (2-col grid) instead of stacked above it, ~halving the section height; tighter padding; fixed an em dash. (The Beehiiv form is a fixed ~290px cross-origin iframe we can't restyle internally, so beside-not-above is the lever.)
- **Last name removed site-wide** (now just "Ian"): JSON-LD founder.name, About (hero + meta), privacy, AuthorNote, and BOTH engine prompts (`blog-post-engine.json` + `update-engine-v5.mjs`). No "Chamberland" left in `src/`.
- **Socials:** header LinkedIn icon now -> **TAG company page** (`linkedin.com/company/the-automations-guide/`); new **X icon** -> `x.com/the_automations`; org JSON-LD `sameAs` = company LI + X + HGC. **Personal LinkedIn kept only on the About page** (the author card now links to `/about` instead). Founder Person entity in JSON-LD still carries the personal LI (mirrors About).
- **Engine re-deployed** (name scrub + pricing hint) via `deploy-engine.mjs --apply`, verified live (no "Ian Chamberland", 1/1 braces, active).

**Open thread:** Ian proposed alternatives to decision trees (spectrum/slider matrix, "If/Then" quick-filter cards, JTBD comparison table) and asked for thoughts before building. Recommendation pending in chat: adopt **If/Then "Choose X if" cards** as the primary decision aid + a **JTBD intent table**, fold both into the engine's format rotation, and demote DecisionTree to genuinely-sequential decisions only.

### Session 19 follow-up #4 (2026-06-04) — decision-aid formats (PR #53, merge `0204c74`)

Ian approved building all three alternatives. Shipped as reusable components (all verified via a scratch page using his Motion/Reclaim/Akiflow data, then deleted):
- **[ChooseIf.astro](src/components/post/ChooseIf.astro)** — "Choose X if" self-select cards (2-4 tools), the new **default** for "which is for me" decisions. Auto-resolves logos from the tools registry; highlight = filled-teal CTA.
- **[IntentTable.astro](src/components/post/IntentTable.astro)** — job-to-be-done matrix: intent rows (Best for / AI philosophy / Team fit) x tool columns, highlighted column, CTA row, horizontal-scroll on mobile.
- **[SpectrumBar.astro](src/components/post/SpectrumBar.astro)** — static TWO-tool philosophy spectrum: a marker leans toward each tool per dimension (`lean` left/center/right or `position` 0-100). No JS.

**Engine** ([n8n/update-engine-decision-aids.mjs](n8n/update-engine-decision-aids.mjs)): COMPARISON FORMAT rotation expanded **3 -> 6** options (the model now prefers ChooseIf/IntentTable for self-select decisions); **DecisionTree demoted to genuinely-sequential decisions only** ("what is your CRM? then volume?"). Humanize import count 9 -> 12 + component list updated. All JSX examples single-brace (no `{{`); braces verified 1/1, 13 expression bodies compile. Re-deployed live via `deploy-engine.mjs --apply` (ordering: components on master first) + verified.

So the engine now rotates across SEVEN content treatments (StatRow + the 6 comparison/decision formats), which should fully kill the "every post looks identical" AI-tell. Existing posts keep their (now-fixed) DecisionTrees; the demotion only affects new generation.

---

## Quick reference — recent additions (Session 18, 2026-06-03)

UX/visual cleanup pass + a content-engine change, shipped as three merged PRs plus a CI-pipeline fix and a live n8n deploy. All on `master`/production.

**1. PR #45 — comparison table + tools page standardized; engine video-script removal (merge `1d9c631`, work `cc64340`).**
- **[ComparisonTable.astro](src/components/ComparisonTable.astro)**: every column now renders a `/go/<slug>` link even for tools with no affiliate program (Ian's standing rule). Added `salesforce`, `gong`, `outreach`, `salesloft` as `no-program` entries in [affiliate-links.ts](src/data/affiliate-links.ts) and filled the **5 previously-empty `affiliateSlug`** fields across 3 posts (gong-vs-outreach-vs-salesloft ×3, why-revops-abandoning-outreach, best-salesforce-automation-tools). CTA treatment unified: uniform divider + button on every column, with the highlighted "Top pick" keeping a filled-teal button (others ghost). Fixes the original 3-different-renderings bug (no link / no divider / stray divider).
- **[tools.astro](src/pages/tools.astro) + [global.css](src/styles/global.css)**: badge now always sits **below** the tool name (was a `flex-wrap` row that left short badges beside the name, wrapped long ones underneath — the Make-vs-n8n inconsistency). Whole card is a single click target for `/tools/<slug>` via a stretched title-link `::after`; the Try CTA + article link stay independently clickable above the cover.
- **Engine**: removed short-form **video script generation** from [blog-post-engine.json](n8n/blog-post-engine.json) (deleted the Save Video Script node + connection, dropped the `video` field from Generate/Parse Social Outputs, updated Slack copy). Idempotent updater [n8n/remove-video-script-generation.mjs](n8n/remove-video-script-generation.mjs). Twitter + LinkedIn social outputs unchanged.

**2. PR #44 — $1K enterprise-stack post: broken decision tree → real n8n screenshot (merge `b1b4f86`).** The post's in-`SideBySide` decision-tree SVG rendered **0×0** (inline `<svg>` with viewBox + no width inside a flex column). Replaced it with a **real n8n editor screenshot** of an actual RevOps workflow (new-lead webhook → enrich → HubSpot → ICP branch → Smartlead / Slack), captured from a **local `npx n8n` instance** (owner-setup + clipboard-paste import automated via Playwright, tight high-res crop via sharp), saved to [public/screenshots/n8n.png](public/screenshots/n8n.png), hyperlinked to `/go/n8n`. Salesforce comparison column now links. `.gitignore` gained `!public/screenshots/` so served assets aren't caught by the broad `screenshots/` ignore. Screenshots must be **real product UI, not marketing homepages** (Ian's rule, saved to memory).

**3. PR #46 — reusable `<DecisionTree>` component (merge `8c0c023`).** New [src/components/post/DecisionTree.astro](src/components/post/DecisionTree.astro): data-driven, on-brand, responsive, robust (no fragile SVG sizing), supports nested decisions. Replaces hand-drawn SVG trees; applied to clay-vs-zapier as the pattern proof. Follow-up commit `f32dae5` fixed the **connector lines** (were `var(--border)`, invisible on cream; now a teal stem → horizontal bus → drops to each branch, with the bus inset set inline from branch count; hidden when branches stack on mobile).

**4. QA auto-fix bot constrained (master `4f82abd`) — root cause of a reported "content condensed / text narrower than the boxes" regression.** Diagnosis: the **QA Vision auto-fixer** (`.github/workflows/qa-content-pr.yml`) was flagging "prose too wide at 1440px" and committing `article,.prose,.post-body{max-width:75ch!important}` + wrapper divs directly into the post files on the PR branches (only on the previews, not local/prod — which is why it was baffling). The site's full-width ~1232px desktop content is intentional. Fixed [qa/qa-pr-review.mjs](qa/qa-pr-review.mjs) (dropped the "reading lines too wide" check + added a "do NOT critique content width" rule) and [qa/qa-pr-fix.mjs](qa/qa-pr-fix.mjs) (hard NEVER block: never touch content/container width, never add max-width/`!important`/global-selector styles or width-wrapper divs). Stripped the bot's injections off both branches; verified both previews back to 1232px uniform. The bot now does only legit spacing fixes (re-ran twice more, stayed width-safe, kept the DecisionTree).

**5. Live n8n deploy of the engine (this session, `acc487a`).** Pushed the video-script removal to the live **"Blog Post Engine — TAG (v3)"** on the shared HGC n8n Cloud (`homegrowngrowth.app.n8n.cloud`) via the new [n8n/deploy-engine.mjs](n8n/deploy-engine.mjs) — GETs the live workflow, bakes its **real credential ids + Config node values** into the local JSON so a push never clobbers live bindings with the committed `REPLACE_WITH` placeholders, aborts if anything can't be resolved, leaves activation untouched, verifies after. Run: `node --env-file=../restaurant-outreach/.env n8n/deploy-engine.mjs [--apply]` (shared `N8N_API_URL`/`N8N_API_KEY` live in restaurant-outreach/.env). Verified live: node 25→24, Save Video Script gone, active=true. Fixed 2 latent JSON bugs the strict API surfaced (UI import tolerated them): credential name `GitHub PAT`→`Github PAT` (×6, matches live cred so GitHub nodes auto-bind) and stale connection `Parse Draft → "Check Idempotency"` → `"Check Idempotency MDX"`. **No manual re-import needed anymore.**

**Verification:** `npm run build` clean throughout (99-100 pages); all `/go/{salesforce,gong,outreach,salesloft}` redirects build; comparison/tools/post pages eyeballed at desktop 1280/1440 + mobile 390; live previews measured at 1232px after the QA-bot fix; n8n deploy verified via API GET.

**Deferred (Ian will pick up in a separate session):** roll the `<DecisionTree>` + a validated product screenshot across the other ~12 comparison posts (keep+fix the trees, screenshots sourced from vendor/legit material, validated); update the n8n engine to emit `<DecisionTree>` + 2-3 visual slots on new posts (Ian wants 2-3 visuals per post, not walls of text); the "E" fresher-content / newer-tools ranked calendar (brief delivered, anchored on the ~20 AFFILIATE_PIPELINE.md tools).

**Revert paths:** PR #45 `git revert -m 1 1d9c631`; PR #44 `git revert -m 1 b1b4f86`; PR #46 `git revert -m 1 8c0c023`; QA-bot constraint `git revert 4f82abd` (CI-only); engine deploy — re-run `deploy-engine.mjs` against a prior JSON from git to restore.

---

## Quick reference — recent additions (Session 17, 2026-06-01)

Affiliate-program expansion: researched GTM-space programs (weighted to newer/AI tools), prioritized 20 to apply for, and built an unlisted landing page for each so the site is first-to-compare as those tools grow.

**1. New tracker doc [AFFILIATE_PIPELINE.md](AFFILIATE_PIPELINE.md).** ~92 GTM affiliate programs grouped by category with confidence flags, a prioritized top-20 (Wave 1 + Wave 2) with Applied/Approved checkboxes, and a how-to-use flow. Companion to AFFILIATE_PROGRAMS.md. Koala deliberately excluded (shut down after the Cursor acquisition).

**2. 20 unlisted tool landing pages.** Added 20 entries to [src/data/tools.ts](src/data/tools.ts) (Instantly, AiSDR, RB2B, Warmly, Relevance AI, Pabbly, Lusha, Synthflow, Surfer, Cal.com, Lindy, Reply.io, KrispCall, Laxis, Close, Nutshell, GetResponse, AdCreative.ai, Motion, Brevo) + matching `/go/<slug>` entries in [src/data/affiliate-links.ts](src/data/affiliate-links.ts) (`status: 'pending'`, homepage+UTM fallback until approved). Each hub renders a substantive page: bestFor line + 2-paragraph positioning body + 3 FAQs + CTA, and emits **FAQPage JSON-LD**.

**3. New `listed` flag (load-bearing for clean rollout).** Extended the `Tool` model with `listed?: boolean` (+ `bestFor`, `body`, `faqs`). [tools.astro](src/pages/tools.astro) grid and [index.astro](src/pages/index.astro) homepage logo strip now filter `listed !== false`, so the 20 pipeline tools generate indexable `/tools/<slug>` pages (in the sitemap) but stay OFF the homepage/grid until each has an approved affiliate link or a published article. Also added Close/Motion/Warmly/Instantly to the `AMBIGUOUS` set in tools.ts (common words; require tag/title or >=2 body hits to count as a "mention").

**Verification:** `npm run build` clean at **93 HTML pages** (was ~53; +20 hubs +20 redirects). Sitemap includes the new `/tools/*` hubs and zero `/go/*`. Spot-checked `/tools/aisdr`: bestFor + body + FAQ JSON-LD render, CTA routes to `/go/aisdr`, and it is absent from `dist/index.html` + `dist/tools/index.html` (unlisted confirmed). Zero em/en dashes in the new content (pre-existing dashes in code comments left alone).

**To activate a tool later:** paste the approved link into affiliate-links.ts (`url` + `status: 'live'`), then set `listed: true` + add a `/brand/tools/<slug>` logo in tools.ts so it joins the homepage strip + /tools grid.

**Revert path:** all additive (data + one template + two filters + one doc), no schema/route changes. `git revert <sha>` removes the 20 pages cleanly.

---

## Quick reference — recent additions (Session 16, 2026-06-01)

Closed out the remaining open items after the Session 14 + 15 design refresh went live. Ian had already linked GA4 to Search Console; Beehiiv template import stays **paused** (no subscribers yet, his call). Four areas, all on `master` working tree:

**1. Engine updated for the new LIGHT content format (the deferred Session-15 fast-follow).** [n8n/blog-post-engine.json](n8n/blog-post-engine.json) was still drawing in-post SVG diagrams in the old dark indigo/navy palette, so the next engine-generated post would have re-emitted indigo-on-cream. Three coordinated edits:
- **Generate Draft prompt** — added a `DIAGRAM COLORS` rule right after the SVG syntax rule: draw for a LIGHT cream background, box fills white `#ffffff` or pale teal `#e6fbf6`, lines/emphasis teal `#14a890`/`#0d8c78`, text ink `#262b32`, faint connectors `#cdc7b3`, no indigo `#6366f1`/slate/navy, keep semantic accents (sky/green/amber/orange/red/pink) for decision-tree meaning only. No backticks in the added text (the prompt is a JS template literal, per `feedback_no_backticks_in_template_literal_prompts`).
- **Humanize prompt** — added a `DIAGRAM COLORS verify` line (swap any indigo/navy/white-text diagram colors to the light palette; keep semantic accents).
- **`sanitizeMdx()` (Parse Draft code node)** — added a deterministic `colorFixes` remap (16 mappings: indigo shades to teal, navy/slate to ink `#262b32`, pale-indigo tints to `#e6fbf6`, slate surfaces to cream `#f6f4ec`, `#aaa`/`#aaaaaa` to `#cdc7b3`), case-insensitive. **This is the load-bearing change** (same sanitizer-over-prompt pattern as the kebab-case + dash fixes; prompt rules drift, the regex pass makes dark diagrams unshippable). No cascading (no replacement value matches another pattern).

**Verification:** `JSON.parse` clean; all 13 `={{ }}` expression bodies parse-checked via `new Function` (incl. Generate Draft + Humanize) plus the Parse Draft jsCode node; functional test of `sanitizeMdx()` confirmed `#6366f1` to `#14a890`, `#0F172A` to `#262b32` (uppercase), `#1e293b` to `#262b32`, `#aaa` to `#cdc7b3`, em dash to comma on a sample SVG. **n8n re-import required** (re-import `blog-post-engine.json` into n8n Cloud; no new credentials).

**2. GA4 verified live.** Fetched production HTML: the real `gtag/js?id=G-RKWHJ95P3H` loader is served (alongside PostHog), gated to non-localhost. Combined with Ian's GSC link, the GA4 follow-up is closed. (Only the GA4 Realtime dashboard eyeball is left to Ian, but the snippet is provably deployed.)

**3. DEPLOYMENT.md merge SHA filled.** The Session 14 + 15 design-refresh row was `_pending merge_`; filled in merge SHA **`7d03d0d`** (Session-15 commit `11d6cf7`; outreach-post recolor `f51dc09` is a separate revert), revert path `git revert -m 1 7d03d0d`.

**4. apple-touch-icon.png regenerated.** The old `public/apple-touch-icon.png` was a stale 258-byte placeholder from 2026-05-03 (pre-brand-refresh). Rasterized a new 180x180 full-bleed icon from the brand orbital mark (teal `#1ec3a4` on the `#0d1117` dark tile, matching [favicon.svg](public/favicon.svg)) via `sharp`. Full-bleed (no transparency/rounded corners since Apple applies its own mask).

**Revert paths:**
- Engine changes unwanted: revert this session's commit, then re-import the prior `blog-post-engine.json` from git into n8n Cloud. The diagram colors also just stop being remapped, no breakage.
- apple-touch-icon / DEPLOYMENT.md unwanted: revert the same commit (markup/asset/docs only).

**Still open / NOT done:** import the two Beehiiv templates (**paused** by Ian, no subs yet); GA4 Realtime eyeball (Ian, optional). Google Indexing API stays intentionally parked (Session 13).

---

## Quick reference — recent additions (Session 15, 2026-06-01)

Homepage/tools/blog redesign + analytics + the deferred SVG recolor, built on **`design-refresh-brand-kit-v2`** (continues Session 14's work) and **merged to `master` + pushed LIVE this session** (Session-15 commit `11d6cf7`, merge commit `7d03d0d`; the whole Session 14 + 15 design refresh is now on prod). Five areas:

**1. Homepage rebuilt ([src/pages/index.astro](src/pages/index.astro)) into a "legit June-2026" layout.** New H1 **"The RevOps & GTM automation playbook."** (replaces "Automate the grind. Ship more pipeline." — Ian wanted broader-than-pipeline RevOps/GTM positioning). Hero is now a **split** (`.hero--split`): left = eyebrow + H1 + subhead + two CTAs; right = a hand-authored inline workflow-node SVG (light tokens, `aria-hidden`, kebab-case). The **"Published by Homegrown Growth Co" hero line was deleted** (Ian didn't want it on the homepage) — the footer in BaseLayout.astro already carries it, so it's just removed from the hero. New **"Tools we cover" full-color logo strip** + a **"Browse by topic" tile grid** (tiles deep-link to `/blog?tag=<tag>`). Removed the 4 hardcoded "Affiliate partners" Featured-Tools cards (Ian: highlight tools, not "affiliate partners"). New CSS in [global.css](src/styles/global.css): `.hero--split/.hero-split/.hero-visual`, `.logo-strip*`, `.topic-tiles/.topic-tile`.

**2. Tool logos added (were never present).** Full-color brand logos in **`public/brand/tools/`** for all 9 tools: make/n8n/hubspot/apollo/kit (SVG, from Simple Icons / svgl / vectorlogo.zone) and pipedrive (SVG) / clay / smartlead / beehiiv (Ian supplied the latter four mid-session: pipedrive.svg from Wikimedia, clay.webp + smartlead.webp + beehiiv.png — all full-color, transparent). The `logo?` field in [src/data/tools.ts](src/data/tools.ts) points at each; the `.logo-strip-wordmark` / `.tool-card-logo-text` text fallback stays in the CSS for any future tool added without a logo. **Kit was added as a real tool** in tools.ts (Newsletter Platform) — this creates `/tools/kit`, so the build is now **52 pages** (was 51). Note the mix of icon-only marks (make/n8n/hubspot/apollo/kit) and full wordmark lockups (pipedrive/clay/smartlead/beehiiv) in the strip — inherent to using real brand assets, looks fine.

**3. Tools page card alignment fixed ([tools.astro](src/pages/tools.astro) + global.css).** Root cause of the ragged cards: `.tool-card` had no `height` and the actions row used `align-self:flex-start` with no `margin-top:auto`. Fix: `.tool-card { height:100% }` + `.tool-card-actions { margin-top:auto; min-height:2.4rem }` so badges/blurbs/CTAs/article-links line up across each category row. Added a fixed-height logo slot at the top of each card.

**4. Blog page: working tag filter + search ([src/pages/blog/index.astro](src/pages/blog/index.astro)).** The tag pills are now real filter buttons (vanilla `is:inline` IIFE: toggles `.post-card[hidden]`, syncs `?tag=` via `replaceState`, `aria-live` count, "All" reset, empty state). **Two bugs caught in screenshot QA and fixed:** (a) tags in frontmatter are inconsistently cased (`HubSpot` vs `hubspot`, `Automation` vs `automation`) — the filter + homepage tiles now **normalize tags to lowercase** so case-variants collapse into one pill and `?tag=` matches; (b) `[hidden]`'s UA `display:none` lost to `.post-card { display:flex }`, so added `.post-card[hidden] { display:none }`. Also added a blog search box reusing the `.nav-search` pattern → routes to the existing Pagefind `/search` (no second index). Pills styled via `.tag--filter` (mono, lowercase, teal-solid when `aria-pressed`).

**5. Analytics — PostHog documented + GA4 added (live).** PostHog was already fully live (pageviews, autocapture, `affiliate_click`). Added **GA4** alongside it in [src/components/Analytics.astro](src/components/Analytics.astro): measurement id **`G-RKWHJ95P3H`** (Ian's, hardcoded as the default the same way the PostHog key is; `PUBLIC_GA4_ID` env var overrides per-environment), sharing PostHog's localhost gate, fires on non-localhost. CSP in [public/_headers](public/_headers) extended for `googletagmanager.com` + `*.google-analytics.com` + `*.analytics.google.com`. New **[ANALYTICS.md](ANALYTICS.md)** documents what each tool captures, the dashboards/funnels to build, and GA4 verification + GSC-link follow-up.

**6. SVG diagram recolor (the deferred Session-14 item).** All 11 in-post diagrams were drawn for the old dark theme (indigo `#6366f1` + slate + navy + white text). Deterministic color+contrast pass: indigo→brand teal (`#14a890`/`#0d8c78`), navy `#0f172a`/`#1e293b`→ink `#262b32`, light-indigo tints→`#e6fbf6`, white-on-light-tint flipped to ink, too-faint `#aaa` connectors→`#cdc7b3`; semantic accents (sky/green/amber/orange/red/pink for decision-tree meaning) deliberately KEPT. Verified by screenshotting every diagram (Playwright element shots) — all on-brand and readable. One geometry fix: widened the start node in the salesforce post so "Already on Salesforce?" stops overflowing its pill. `.my-take` amber also repointed from hardcoded `#f59e0b` to `var(--accent-amber)`. **A 12th post** (`2026-05-28-outreach-alternatives`) landed on master via the engine just before the merge and still had indigo/navy, so it got the same map in a follow-up direct-to-master commit `f51dc09` (`#6366f1`→`#14a890`, `#1e293b`→`#262b32`, `#e2e8f0`→`#f6f4ec`) so the live site is fully consistent.

**Verification:** `npm run build` clean at **52 pages**, Pagefind reindexed 41. Zero stale indigo/navy in compiled `dist/blog/` HTML. Zero em/en dashes in any authored/changed file. Blog filter confirmed (e.g. `/blog?tag=hubspot` → 1 card, count + active pill correct). Homepage/tools/blog eyeballed at desktop 1280 + mobile 390.

**NOT yet done / actions required of Ian:**
1. **Verify GA4 after deploy** (GA4 Realtime should show your visit; Network shows `gtag/js?id=G-RKWHJ95P3H`) and **link the GA4 property to Search Console** (GA4 → Admin → Product links). See ANALYTICS.md.
2. **Engine still emits dark/indigo SVGs.** The n8n `blog-post-engine.json` Generate Draft prompt draws diagrams in the OLD indigo/slate palette, so the next engine-generated post will re-emit indigo-on-cream. **Fast-follow (separate PR + n8n re-import):** update the engine's diagram-color instructions to the teal/ink/semantic light palette and ideally fold the color map into `sanitizeMdx()`. Deliberately NOT on this branch.
3. Carry-over from Session 14 (unchanged): review the Netlify deploy preview, fill the merge SHA into DEPLOYMENT.md after merge, import the two Beehiiv templates (manual), optional apple-touch-icon regen.

**Revert path:** all changes are markup/CSS/asset/content + one analytics component + CSP + two docs (no schema/route/workflow changes beyond the +1 Kit tool hub). Now live on master. Revert the whole Session 14 + 15 refresh with **`git revert -m 1 7d03d0d`** (the merge commit); the outreach-post recolor is a separate revert (`git revert f51dc09`). `master` build was green at 53 pages post-merge.

---

## Quick reference — recent additions (Session 14, 2026-05-29)

Design refresh session — applied a Claude Design "Brand Kit v2.2" to the site. Source kit shipped as `The Automations Guide Website.zip` (left untracked in the repo root — not committed). Work is on branch **`design-refresh-brand-kit-v2`** (off `origin/master` `a61ea6c`), to ship as a PR so Netlify builds a deploy preview.

**What the kit changes (more than a recolor):** teal shifts `#2dd4bf` → `#1ec3a4` (dark-mode accent) / `#14a890` (core brand); headlines (H1/H2, hero, page headers, pull-quotes) move to the serif **Source Serif 4** (600); body/UI → **Inter**; eyebrows/tags/labels/code → **JetBrains Mono**; wordmark → **Outfit**. Site stays dark-only (the kit's light-mode block is for newsletters and was intentionally not added).

**Token strategy — revalue + augment, NOT rename (load-bearing).** The kit's token names (`--accent-strong`, `--r-md`, `--font-sans`, `--ink-*`, `--tag-teal-*`) don't match the site's existing names (`--accent-dim`, `--accent-glow`, `--radius`, `--font`). The kit README's "paste `:root`, delete old block" would have broken ~every rule. Instead, in [src/styles/global.css](src/styles/global.css): pasted the kit's foundation scales (`--tag-teal-*`, `--ink-*`, semantic accents, `--font-sans/serif/display`) at the top of `:root`, then re-pointed every existing site-token alias at the foundation. Key remaps: `--accent`→`var(--tag-teal-400)`, `--accent-dim`→`var(--tag-teal-600)`, `--accent-glow`→`rgba(30,195,164,.10)`, new `--accent-hover`→`var(--tag-teal-300)` (replaces the old hardcoded `#5eead4` in `.btn--primary:hover` + `.prose a:hover`), `--font`→`var(--font-sans)`, `--font-mono`→JetBrains Mono. `--bg/--text/--border/...` unchanged (kit dark values are identical).

**Typography applied** via a "Brand typography" block appended late in global.css (wins on source order over the earlier per-section `font-weight:800` rules): serif on `.hero h1, .prose h1, .prose h2, .post-header h1, .about-hero h1, .page-header h1, .tools-hero h1, .section-heading, .pull-quote-body` (H3/H4 stay Inter); JetBrains Mono on `.hero-eyebrow, .tag, .section-label, .email-signup-eyebrow, .my-take-eyebrow, .step-card-number, .stat-card-label, .tool-badge, .post-related-tags-label, .footer-col-label`.

**Fonts loaded** in [src/layouts/BaseLayout.astro](src/layouts/BaseLayout.astro) `<head>` (site previously had zero web fonts): preconnect + one Google Fonts `css2` link (Inter 400-700, Source Serif 4 600, JetBrains Mono 400-700, Outfit 500/800, `display=swap`). **CSP in [public/_headers](public/_headers)** extended: `style-src` += `https://fonts.googleapis.com`, `font-src` += `https://fonts.gstatic.com` (otherwise the fonts would be blocked).

**Wordmark** restyled (not swapped to `<img>` — the kit's logo SVGs are `<text font-family="Outfit">`, which doesn't embed fonts and falls back to system sans as an image). `.nav-logo` now uses `var(--font-display)` (Outfit); "The"/"Guide" quiet (weight 500, muted), "Automations" dominant (weight 800). Kept "Automations" **teal** rather than the kit's white-word + teal-period lockup — flagged to Ian as a follow-up choice if he wants exact kit fidelity. Both nav + footer reuse `.nav-logo`, so the change flows to both.

**Favicon** [public/favicon.svg](public/favicon.svg): recolored its four teal fills `#2dd4bf`→`#1ec3a4`, kept the legible abstract orbital mark (the kit's wordmark favicon is illegible at 16px — Ian's choice). The `[tool].astro` redirect page (self-contained doc, no global.css) hardcoded teal updated to literal `#1ec3a4`. `ComparisonTable.astro` pros-marker `#2dd4bf`→`var(--accent)`.

**New committed assets:** `public/brand/` (kit logo + avatar SVGs, already on new teal — for future og-image/social/external use); `brand-kit/` (full kit as source-of-truth: tokens.css, design-system.html, logos, avatars, Beehiiv + newsletter HTML, social graphics); [NEWSLETTER.md](NEWSLETTER.md) (points at the staged Beehiiv templates + frames the **manual Beehiiv import as an action for Ian** — templates can't be created from the repo).

**Verification:** `npm run build` clean (32 pages, Pagefind indexed 32). Confirmed in `dist/`: font `css2` link present on homepage, new teal in compiled CSS, zero stale `#2dd4bf` in compiled CSS. Playwright screenshots (home / blog / tools / about / post at mobile 375 + desktop 1280) eyeballed: serif headlines, mono teal eyebrows/tags/badges, Outfit wordmark, new teal, responsive layouts all correct.

**Action required of Ian:** (1) Open the PR's Netlify deploy preview and review desktop + mobile. (2) After merge, fill the merge SHA into the DEPLOYMENT.md row. (3) Manually import the two Beehiiv templates per [NEWSLETTER.md](NEWSLETTER.md) (Beehiiv UI, ~10 min). (4) Optional decisions: switch the wordmark to the kit's white-Automations + teal-period lockup; regenerate `apple-touch-icon.png`; align `.my-take` amber to the kit's `--accent-amber`.

**Revert path:** all changes are CSS/asset/docs only (no content, schema, data, or workflow changes) — fully safe to revert. After merge: `git revert -m 1 <merge-sha>`.

### Same-session follow-up — light-mode pivot, exact wordmark, tool hub pages, mobile polish (still on `design-refresh-brand-kit-v2`, pre-merge)

After reviewing the dark refresh, Ian asked for four changes (same PR branch, second commit):

1. **Flipped the whole site to the kit's LIGHT mode (warm cream).** This SUPERSEDES the "site stays dark-only" note above. In [src/styles/global.css](src/styles/global.css) the `:root` aliases now hold the kit light palette: `--bg #fdfcf8`, `--bg-secondary #f6f4ec`, `--bg-card #ffffff`, `--border #e5e1d4`, `--text #262b32`, `--text-muted #5e6671`, `--accent var(--tag-teal-500)` (#14a890), `--accent-dim` teal-600, `--accent-hover` teal-700 (darker on hover for light bg), `--accent-glow var(--tag-teal-50)`, new `--accent-contrast #ffffff` (text on teal buttons), `--nav-bg rgba(253,252,248,.85)`, and light `--shadow-sm/md/lg`. Hardcoded dark values fixed: `.site-nav` bg → `--nav-bg`; `.btn--primary` text → `--accent-contrast`; `.post-card`/`.tool-card`/mobile-drawer shadows → `--shadow-lg`; `theme-color` meta → `#fdfcf8`; `go/[tool].astro` redirect page → cream/ink/teal-500. NOT a toggle — light is the only mode now. (SVG diagram colors in old `.mdx` posts were tuned for dark bg and may have weak contrast on cream — left as a content follow-up, not touched.)
2. **Wordmark now exact kit match.** `.nav-logo` markup changed to `The <span class="logo-word">Automations<span class="logo-dot">.</span></span> Guide` (nav + footer). `.logo-word` = `--text` ink 800, `.logo-dot` = `--accent-dim` teal-600 (kit's light-mode period color). "Automations" is no longer teal; it's ink with a teal period, matching `wordmark-primary.svg`.
3. **Rich tool hub pages.** New [src/data/tools.ts](src/data/tools.ts) (tool registry: slug/name/category/badge/blurb/cta/aliases + `postMentionsTool()` matcher — tags + title + body, case-insensitive for distinctive names, case-sensitive ≥2 hits for ambiguous ones like Make/Clay to avoid false positives). New [src/pages/tools/[tool].astro](src/pages/tools/[tool].astro) generates `/tools/<slug>` for all 8 tools: category eyebrow + serif H1 + blurb + `/go/<slug>` CTA + badge + "N articles mentioning X" card grid. [src/pages/tools.astro](src/pages/tools.astro) refactored to render from `tools.ts` (no more hardcoded cards); each tool name links to its hub, plus a "N articles →" link. Article counts at build: make 12, n8n 14, hubspot 19, pipedrive 6, clay 12, apollo 15, smartlead 9, beehiiv 1 (of 23 posts — sensible spread, hubspot-as-central-CRM checks out). These `/tools/*` pages are indexable (sitemap filter only drops `/go/*` + utility paths). Cleaned em dashes from the carried-over blurbs per the no-em-dash rule.
4. **Mobile polish.** Extended the `@media (max-width:640px)` block: reduced padding on `.tools-hero`/`.about-hero`/`.page-header`/`.post-header`/`.hero`/`.section` (desktop heroes left large empty gaps on phones); left-aligned `.hero p`/`.tools-hero p` (long centered intro copy read ragged on a narrow column); eased `.hero h1` clamp. No horizontal overflow on any page before or after.

**Verification (second commit):** `npm run build` clean (51 pages incl. 8 new tool hubs). Playwright screenshots at desktop 1280 + mobile 390 across home / tools / a tool hub / a post / about — light cream theme, exact wordmark, hub pages, and tightened mobile all confirmed correct.

**Still TODO for Ian (unchanged + new):** the original list above, plus note the site is now LIGHT not dark. Known content follow-up: recolor the in-post SVG diagrams for the light background (they were drawn for dark). The homepage hero + some old posts still contain em dashes in body copy (pre-existing content, not touched in this design pass).

---

## Quick reference — recent additions (Session 13, 2026-05-22)

One-shot session triaging a GSC indexing question — Ian saw 6 pages indexed and 16 not indexed and asked whether something was wrong. Diagnosis: the deployed sitemap at [sitemap-0.xml](https://theautomationsguide.com/sitemap-0.xml) had **39 URLs**, but **15 of them were pages explicitly marked `noindex`** (4 utility pages — `/privacy/`, `/terms/`, `/disclosure/`, `/search/` — plus the 11 `/go/<tool>/` affiliate redirects). Sitemap inclusion + page-level noindex is a self-contradicting signal — GSC buckets these as "Excluded by 'noindex' tag" in the "Why pages aren't indexed" view, inflating the "not indexed" count without any actual quality/crawl issue.

**Fix shape (commit `e09acdc`, direct to master).** Two coordinated edits in one commit:

1. **[astro.config.mjs](astro.config.mjs)** — added a `sitemap({ filter })` predicate that drops `/go/*` and the four utility paths. Sitemap now ships **24 URLs** (homepage, `/about/`, `/blog/`, `/tools/`, 20 posts) — exactly what should be indexable.
2. **[src/layouts/BaseLayout.astro](src/layouts/BaseLayout.astro)** — added a `noindex?: boolean` prop. When true, emits a single `<meta name="robots" content="noindex, follow">`; otherwise emits the full `index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1` directive. Previously, the four utility pages were stacking two conflicting `<meta name="robots">` tags (BaseLayout said `index, follow`, the page slot added a second `noindex, follow`). Functionally OK (Google takes most restrictive) but sloppy. [privacy.astro](src/pages/privacy.astro), [terms.astro](src/pages/terms.astro), [disclosure.astro](src/pages/disclosure.astro), [search.astro](src/pages/search.astro) now pass `noindex={true}` instead of injecting via `<Fragment slot="head">`.

[404.astro](src/pages/404.astro) was left untouched — uses `noindex, nofollow` (different directive set) and isn't in the sitemap anyway, so the cleanup doesn't affect it.

**Local verification.** `npm run build` succeeded — 34 pages built, Pagefind indexed 29, generated `dist/sitemap-0.xml` confirmed at 24 URLs (all 15 previously-listed noindex URLs absent). Spot-checked `dist/privacy/index.html` for exactly one robots meta (✓ `noindex, follow`), and `dist/index.html` + `dist/about/index.html` + `dist/blog/index.html` for the full index directive (✓).

**`/go/<tool>` pages don't use BaseLayout** — they have their own minimal HTML doc (meta refresh + PostHog `affiliate_click` capture). The sitemap filter handles them; no template change needed there.

**Pre-push check.** `git fetch origin && git log --oneline HEAD..origin/master` confirmed no engine auto-merges landed mid-session (3 new content branches discovered — `2026-05-21-kit-vs-substack-vs-beehiiv`, `2026-05-21-migrate-substack-to-kit`, `2026-05-22-best-mailchimp-alternatives` — none merged yet, so no rebase needed before the push).

**Action required of Ian after this session:**

1. **Wait ~90s for Netlify to deploy `e09acdc`.** No site behavior changes; the sitemap will reflect the new URL set on next Google crawl.
2. **In GSC → Pages → "Why pages aren't indexed":** confirm the bucket reasons. If you see "Excluded by 'noindex' tag" with ~15 URLs, that's the population this fix addresses — click **Validate Fix** to ask Google to reprocess. If you also see "Crawled - currently not indexed" on real blog posts, that's a different (content-quality / new-domain-trust) problem and is not solved here.
3. **Re-submit the sitemap in GSC** (Sitemaps → enter `sitemap-index.xml`) to nudge Google to pick up the trimmed set faster. Optional — it's already pinged via [public/robots.txt:32](public/robots.txt#L32).
4. **Expect the "Not indexed" count to drop within 1-2 weeks** as Google reprocesses. Indexed count should stay flat or grow as the real blog posts get crawled.

**Revert paths** (also captured in DEPLOYMENT.md):
- Both edits unwanted: `git revert e09acdc` — restores the 39-URL sitemap and the double robots meta tag pattern.
- Both edits are non-destructive (no content/data changes, no schema changes) and safe to revert at any time.

### Same-session follow-up — IndexNow + Google Indexing API submit (commit `805cb28`)

After deploying the sitemap fix, Ian asked what process exists for telling search engines about new posts. None did — the post-merge n8n workflow only updated Notion + pinged Slack. So `notion-publish-status.json` got extended to also hit two search-engine indexing APIs:

**IndexNow (Bing / Yandex / DuckDuckGo / Naver / Seznam) — live + working.** Random 32-char hex key `dde35cca97309131104c0505957f0948` committed to [public/dde35cca97309131104c0505957f0948.txt](public/dde35cca97309131104c0505957f0948.txt) (Astro auto-copies to `dist/` root → served at `https://theautomationsguide.com/dde35cca97309131104c0505957f0948.txt`). Key is public-by-design per IndexNow protocol — the file is the ownership proof, not a secret. New "IndexNow Submit" HTTP node POSTs `{host, key, keyLocation, urlList: [postUrl]}` to `api.indexnow.org/indexnow` after Slack Notify.

**Google Indexing API — wired but opt-in.** Added 4 nodes after IndexNow: "Google Indexing Enabled?" code gate (short-circuits with `return []` if `googleServiceAccountJson` is empty in the Config node — current default), "Build Google JWT" code node (signs RS256 JWT with Node's built-in `crypto` module — no external dependencies), "Get Google Access Token" HTTP POST to `oauth2.googleapis.com/token` with the JWT, "Google Indexing Submit" HTTP POST to `indexing.googleapis.com/v3/urlNotifications:publish` with `{url: postUrl, type: 'URL_UPDATED'}`. Both HTTP calls use `neverError:true` so a 4xx/5xx can't fail the workflow (Notion + Slack steps already happened). Officially the API is gated to JobPosting + BroadcastEvent schemas but accepts blog URLs in practice — quotas are ~200 calls/day per project, well above the engine's ~1/day output rate. Setup steps (GCP project + Indexing API enable + service account + JSON key + GSC Owner grant + paste JSON into Config node) documented in [n8n/README.md](n8n/README.md) Workflow 5 section.

**Filter Eligible also got a slug-extraction extension.** Pulls `slug = headRef.replace(/^content\//, '')` and builds `postUrl = https://${siteHost}/blog/${slug}/`. Slack message now references `postUrl` instead of bare domain. Same slug feeds both indexing APIs.

**n8n re-import required.** Workflow JSON shipped as v2 (`versionId: "2"`); Ian needs to re-import `notion-publish-status.json` into n8n Cloud to pick up the 12 nodes (was 7). No new credentials needed for the IndexNow branch — IndexNow is auth-free. The Notion HTTP nodes still use the existing `Notion Integration Token` credential.

**Action required of Ian** (this paragraph is the consolidated post-deploy todo — completion status as of 2026-05-22 PM):
1. ✅ **Re-import [n8n/notion-publish-status.json](n8n/notion-publish-status.json)** into n8n Cloud — DONE 2026-05-22. The webhook URL stays the same; GitHub repo webhook does NOT need to be reconfigured.
2. ✅ **Wait for Netlify to publish `805cb28`** — DONE 2026-05-22. IndexNow key file curl'd at `https://theautomationsguide.com/dde35cca97309131104c0505957f0948.txt` returns the expected 32-char hex; sitemap re-checked at 25 URLs with zero noindex paths leaking.
3. ✅ **In GSC → Pages → "Why pages aren't indexed":** click "Validate Fix" — DONE 2026-05-22.
4. ✅ **Re-submit the sitemap in GSC:** `sitemap-index.xml` — DONE 2026-05-22.
5. ⏳ **For the 16 currently-stuck unindexed URLs:** in GSC → URL Inspection → "Request Indexing". **IN PROGRESS** — Ian splitting across days due to ~10/day GSC soft cap; will be done by 2026-05-23 Saturday.
6. ⏸️ **(Deferred 2026-05-22) Wire the Google Indexing API:** Ian chose to leave `googleServiceAccountJson` blank in the n8n Config node. Rationale: IndexNow alone covers Bing/Yandex/DuckDuckGo/Naver/Seznam; Google still reads the (now trimmed) sitemap and gets natural-crawl signal from there; manual GSC "Request Indexing" handles the rare case where a specific post needs faster Google indexing. The Indexing API is also technically off-label for blog posts (officially gated to JobPosting + BroadcastEvent schemas). Revisit if post velocity goes up or Google indexing latency becomes a measured bottleneck — re-enabling is a paste-JSON-into-Config-node operation, no code change needed.

**Revert paths** (also captured in DEPLOYMENT.md):
- IndexNow + Google Indexing API additions unwanted: `git revert 805cb28`, then re-import the pre-805cb28 workflow JSON from `git show 2a84738:n8n/notion-publish-status.json` into n8n Cloud.
- Just the Google Indexing branch unwanted: leave `googleServiceAccountJson` empty in n8n Config node — the gate node will continue to short-circuit it.
- Just the IndexNow ping unwanted: pause the *IndexNow Submit* node in n8n. The `dde35cca97309131104c0505957f0948.txt` file can stay or be deleted (no-op either way once n8n isn't pinging IndexNow).

---

# Session Log — last updated 2026-05-13

## Recovery Notes (2026-05-05 machine wipe)

This project survived the **2026-05-04** complete machine wipe.

**Preserved:**
- Full git history on GitHub (`homegrowngrowthco/theautomationsguide`, branch `master`). Last commit: 2026-05-05 "Update local paths to new OneDrive location" (the path migration).
- Live production site at theautomationsguide.com (Netlify auto-deploys from `master`).
- All n8n Cloud workflows (`blog-post-engine` v3, `topic-suggestor`, `daily-briefing`) — JSONs in `n8n/` plus live versions in n8n Cloud.
- Notion DBs (Content Calendar `62f34586-4f78-4b83-b2ac-105f500d059e`, Drafts `7399699b-ef9d-4ef4-8c2c-4749f99b5b76`).
- Beehiiv newsletter integration (form ID `d41efc59-7041-482b-8178-6d238e6c3cfa`).
- All 5 published posts in `src/content/blog/`.
- `.claude/settings.json` (project allowlist) — committed to repo.
- Existing `AFFILIATE_PROGRAMS.md`, `OFF_SITE_SEO_CHECKLIST.md`.

**Lost:**
- Local `.claude/settings.local.json` overrides.
- Local Claude Code session history.

**Followup needed:**
- Rotate keys used in n8n credentials (Anthropic, GitHub PAT with `repo` scope, Notion Integration Token). After rotation, update the n8n Cloud credentials with the same names.
- No redeploy needed — Netlify auto-deploys from `master`, the repo is unchanged.
- `.gitignore` updated 2026-05-05 to add `.claude/file-history/` to the existing `.claude/settings.local.json` ignore.

---

## Quick reference — recent additions (Session 12, 2026-05-20)

One-shot session to claim Kit's $25 partner promo for mentioning their new MCP server in an existing article. Picked [2026-05-11-kit-n8n-4-newsletter-automations-every-operator-should-set-u.mdx](src/content/blog/2026-05-11-kit-n8n-4-newsletter-automations-every-operator-should-set-u.mdx) as the host — most Kit-centric recent post, MCP framing flows naturally from "programmatic Kit access via n8n" into "programmatic Kit access via AI agents."

**Edit shape (commit `88033dc`, direct to master).** New `## One more thing: Kit just shipped an MCP server` section inserted between the closing MyTake and the "Ship these before you touch anything else" wrap-up. Three paragraphs: (1) frames MCP as letting Claude/Cursor agents read+write subscribers/tags/broadcasts/sequences/forms directly, collapsing ad-hoc investigation work out of n8n; (2) positions it as on-demand complement to n8n's scheduled/event-driven layer with a concrete example (using the MCP to validate Automation 3's 60-day churn threshold against real list data before committing the workflow logic); (3) bolded `[partners.kit.com/theautomationsguide](https://partners.kit.com/theautomationsguide)` CTA + 5-minute setup note (API key → config file → restart). Same edit cleaned 2 em dashes in the existing MyTake (pre-engine-v5 grandfathered AI slop, replaced with commas per [`feedback_no_em_dashes.md`](../.claude/memory/...)). Other grandfathered em dashes elsewhere in the post left alone to keep the diff minimal — engine v5's `sanitizeMdx()` covers this class going forward but doesn't backfill.

**Branded partner slug vs registry slug — deliberate divergence.** The new partner URL `partners.kit.com/theautomationsguide` is a branded slug PartnerStack issued separately from the original `partners.kit.com/nt9zrjmnck9y` ID that's wired into [src/data/affiliate-links.ts](src/data/affiliate-links.ts) `kit.url`. I left the registry on the old slug. The article uses the new branded slug as a direct URL (visibility for Kit's verification team), `/go/kit` still routes to the original slug for tracking continuity. If PartnerStack confirms both resolve to the same payout account, the swap is a one-line edit + commit; flagged as optional in STATUS.md.

**Push required a mid-session rebase.** First `git push origin master` rejected because the engine had auto-merged 3 content PRs while we were editing: PR #30 (Lemlist vs Apollo for B2B Outbound 2026, merge `d9f39e7`), PR #31 (Why RevOps Teams Are Abandoning Outreach in 2026, merge `8123322`), PR #32 (B2B Lead Enrichment Without Clay: The Lean Stack, merge `a3c4db0`). All three received `[qa-fix-1]` from the QA auto-fix bot and auto-merged green via the daily auto-merge GHA. `git pull --rebase origin master` was clean (single-content-file change didn't intersect any of the auto-merged content files) and re-push succeeded. Engine is operating normally on the v5 + Session 10 hotfix baseline across these 3 additional runs — neither Session 10 bug recurred. Matches the rebase pattern from Session 11 (mid-session `ccb0d8a` PR #29 merge). Sufficient signal at this point to add a CLAUDE.md note that engine auto-merges can land any time during a session and a pre-push `git fetch origin && git log --oneline HEAD..origin/master` is cheap insurance — captured in the `log-status` skill but worth restating here.

**DEPLOYMENT.md log entry (commit `fee7e07`, direct to master).** Added row at top of Part 5 Recent deployments reference: `\| 2026-05-20 \| direct \| 88033dc \| Add Kit MCP section to Kit + n8n post (Kit partner promo) \| git revert 88033dc \|`. Pure documentation, no site impact.

**Live URL submitted to Kit:** `https://theautomationsguide.com/blog/2026-05-11-kit-n8n-4-newsletter-automations-every-operator-should-set-u/`. MCP section is second-to-last block in the rendered article; partner link is bolded in the third paragraph of that section.

**Revert paths** (also captured in DEPLOYMENT.md table further down):
- MCP section unwanted: `git revert 88033dc` — restores the article to its pre-MCP state. Forfeits the $25 Kit promo eligibility.
- Docs-log entry unwanted: `git revert fee7e07` — drops the DEPLOYMENT.md row, no site impact.
- Both non-destructive; ordering doesn't matter.

**Action required of Ian after this session:** Submit the article URL to Kit for $25 verification (the partner promo confirmation flow). Wait ~90s after the `88033dc` push for Netlify to finish the build before submission. Optional separate decision: swap `affiliate-links.ts` `kit.url` to the branded slug.

---

## Quick reference — recent additions (Session 11, 2026-05-15)

Short triage session against 3 entries in VS Code's Problems panel for this repo + the sibling `homegrown-growthco` repo. Two fixed and verified live; the third (a GHA secret-context lint on [.github/workflows/qa-content-pr.yml](.github/workflows/qa-content-pr.yml)) is a false-positive — the `SLACK_WEBHOOK_URL` repo secret is configured and used elsewhere in the same workflow, the GitHub Actions VS Code extension just can't introspect repo secrets — left as-is.

**Engine output validated end-to-end since Session 10's hotfixes (observed, no new work).** Three scheduled engine runs after Session 10 shipped clean PRs: PR #27 (Gong vs Outreach vs Salesloft, merged 2026-05-14, commit `c054de5`), PR #28 (Automated Reactivation Sequence with Apollo + HubSpot, merged 2026-05-14, commit `a3a353c`), and PR #29 (Clay vs Zapier for B2B Lead Enrichment Workflows, merged 2026-05-15, commit `ccb0d8a` — landed mid-session while pushing this CLAUDE.md update, prompted a second rebase). All three went through QA auto-fix (PR #27: `[qa-fix-1]`; PR #28: `[qa-fix-1]` + `[qa-fix-2]`; PR #29: `[qa-fix-1]`) and merged green via the daily auto-merge GHA. Session 10's bug 1 (backtick fix in Generate Draft prompt) + bug 2 (resilient social-output parser) both held across all 3 runs — neither failure recurred. The engine is operating normally on the v5 + Session 10 baseline.

**tsconfig.json fix (commit `ecc68c7`, no PR — direct to master).** Severity-8 VS Code Problems entry was "Option 'baseUrl' is deprecated and will stop functioning in TypeScript 7.0." **Initial fix attempt** — drop the `baseUrl` line entirely, relying on the TS 5.0+ spec that resolves `paths` relative to the tsconfig location — **broke the local test build**. Astro 4.16 / Vite / Rollup still requires `baseUrl` to be set for the `@/*` path alias to resolve at build time, even when the type-system spec doesn't require it. Error surfaced as: `Rollup failed to resolve import "@/components/post/SideBySide.astro"` from one of the 13 affected blog `.mdx` files. **Final fix** (per the TS warning text's own recommendation): restore `baseUrl: "."` AND add `"ignoreDeprecations": "6.0"` to silence the VS Code Problems entry while preserving build behavior. Local `npm run build` succeeded cleanly (34 pages built in 6.84s, pagefind indexed 23 pages) before push. Push initially rejected because of the PRs #27 + #28 auto-merges on master since the last local sync — resolved via `git pull --rebase origin master` (clean rebase, single-line tsconfig change doesn't intersect content `.mdx` files) and re-push. Netlify deploys API confirms `ecc68c7` in `ready` state at 11:48:59Z.

**`netlify/actions/cli@master` archived (sibling repo `homegrown-growth-co`, not this one).** Same VS Code triage caught that the HGC marketing site's deploy workflow was referencing an archived GHA action. Fixed there with a `setup-node` + `netlify-cli@22` install pattern. Calling out here because if the same archived-action pattern shows up anywhere in this repo's GHAs in the future, the fix template is the same: replace `uses: netlify/actions/cli@master` with the 3-step install + run pattern.

**Auto-memory updates** (this session, persisted in `~/.claude/projects/.../memory/`): none. The Vite-still-needs-baseUrl-even-when-TS-doesn't lesson is captured inline here + in `claude_projects/SESSION_FILE_OPS_LOG.md` op #106. Not strong enough as a generalizable rule to warrant its own feedback memory; the pattern (build-time path-alias config can depend on options the type-system spec marks as optional) is too specific to surface as a future-session heuristic.

**Action required of Ian after this session:** None. Both the fix and the engine output are live and healthy. 3 content PRs have shipped via the engine since the Session 10 hotfix baseline: PR #27, PR #28 (both 2026-05-14), and PR #29 (2026-05-15).

**Revert paths** (also captured in DEPLOYMENT.md table further down):
- tsconfig change unwanted: `git revert ecc68c7` — re-surfaces the VS Code TS 6.0 deprecation warning but build still works (the revert removes the `ignoreDeprecations` line, not `baseUrl` itself).

---

## Quick reference — recent additions (Session 10, 2026-05-14)

Hotfix session triggered by the first scheduled blog engine run after the 2026-05-13 v5 re-import. Two latent bugs in the engine surfaced and both got fixed and re-imported. No content PRs this session.

**Bug 1 — Generate Draft "invalid syntax" (commit `fb8da93`, no PR — direct to master).** At 08:00 ET the scheduled run failed at the Generate Draft node with n8n `ExpressionExtensionError: invalid syntax`. Root cause: commit `2eff8e9` (2026-05-12) added a "use kebab-case for SVG attrs" prompt rule that wrapped attribute names in markdown backticks (`` `text-anchor`, `font-size`, ... ``). The entire prompt is itself a JS template literal in the n8n HTTP body, so the first inner backtick terminated the template literal early and the rest of the prompt parsed as JS, throwing at parse time. Bug was latent in the JSON since 2026-05-12, the n8n Cloud import that picked it up was 2026-05-13 (engine v5), and today's 8am scheduled run was the first one to hit it. **Fix:** replaced the 14 markdown-formatted attribute names with single-quote-wrapped equivalents (`'text-anchor'`, `'font-size'`, ...), semantic instruction to the LLM is identical, no template-literal break. New auto-memory `feedback_no_backticks_in_template_literal_prompts.md` captures the rule + the JSON-parse + `new Function('return ' + expr)()` test-pattern for future-proofing.

**Bug 2 — Parse Social Outputs "missing twitter field" (commit `f0f4dd8`, no PR — direct to master).** After re-importing the Bug 1 fix, the workflow got all the way through Open PR before failing at Parse Social Outputs with `Error: Social outputs missing or empty field: twitter`. Haiku had returned a JSON shape inconsistent with the strict 3-field validator (either named the field `tweet`/`tweets`/`x_thread`, dropped it entirely, or truncated at `max_tokens: 2048`). Two coordinated fixes: **(a)** Generate Social Outputs `max_tokens` bumped 2048 → 4096 for headroom (worst-case extra Haiku output cost ~$0.005 per post). **(b)** Parse Social Outputs rewritten to try common field-name variants (twitter / twitter_thread / tweet / tweets / x / x_thread, analogous for video and linkedin); on still-missing fields, save a diagnostic placeholder to Notion instead of throwing. Placeholder includes truncation flag, missing field name, Haiku's actual top-level keys, and a 300-char raw sample so Ian can decide whether to regenerate manually. **Social drafts are now non-blocking** — the blog PR ships even if Haiku's social JSON is malformed. Source-of-truth artifact: [n8n/update-engine-resilient-social-parser.mjs](n8n/update-engine-resilient-social-parser.mjs), same idempotent one-shot pattern as v5's `update-engine-v5.mjs`.

**Auto-memory updates** (this session, persisted in `~/.claude/projects/.../memory/`):
- `feedback_no_backticks_in_template_literal_prompts.md` — when an LLM prompt is embedded in a JS template literal (n8n HTTP body, code-node strings), never use markdown backticks for code formatting; use single quotes or escape. Surfaces as opaque `ExpressionExtensionError: invalid syntax` at runtime. Cross-references `feedback_deterministic_sanitizer_over_prompt.md`.

**Action required of Ian after this session:** None, both hotfixes were re-imported into n8n Cloud during the session. Next scheduled run picks up both. If today's stuck Notion topic is still at `Status=Generating`, flip back to `Queued` so the next run picks it up. If the auto-fired social Slack pings for today's PR are useful as templates, regenerate manually via a one-off n8n trigger against the same topic — otherwise the post itself is the main artifact.

**Revert paths** (also captured in DEPLOYMENT.md table further down):
- Both hotfixes broken: `git revert f0f4dd8` then `git revert fb8da93`
- Parse Social Outputs new behavior unwanted: `git revert f0f4dd8` (falls back to throw-on-missing + `max_tokens: 2048`)
- Backtick fix unwanted: `git revert fb8da93` (re-breaks Generate Draft at next scheduled run, do not)

---

## Quick reference — recent additions (Session 9, 2026-05-13)

This session diagnosed and fixed a recurring layout bug class in the content engine, hardened the engine against three failure modes that were producing AI-slop output, and cleared the open-PR backlog.

**Triggering bug — PR #24 newsletter post (Beehiiv vs Substack vs HubSpot, merged 2026-05-13).** Ian flagged a broken flowchart and missing Substack hyperlink. Root cause investigation revealed two issues that together explain the symptom plus a class of recurring failures:

1. **Substack wasn't in `src/data/affiliate-links.ts`** so the ComparisonTable CTA dropped (component only renders CTA when `affiliateSlug` is set) and the engine's "first mention" rule skipped Substack entirely. Fixed by adding `substack` as `status: 'no-program'` with `homepageFallback: 'https://substack.com/'` — the existing `resolveDestination()` handles fallback to homepage + UTM tag.
2. **The engine generated camelCase SVG attributes** (`textAnchor`, `fontWeight`, `strokeWidth`) despite its prompt having a CRITICAL kebab-case rule. Astro renders SVG as raw HTML, so browsers silently drop camelCase attrs → `text-anchor` defaulted to `start` → labels rendered left-aligned and overflowed both their boxes and the figure container. The qa-fix-1 / qa-fix-2 auto-fix bot saw the visual overflow but couldn't infer "the attribute names are wrong" from a screenshot — it patched CSS around the symptom (qa-fix-2 added an invalid `style` prop on `<ComparisonTable>` with `@media` inside inline CSS, plus an empty trailing `<div>` for 7rem of blank space).

**Engine v5 (PR #25, merged 2026-05-13).** Three coordinated changes hardening the engine after the PR #24 diagnosis:

- **Generate Draft prompt**: adds `PERSONAL VOICE` (first person required — I/me/my/we/my clients, 3-5 markers per post, Ian Chamberland / Homegrown Growth Co. framing), `EXTERNAL CITATIONS` (2-4 inline links to vendor docs / Gartner / Forrester / HubSpot Research / Lenny / Reforge / Common Room / First Round Review / G2; do-not-invent-URLs rule explicit), `NO EM/EN DASHES` (hard rule with commas/periods/parens replacements). `substack` added to the affiliate slug list.
- **Humanize prompt**: adds `NO DASHES` scrub across body/frontmatter/JSX/captions, `PERSONAL VOICE verify` (inject if <3 first-person markers), `CITATIONS verify` (add if <2 inline external links). `substack` added to slug list (parity).
- **Parse Draft jsCode**: prepends a deterministic `sanitizeMdx()` that runs on every output regardless of LLM compliance. Converts camelCase SVG attrs → kebab-case (`textAnchor` → `text-anchor`, `fontWeight` → `font-weight`, `strokeWidth` → `stroke-width`, etc.) and replaces em (U+2014) + en (U+2013) dashes with `", "`. **This sanitizer is the load-bearing change** — prompt rules are aspirational, the regex pass makes the bug class unshippable.

Engine v5 was re-imported into n8n Cloud by Ian on 2026-05-13. Source-of-truth artifact: [n8n/update-engine-v5.mjs](n8n/update-engine-v5.mjs) — same idempotent one-shot pattern as v4's `update-engine-for-mdx.mjs`.

**Cleanup + CI lint (PR #26, merged 2026-05-13).** Removed the qa-fix-2 noise from the newsletter post (invalid `style` prop on `<ComparisonTable>` + empty trailing `<div>` that was rendering as visible blank space + a spurious horizontal divider). Added a `camelCase SVG attributes` lint step to [.github/workflows/qa-content-pr.yml](.github/workflows/qa-content-pr.yml) that runs before the expensive Playwright/Vision pipeline (~2s, fail-fast). The lint is defense-in-depth: the engine's `sanitizeMdx()` covers the LLM path, the CI lint covers hand edits and direct commits that bypass the engine.

**Navbar mobile/tablet fixes (PR #23, merged 2026-05-13 — opened 2026-05-12).** Two real overflow bugs identified by the QA Vision review on the earlier kit-newsletter post: (1) mobile <768px — logo + 3 nav-links = ~400px in a 327px content area, "Tools" was clipping with no fallback; (2) tablet 768-1023px — Newsletter CTA visible despite `.nav-cta { display: none }` because `.btn { display: inline-flex }` declared later in source at same specificity (0,1,0) was winning. Fix adds a hamburger drawer on mobile (vanilla DOM, IIFE-wrapped inline `<script is:inline>`, ARIA-correct, CSS-only animation hamburger → X via `transform` on `aria-expanded="true"`, drawer closes on link click / Escape / viewport-resize-past-768) and bumps tablet rule specificity to `.btn.nav-cta { display: none }` (0,2,0 beats 0,1,0).

**Auto-memory updates** (this session, persisted in `~/.claude/projects/.../memory/`):
- `feedback_no_em_dashes.md` — hard editorial rule across all of Ian's content/writing projects; em dashes and en dashes are AI-slop tells, replace with commas/periods/parens
- `feedback_deterministic_sanitizer_over_prompt.md` — for LLM output with hard syntax invariants (kebab-case attrs, character bans, schema constraints), add a deterministic post-process; prompt rules alone fail and Vision QA can't infer attribute-level bugs from screenshots

**Affiliate philosophy clarified.** Every tool mentioned gets a `/go/<slug>` link regardless of program status. If no affiliate program exists, `homepageFallback` + UTM tag in [src/data/affiliate-links.ts](src/data/affiliate-links.ts) handles the redirect. `resolveDestination()` already implements this; the engine's "first mention" rule now linkifies all tools on the slug list (which includes Substack as the first `no-program` example). When adding a new tool the engine should know about: add it to both `affiliate-links.ts` AND the slug list in both Generate Draft and Humanize prompts (one entry in the engine JSON, applies to both nodes via the v5 updater script).

**Action required of Ian after this session:** None — engine v5 already re-imported into n8n Cloud. Next blog engine run picks up all three layers (prompt rules + verify pass + sanitizer).

---

## Quick reference — recent additions (Session 8, 2026-05-11 → 2026-05-12)

This session closed out everything left open after Session 7's redesign: shipped the deferred automation workflows, ran the rotation backlog for TheAutomationsGuide, fixed two bugs caught when the QA pipeline ran live for the first time, and produced the first fully-engine-generated + auto-QA-fixed post to land on the site.

**Automation infrastructure (PR #10, merged 2026-05-11):**
- Bumped Netlify to Node 22 LTS (Node 20 maintenance EOL was Apr 2026).
- Added 3 new n8n workflows + 1 GitHub Action:
  - `n8n/posthog-monitor.json` — daily 9am ET PostHog liveness check, Slack-alerts on zero pageviews in 24h.
  - `n8n/notion-publish-status.json` — webhook-triggered, fires on PR merge → flips matching Notion topic to `Published` + Slack ping. Closes the "go mark Published manually" loop.
  - `n8n/error-trigger.json` — n8n native Error Trigger backstop, Slack-alerts on any workflow failure account-wide.
  - `.github/workflows/auto-merge-content.yml` — daily 14:00 UTC GHA that auto-merges `content:`-prefixed PRs that are 14+ days old with all checks passing and no CHANGES_REQUESTED review.
- Setup steps for each documented in [n8n/README.md](n8n/README.md) Workflows 4–7.

**Backfilled 8 existing `.md` posts to `.mdx` with components (PR #11, merged 2026-05-11).** Per-post component picks based on what each post supports — comparison posts got ComparisonTable + StatRow; tutorial got StepRow + SideBySide; framework posts got PullQuote + ComparisonTable; listicle got PullQuote + StepRow. All 8 now have a single contrarian MyTake block + `/go/<slug>` affiliate links on first mentions of each tool from the registry. Three posts (make-vs-zapier-vs-n8n, 5-mistakes, apollo-vs-clay) had no `faqs` field and got 4 each.

**QA-into-engine auto-fix pipeline (PR #12, merged 2026-05-11).** GitHub Action [`.github/workflows/qa-content-pr.yml`](.github/workflows/qa-content-pr.yml) that runs on every `content/*` PR: waits for Netlify deploy preview → captures Playwright screenshots at 4 breakpoints → Claude Vision (`claude-sonnet-4-6`) reviews and returns JSON verdict → if issues found, Claude rewrites the `.mdx` and commits back as `[qa-fix-N]`. Capped at 2 fix attempts to prevent infinite loops; if cap hit, posts a manual-review comment + Slack-pings. Cost ceiling per PR: ~$0.25-$0.30 worst case. Helper scripts in [qa/qa-pr-review.mjs](qa/qa-pr-review.mjs) + [qa/qa-pr-fix.mjs](qa/qa-pr-fix.mjs).

**Right-sized Anthropic models for cost-efficiency (PR #13, merged 2026-05-11).** Audit found 3 social-output Anthropic calls (Twitter / Video / LinkedIn) each running Sonnet 4.6 with the full ~3K-token post body duplicated in each user prompt — ~10K duplicate input tokens per post — and `cache_control` flags set on prompts under the 1024-token threshold so caching was theater. Collapsed into a single `Generate Social Outputs` Haiku 4.5 call returning JSON, with a new `Parse Social Outputs` code node fanning the 3 fields to the existing Save nodes. Switched Topic Suggestor to Haiku 4.5 (simple structured generation, Haiku-reachable quality). Trimmed `max_tokens` caps to right-sized values. Net: ~30% cost reduction (~$0.19 → ~$0.13 per post) with no quality regression. Auto-memory `feedback_right_size_models.md` captures the principle for future projects.

**Key rotations completed (2026-05-12):**
- **Anthropic** (post-malware-wipe rotation, item N1 on parent ROTATION-LIST). 4 consumers updated: 1Password, n8n credential, `theautomationsguide/.env`, GitHub repo secret `ANTHROPIC_API_KEY`. Scope verified by grep across all `claude_projects/` — Anthropic key is only referenced in TheAutomationsGuide.
- **GitHub PAT** (item N2). Switched to fine-grained PAT format (`github_pat_...`) scoped to this repo with `Contents: R/W` + `Pull requests: R/W`. n8n credential updated with `Authorization: Bearer github_pat_...`.
- **Notion Integration Token** (item N3). Reset on `TAG - Content Engine` integration. n8n credential updated with `Authorization: Bearer ntn_...`.

**n8n credential format reference** (matters when rotating):
| Credential name | Type | Header name | Header value |
|---|---|---|---|
| `Anthropic API Key` | Header Auth | `x-api-key` | `sk-ant-...` (**raw, no Bearer**) |
| `GitHub PAT` | Header Auth | `Authorization` | `Bearer github_pat_...` |
| `Notion Integration Token` | Header Auth | `Authorization` | `Bearer ntn_...` |
| `PostHog Personal API Key` | Header Auth | `Authorization` | `Bearer phx_...` |

**n8n workflows imported + activated in Cloud (2026-05-12):**
- Re-imported: `blog-post-engine.json` (picks up SVG comment fix from PR #8 + social-outputs collapse from PR #13), `topic-suggestor.json` (Haiku swap from PR #13).
- New imports: `posthog-monitor.json`, `notion-publish-status.json`, `error-trigger.json` — all activated, credentials wired, GitHub webhook configured to fire `notion-publish-status` on every Pull request event.
- Error Trigger set as the "Error workflow" on every other workflow (Blog Engine, Topic Suggestor, Daily Briefing, PostHog Monitor, Notion Publish Status) in Workflow Settings.

**First live QA pipeline run — PR #16 (newsletter automation stack post, merged 2026-05-12).** Surfaced 2 bugs in my GHA implementation, both fixed:
- **Bug 1 (PR #17):** `grep -cE 'pat' || echo "0"` was producing `"0\n0"` when grep found zero matches, breaking `$GITHUB_OUTPUT` parser (`Invalid format '0'`). Fix: replaced with `grep -E 'pat' | wc -l | tr -d ' '` — exits cleanly regardless of match count.
- **Bug 2 (PR #19):** Playwright `fullPage: true` on a 1100-1400-word MDX post at mobile breakpoint produced PNGs > 10,000px tall, which Anthropic Vision rejects (8000px dimension limit). Fix: detect `document.documentElement.scrollHeight` and clip to 7,500px via Playwright's `clip` option when oversized.
- After both fixes, the QA workflow ran end-to-end: Claude Vision found 6 layout issues (4 major + 2 minor: StepRow density at tablet, StatRow padding on mobile, SideBySide diagram unreadable at tablet, PullQuote margin, prose width at desktop, newsletter footer padding asymmetry). Claude rewrote the `.mdx`, committed `[qa-fix-1]` (`575c71f`), Netlify rebuilt the deploy preview with fixes applied. Reviewed visually and merged.

**Known limitation — QA auto-loop is one-shot, not 2-shot, until PAT swap.** The `[qa-fix-N]` commits are pushed with the default `GITHUB_TOKEN`, which by GitHub's security design does NOT trigger downstream workflow runs (loop prevention). So the QA workflow's intended 2-pass verification (review → fix-1 → re-review → optional fix-2 → re-review) currently degrades to a 1-pass (review → fix-1 → human reviews deploy preview manually). To restore full auto-loop, swap the `Commit and push the fix` step in `qa-content-pr.yml` to use a fine-grained PAT secret (e.g., `AUTO_FIX_PAT`) instead of `GITHUB_TOKEN`. Scoped follow-up, not urgent — single-pass auto-fix is a useful workflow even without the second verification.

**Deployment + rollback safety guide (PR #18, merged 2026-05-12).** Added [`DEPLOYMENT.md`](DEPLOYMENT.md) at the project root — plain-language reference covering the mental model (PR → merge → Netlify auto-deploy → `git revert` to undo), three rollback paths (GitHub UI Revert button, `git revert -m 1 <merge-sha>`, Netlify dashboard "Publish older deploy" as emergency button), n8n-specific rollback (git is source of truth → `git show <sha>:n8n/<file>.json` → re-import), recent deployments table with per-PR revert commands, pre-merge checklist, and TL;DR cheat sheet. Pinned for "I don't know what I'm doing, what do I press?" moments.

**Affiliate program wiring — 6 live, 2 rejected, 2 pending (commit `b7c3071`, pushed direct to master 2026-05-12 PM).** Edited [`src/data/affiliate-links.ts`](src/data/affiliate-links.ts) — the source of truth for every `/go/<slug>` redirect on the site. Approved 2026-05-12: **Make** (`make.com/en/register?pc=automationsguide`, direct partner program, 35% / 12 mo, 30-day cookie), **Apollo** (`get.apollo.io/k7n9run0vl50`, PartnerStack, 15% mo / 20% annual / 12 mo), **Clay** (`me.sh/?via=theautomationsguide`, Rewardful, $50 one-time / 60-day cookie), **Beehiiv** (`?via=the-automations-guide`, 50-60% recurring / 12 mo), **Smartlead** (`?via=theautomationsguide`, 15-35% recurring tiered), **Kit** (`partners.kit.com/nt9zrjmnck9y`, PartnerStack, 50% / 12 mo). Rejected (traffic-related, ~likely <1K visits/mo threshold): HubSpot, n8n — `/go/hubspot` and `/go/n8n` still resolve via homepage + UTM fallback, so links don't break. Pending: Pipedrive (gated by PartnerStack Network application, also pending 2026-05-12). Lemlist not applied yet. Added `'rejected'` to the `AffiliateLink` status union for accurate registry state. [AFFILIATE_PROGRAMS.md](AFFILIATE_PROGRAMS.md) rewritten with a proper Status / Live link / Commission / Notes table; "Where to put the links" section trimmed to point at `affiliate-links.ts` as the single edit point. Net effect: the site's affiliate revenue path is now live for the first time — every existing `/go/<tool>` link across blog posts, tools page, and homepage tool cards now routes to a real partner URL with tracking. **PartnerStack Network application copy** (Label + "What program managers should provide") prepared in conversation; submitted by Ian.

---

## Quick reference — Session 7 (2026-05-07 PM)

**Visual post format redesign — site-wide.** Posts moved off the 760px-centered "wall of text" layout onto a wider 1280px container with a Forbes/Gartner-style full-width body. All chrome (post header, EmailSignup, AuthorNote, related-tags), homepage `#newsletter` band, and About page also widened. Quick Answer block uses flexbox to vertically-center mixed inline content (works on all 8 existing `.md` posts without edits). Post-header padding tightened (~70px reclaimed around the title divider). Mobile `StatRow` cards trimmed (~30% smaller). PRs: [#7](https://github.com/homegrowngrowthco/theautomationsguide/pull/7).

**MDX component library** at [src/components/post/](src/components/post/) — `SideBySide`, `StatRow`, `PullQuote`, `MyTake` (Ian's amber-bordered aside, distinct from `.quick-answer`), `StepRow`, `Figure`. `ComparisonTable` (existing) refactored to explicit-N-cols so 3-tier comparisons always render in one row. All components share dark-theme tokens and collapse to single-column on mobile. Components used inside `.mdx` posts via `import X from '@/components/post/X.astro'` (uses existing `@/*` tsconfig path alias).

**`@astrojs/mdx` installed.** New posts can mix Markdown + JSX components. Existing `.md` posts continue to render unchanged — no backfill performed. Astro auto-detects extension; engine now writes `.mdx`, but `.md` files stay valid.

**n8n engine v4 — MDX + per-post-type templates.** [n8n/blog-post-engine.json](n8n/blog-post-engine.json) Generate Draft prompt rewritten:
- Reads `Tag` from Notion Content Calendar → maps to one of four `postType` skeletons: `comparison` (1100–1400 words, ComparisonTable + StatRow + SideBySide+SVG decision tree), `tutorial` (800–1100 words, StepRow + SideBySide), `framework` (900–1200 words, PullQuote + StatRow), `opinion` (600–900 words, PullQuote + MyTake-led).
- Inline list of 10 affiliate slugs; rule "first mention only" linkifies tools to `/go/<slug>`.
- Required `MyTake` block with contrarian/experiential claim (omit if no real opinion); single-MyTake limit.
- `SVG / MDX SYNTAX RULE` section explicitly forbids HTML `<!-- -->` comments inside SVG (must use `{/* */}`) — added after PR #6's first build failed on this exact issue.

**Dual idempotency check** (engine plumbing). Before commit, the engine GETs both `${slug}.mdx` AND `${slug}.md` paths on master. Either 200 → abort. Protects all 8 legacy `.md` slugs from clobber via the new `.mdx` path. Architecture: existing "Check Idempotency" renamed → "Check Idempotency MDX"; new "Check Idempotency MD" node inserted between MDX check and Confirm Not Exists; Confirm Not Exists updated to verify both 404 before creating branch.

**Humanize prompt update.** Existing banned-words list preserved. New rules: verify the 7-line `import` block at top of file is intact; verify exactly one `<MyTake>` block (rewrite as contrarian if found generic); verify `/go/<slug>` on first mention of each affiliate-list tool.

**Pagefind static search wired in.** Build script chained: `astro build && pagefind --site dist`. Index at `/pagefind/` (server-side, zero client JS at idle, ~50KB UI loaded only on `/search`). New page [src/pages/search.astro](src/pages/search.astro) hosts the Pagefind UI with dark-theme tokens. Nav input submits to `/search?q=...`. In `npm run dev`, search page shows a "build first" placeholder since the index doesn't exist in dev mode.

**Navbar overhaul.** Bigger text (links 1rem, logo 1.0625rem), taller bar (`--nav-h: 72px`). New right cluster at desktop ≥1024px: search input (focus-expands 220→260px) + Newsletter CTA button (links to `/#newsletter` anchor on homepage) + LinkedIn icon. Tablet 768–1023px shows search only. Mobile <768px shows links only (unchanged from before). LinkedIn icon link goes to Ian's profile.

**QA pipeline at [qa/](qa/) — Playwright + Claude Vision.**
- `npm run qa:screenshots` — Playwright/Chromium captures every blog post + homepage/blog/tools/about/search at 4 breakpoints (375/768/1280/1440px), full-page PNGs to `qa-screenshots/<slug>/<viewport>.png` (gitignored).
- `npm run qa:review` — sends each page's 4 viewports to `claude-sonnet-4-6` with a layout-issue-focused prompt; writes `qa-review.md` (gitignored). Cost ~$0.15–0.25 per full run.
- `npm run qa` — runs both.
- Setup: needs `ANTHROPIC_API_KEY` in `.env`. Playwright Chromium installs to `%USERPROFILE%\AppData\Local\ms-playwright\` (outside OneDrive, ~150MB).
- Override base URL via `QA_BASE_URL=https://deploy-preview-N--...netlify.app npm run qa:screenshots` to QA a Netlify deploy preview directly.

**Node.js 24 LTS installed locally** via winget. Netlify build still on Node 20 per `netlify.toml` — works fine, but worth bumping to 22 LTS or 24 LTS in a future iteration since Node 20 hits maintenance EOL April 2026.

**New devDependencies in [package.json](package.json):** `@astrojs/mdx@^3`, `pagefind@^1`, `playwright@^1`, `@anthropic-ai/sdk@^0`, `dotenv@^17`. Net `node_modules` growth ~50MB (Playwright the bulk; Chromium binary lives outside OneDrive).

**Engine update artifact:** [n8n/update-engine-for-mdx.mjs](n8n/update-engine-for-mdx.mjs) is the one-shot Node script that converted v3 → v4. Source of truth for how the prompts were constructed. Don't re-run on the post-update JSON (it errors on missing `Check Idempotency` original name).

**Auto-memory updates** (this session, persisted in `~/.claude/projects/.../memory/`):
- `feedback_qa_before_user_review.md` — run mobile + desktop QA passes independently before declaring visual changes done
- `feedback_qa_auto_fix_workflow.md` — for QA-on-generation pipelines, default to autofix-and-recommit, not propose-and-wait

**Action required of Ian after this session:** re-import [n8n/blog-post-engine.json](n8n/blog-post-engine.json) into n8n Cloud so the live engine picks up the SVG comment fix from PR #8. The live engine is currently on the version imported earlier today (which produces MDX correctly but can recur the HTML-comment-in-SVG bug PR #6 hit). Master's JSON now has the fix in the prompt.

---

## Quick reference — earlier additions (Session 6, 2026-05-07 AM)

**Repo hygiene improvements (one-time, durable):**
- `delete_branch_on_merge = true` enabled on the GitHub repo (Settings → General → Pull Requests). Future PR merges auto-delete the head branch.
- `remote.origin.prune = true` set on the local clone. `git fetch`/`git pull` now auto-removes remote-tracking refs for deleted branches.
- Net effect: no more stale merged-branch accumulation requiring manual cleanup.

**Notion MCP fix (workspace mismatch):** claude.ai's Notion connector had been auth'd to Ian's personal workspace, not "The Automations Guide" workspace, so MCP `notion-fetch`/`create-pages` calls 404'd against the Content Calendar even though the n8n integration ("TAG - Content Engine") had access. Fixed by disconnecting and reconnecting Notion in claude.ai → Settings → Connectors with the correct workspace selected, then adding the Claude integration to the Content Calendar DB. MCP can now read/write the DB directly.

**Kit affiliate launch — 8 topic batch added to Notion review queue:** Kit was approved for the affiliate program (50% recurring 12mo via PartnerStack). 8 Kit-monetizable topics (4 high-intent comparisons, 1 high-priority migration guide, 3 medium workflow/tools/guide) now sit in the Content Calendar with `Status = Suggested`. All 8 funnel to `/go/kit`. Flip to `Queued` to feed the n8n blog engine. Source plan: see prior `n8n/topic-suggestions/2026-05-07-kit-launch.md` (branch deleted after Notion sync; topic content lives in Notion now).

**Drift reconciled from a parallel Claude Code Desktop session:** Desktop session created a `claude/add-article-ideas-FkSz5` branch on the remote (1 commit, the kit-launch markdown) without VS Code knowing. Local master was also 1 PR-merge behind remote (PR #4, Apollo article). Both reconciled. Going forward: VS Code is the canonical workspace for this repo; avoid running parallel desktop sessions on the same project.

---

## Quick reference — earlier additions (Session 5, 2026-05-03)

**Legal pages live:** `/privacy`, `/terms`, `/disclosure` — all `noindex, follow`. Footer updated to link them.

**Affiliate redirect system:** Centralized in `src/data/affiliate-links.ts`. Use `/go/<slug>` in any post or component. The `/go/[tool]` Astro page fires a PostHog `affiliate_click` event before redirecting (works once PostHog is installed). 10 tools registered, all with `status: 'pending'` until real URLs come in.

**ComparisonTable component:** `src/components/ComparisonTable.astro`. Drop into any post for a multi-tool comparison with affiliate CTAs. See component header for usage example.

**Topic Suggestor prompt:** Updated to weight commercial intent — explicit hierarchy from "highest intent (comparisons/alternatives)" down to "lower intent (opinion)". Mix targets 3+ HIGHEST INTENT per batch.

**Blog engine LinkedIn output:** New parallel branch in `blog-post-engine.json`. Generates LinkedIn post + saves to Drafts DB alongside Twitter thread + video script. Uses LinkedIn-specific best practices (hook in first 210 chars, line breaks every 1-2 sentences, 1200-1800 char target, anti-cliché ruleset).

Running log across all sessions. Use as context when starting a new Claude Code session.

---

## Table of Contents

1. [Astro Site — theautomationsguide.com](#1-astro-site--theautomationsguidecoms)
2. [n8n Blog Post Generator Workflow](#2-n8n-blog-post-generator-workflow)
3. [90-Day Launch Plan — Notion](#3-90-day-launch-plan--notion)
4. [Open Placeholders (all three projects)](#4-open-placeholders--all-three-projects)
5. [Master Next Steps](#5-master-next-steps)

---

## 1. Astro Site — theautomationsguide.com

### Repo & deployment

- **GitHub:** `github.com/homegrowngrowthco/theautomationsguide`
- **Branch:** `master` (not `main`)
- **Netlify:** auto-deploys on push to `master` — no manual step needed after `git push`
- **Local path:** `C:\Users\Ian\OneDrive\Documents\claude_projects\theautomationsguide\`

### Site structure

```
theautomationsguide/
├── astro.config.mjs           # site URL + @astrojs/sitemap@3.1.6
├── netlify.toml               # build: npm run build, publish: dist
├── OFF_SITE_SEO_CHECKLIST.md  # manual submission/distribution checklist
├── public/
│   ├── favicon.svg
│   ├── robots.txt             # AI crawler allow rules + sitemap pointer
│   ├── _headers               # Netlify security headers (CSP, HSTS, etc.)
│   └── _redirects             # www → apex 301 redirect
├── src/
│   ├── components/
│   │   ├── AuthorNote.astro   # E-E-A-T author callout, left-border accent, on every post
│   │   └── EmailSignup.astro  # Beehiiv embed — disabled until real URL is set
│   ├── content/
│   │   ├── config.ts          # Schema: title, description, pubDate, tags, draft, faqs (optional)
│   │   └── blog/
│   │       ├── revops-tech-stack-2025.md
│   │       ├── zapier-vs-make-for-gtm-teams.md
│   │       ├── automate-sales-handoff-hubspot-slack.md
│   │       └── revops-automation-stack-2026.md
│   ├── layouts/
│   │   ├── BaseLayout.astro       # nav, footer, all <head> meta, JSON-LD, named head slot
│   │   └── BlogPostLayout.astro   # read time, tags, EmailSignup, AuthorNote, BlogPosting/FAQ JSON-LD
│   ├── pages/
│   │   ├── index.astro        # homepage
│   │   ├── about.astro        # first-person, E-E-A-T focused
│   │   ├── tools.astro        # affiliate hub: 3 categories, 9 tools
│   │   ├── 404.astro          # friendly 404 with noindex
│   │   ├── llms.txt.ts        # dynamic /llms.txt endpoint — article index for AI engines
│   │   ├── rss.xml.js         # RSS feed via @astrojs/rss
│   │   └── blog/
│   │       ├── index.astro    # blog listing with tag cloud
│   │       └── [slug].astro   # dynamic post route
│   └── styles/
│       └── global.css         # dark theme, design tokens, .quick-answer utility class
```

### Key decisions

- **Framework:** Astro 4.x static output — no JS framework, fast, good for SEO
- **CSS:** Custom dark-mode, no Tailwind — edit `global.css` directly
- **Sitemap:** `@astrojs/sitemap@3.1.6` (NOT 3.7.x — crashes on Astro 4.16.x with `reduce` error)
- **Newsletter:** Beehiiv embed — disabled until real URL is set in `EmailSignup.astro`
- **E-E-A-T:** `AuthorNote` on every post + first-person About page
- **Affiliate links:** All use `AFFILIATE_LINK_PLACEHOLDER` — safe to push, replace before live promotion
- **Content management:** Markdown files in `src/content/blog/` — commit and push to deploy
- **SEO/GEO:** Sitemap, RSS, llms.txt, robots.txt with AI crawlers, JSON-LD structured data all live as of 2026-04-24
- **Security headers:** Netlify `_headers` file — CSP, HSTS, X-Frame-Options, Referrer-Policy all active

### Session 1 problems solved

| Problem | Resolution |
|---|---|
| `gh` CLI not on PATH after winget install | Used full path `/c/Program Files/GitHub CLI/gh.exe` |
| `gh auth login` wouldn't complete via `!` prefix | Ian ran `& "C:\Program Files\GitHub CLI\gh.exe" auth login` in a separate PowerShell window |
| Git identity not configured | Set `user.email = ian@homegrowngrowth.co`, `user.name = Ian` globally |

### Session 2 problems solved

| Problem | Resolution |
|---|---|
| `@astrojs/sitemap@3.7.2` crashed with `reduce` error | Downgraded to `3.1.6` |
| n8n body expressions with apostrophes | Switched to ES6 backtick template literals for system prompts |
| GitHub commit needed base64 of humanized content | Used `Buffer.from($json.content[0].text).toString('base64')` inline |

### Session 3 problems solved

| Problem | Resolution |
|---|---|
| Bash tool calls kept getting interrupted/denied | Created `.claude/settings.json` with allowlist for `git add/commit/push` and `npm install/build` |

### Session 4 — Content engine v3 + Topic Suggestor + Daily Briefing + affiliate research (2026-05-03)

Reassessed site (no rebuild needed — Astro/Netlify is the right shape for hands-off review/tweak workflow). Rebuilt the n8n content engine into a PR-based flow so reviews happen on Netlify deploy previews. Researched affiliate programs for the 8 site tools + 5 high-value adjacent programs.

| File | What changed |
|---|---|
| `n8n/blog-post-engine.json` | NEW — v3 workflow (Notion topic queue, PR flow, idempotency check, claude-sonnet-4-6 + prompt cache). Live & tested end-to-end (PR #1 created successfully) |
| `n8n/topic-suggestor.json` | NEW — Mon/Thu — Claude proposes 5 topics based on coverage gaps, written as `Suggested` for batch approval (5 min twice/week) |
| `n8n/daily-briefing.json` | NEW — daily 7:30am — single Slack ping summarizing PRs to review, topics to approve, drafts to post. Skips post when nothing pending |
| `n8n/create-content-databases.js` | NEW — provisions Content Calendar + Drafts DBs in Notion, seeds 3 sample topics. Updated to include `Suggested` status |
| `n8n/README.md` | NEW — full setup guide for all three workflows |
| `n8n/blog-post-engine-v2-archive.json` | Archived v2 (was at repo-root `workflows`) for reference |
| `AFFILIATE_PROGRAMS.md` | NEW — Tier 1/2/3 application URLs, commission rates, cookie windows. Confirmed Zapier/Gong/Chorus have no public affiliate program — drop from site |
| Removed `workflows.zip` (unneeded) and the loose `workflows` file |

Reasoning: Ian wants hands-off + scalable + review-friendly across multiple businesses. Three-workflow system gives him "agents propose, human approves in batch, agents execute" pattern: Topic Suggestor proposes → Ian flips Suggested → Queued → Blog Engine generates + opens PR → Ian reviews on Netlify preview → merges. Daily Briefing is the single morning check-in point that consolidates "what needs me today."

Bug fixed mid-session: Notion update-page calls in v3 used POST instead of PATCH (Notion's update endpoint requires PATCH). Fixed in workflow JSON + manually in Ian's running instance. Fix details in feedback memory `feedback_notion_api_quirks.md`.

### Session 3 — SEO/GEO infrastructure added (2026-04-24)

All committed and live on Netlify. Verified 200s on all endpoints.

| File | What it does |
|---|---|
| `public/robots.txt` | Added explicit `Allow: /` for GPTBot, ClaudeBot, PerplexityBot, Google-Extended, OAI-SearchBot, ChatGPT-User, Applebot-Extended, CCBot |
| `public/_headers` | Netlify security headers: CSP, HSTS (2yr + preload), X-Frame-Options DENY, Referrer-Policy, Permissions-Policy |
| `public/_redirects` | www → apex 301 redirect |
| `src/pages/llms.txt.ts` | Dynamic Astro endpoint — generates `/llms.txt` from blog collection at build time; machine-readable article index for AI engines |
| `src/pages/rss.xml.js` | RSS feed via `@astrojs/rss`; posts sorted by pubDate desc |
| `src/pages/404.astro` | Custom 404 with noindex meta, links to /blog and / |
| `src/layouts/BaseLayout.astro` | Added: sitemap link, RSS autodiscovery, theme-color, robots meta (max-snippet/image), author, generator, BreadcrumbList JSON-LD on all pages, Organization JSON-LD on homepage, named `<slot name="head">` for per-page schema injection |
| `src/layouts/BlogPostLayout.astro` | Added: BlogPosting JSON-LD on every post; FAQPage JSON-LD when post frontmatter has `faqs:` array |
| `src/content/config.ts` | Added optional `faqs` field: `z.array(z.object({ question, answer })).optional()` |
| `src/styles/global.css` | Added `.quick-answer` utility class — teal left-border callout for LLM-extractable TL;DR blocks |
| `OFF_SITE_SEO_CHECKLIST.md` | Manual checklist: GSC submission, Bing, social profiles, affiliate applications, GEO baseline test |
| `.claude/settings.json` | Permission allowlist so Claude can run git/npm commands without prompting |

### How to use new SEO features in posts

**Add FAQ structured data to a post:**
```yaml
---
title: "My Post"
faqs:
  - question: "What is X?"
    answer: "X is Y."
  - question: "How do I Z?"
    answer: "You Z by doing W."
---
```

**Add a TL;DR block LLMs can extract:**
```html
<div class="quick-answer">
  <strong>Quick answer:</strong> Your one-sentence summary here.
</div>
```

**To-do before apple-touch-icon is active:**
Add a 180×180px PNG at `public/apple-touch-icon.png`, then uncomment the link in `BaseLayout.astro`.

**To-do before sameAs social signals work:**
In `BaseLayout.astro`, find `sameAs: []` and populate with your LinkedIn company page URL and Twitter/X URL once those accounts exist.

**When Beehiiv is enabled:**
Update `Content-Security-Policy` in `public/_headers` — add `frame-src https://embeds.beehiiv.com` and update `form-action` to include `https://embeds.beehiiv.com`.

---

## 2. Content Engine — n8n (v3, 2026-05-03)

**Folder:** `n8n/` in this repo
**Files:**
- `n8n/blog-post-engine.json` — main workflow (Notion topic → blog PR + social drafts)
- `n8n/topic-suggestor.json` — Mon/Thu — Claude suggests 5 topics based on coverage gaps, writes as `Suggested` for batch approval
- `n8n/daily-briefing.json` — daily 7:30am — single Slack message: PRs to review, topics to approve, drafts to post
- `n8n/create-content-databases.js` — one-off Node script to create the Notion DBs
- `n8n/README.md` — full setup guide for all three workflows
- `n8n/blog-post-engine-v2-archive.json` — old v2 (direct-to-master commit, hardcoded topic) for reference only

**Current Notion DB IDs (live):**
- Content Calendar: `62f34586-4f78-4b83-b2ac-105f500d059e`
- Content Drafts (Social): `7399699b-ef9d-4ef4-8c2c-4749f99b5b76`

These are pre-filled in the Config nodes of all three workflow JSONs.

### Pipeline (v3)

```
Manual Trigger ──┐
                 ├──▶ Config (DB IDs, repo, slack URL)
Weekday 8am ─────┘           │
                             ▼
                  Get Next Topic (Notion query: Status = Queued)
                             │
                             ▼
                  Parse Topic → Mark "Generating" in Notion
                             │
                             ▼
                  Generate Draft (Claude sonnet-4-6, with prompt cache)
                             │
                             ▼
                  Humanize (strips AI fingerprint words, adds opinions)
                             │
                             ▼
                  Parse Draft (extract title, build slug + branch name)
                             │
                             ▼
                  Check Idempotency (GET file on master — 404 = safe)
                             │
                             ▼
                  Get Base SHA → Create Branch → Commit File → Open PR
                             │
              ┌──────────────┼──────────────┬──────────────┐
              ▼              ▼              ▼              ▼
        Mark Topic      Generate       Generate       Slack
        "In Review"     Twitter        Video          Notification
        + PR URL        Thread         Script         (with PR URL)
                            │              │
                            ▼              ▼
                    Save Thread     Save Script
                    to Drafts DB    to Drafts DB
```

### Key v3 changes from v2

| What | v2 | v3 |
|---|---|---|
| Topic source | Hardcoded in Set node | Notion Content Calendar (Status = Queued) |
| Model | claude-sonnet-4-5 | claude-sonnet-4-6 + prompt caching |
| Commit flow | Direct push to `master` | Create branch + open PR (Netlify builds preview) |
| Idempotency | None — would overwrite | Pre-check via GitHub Contents API; aborts if file exists |
| Topic state | Lost after run | Notion status: Queued → Generating → In Review → Published |
| Notion DBs | One DB ("blog") | Two DBs (Content Calendar + Content Drafts) |
| Slack message | Links to GitHub blob | Links to PR (Netlify auto-comments preview URL) |

### Credentials (n8n) — exact names matter

| Credential name | Type | Header name | Header value |
|---|---|---|---|
| `Anthropic API Key` | Header Auth | `x-api-key` | `sk-ant-...` |
| `GitHub PAT` | Header Auth | `Authorization` | `token ghp_...` (needs `repo` scope) |
| `Notion Integration Token` | Header Auth | `Authorization` | `Bearer ntn_...` |

### Config node values to fill in

| Field | What to put |
|---|---|
| `topicsDatabaseId` | Content Calendar DB ID (printed by `create-content-databases.js`) |
| `draftsDatabaseId` | Content Drafts DB ID (same script) |
| `slackWebhookUrl` | Incoming Webhook URL from Slack |
| `githubOwner` / `githubRepo` / `githubBaseBranch` / `siteBaseUrl` | Pre-filled |

### Content Calendar DB schema (created by the script)

| Property | Type | Required | Notes |
|---|---|---|---|
| Topic | Title | yes | The post idea |
| Status | Select | yes | Queued, Generating, In Review, Published, Skipped |
| Priority | Select | recommended | High, Medium, Low — engine picks highest first |
| Tag | Select | recommended | revops, automation, tools, comparison, guide — first frontmatter tag |
| Target Keyword | Rich text | optional | SEO hint to LLM |
| Notes | Rich text | optional | Angle, must-includes, contrarian takes |
| PR URL | URL | auto | Filled when PR opens |
| Pub Date | Date | auto | Filled when PR opens |
| Created | Created time | auto | Used as tie-breaker for sort |

### Content Drafts DB schema (created by the script)

| Property | Type | Notes |
|---|---|---|
| Name | Title | "Twitter: [post title]" or "Video: [post title]" |
| Status | Select | Draft – Needs Review, Script – Needs Review, Approved, Posted, Skipped |
| Type | Select | Twitter Thread, Video Script, LinkedIn Post |
| PR URL | URL | Links back to the post PR |
| Pub Date | Date | ISO date of generation |

### Review flow

1. PR opens automatically with title `content: [post title]`
2. Netlify builds deploy preview within ~2 min, comments URL on PR
3. Slack ping: PR link
4. Open preview URL — read post like a visitor
5. Edit on GitHub directly if needed (commit to same branch → preview rebuilds)
6. Click Merge → master deploys → live within ~2 min

### Known gotchas

- **Notion property names are case-sensitive** — `Topic`, `Target Keyword`, `PR URL` etc. must match exactly
- **GitHub PAT scope** — needs `repo` for branch creation on private repos (`public_repo` enough for public)
- **Notion 2000-char cap** still applies — Twitter thread + video script truncated to 1999 chars in Drafts DB
- **Same topic generates same slug → idempotency check throws** — by design. Reword topic or delete existing post
- **No queued topics → workflow stops cleanly** (Parse Topic returns empty array). Add topics, next run picks up

---

## 3. 90-Day Launch Plan — Notion

**Notion root page:** https://www.notion.so/34a7e25f0a1681fa9a88c329a60fb71a
**Script:** `C:\Users\Ian\OneDrive\Documents\claude_projects\create-notion-plan.js`

### Structure

```
The Automations Guide — 90 Day Launch Plan
├── Plan Overview table
├── Phase 1 — Foundation (Days 1–30)   → 39 tasks, Week 1–4
├── Phase 2 — Traction (Days 31–60)    → 21 tasks, Week 5–8
└── Phase 3 — Optimize (Days 61–90)    → 23 tasks, Week 9–13
```

Each database: **Task** · **Week** (select) · **Day** (number) · **Category** · **Priority** · **Status** · **Notes**
All 83 rows pre-populated as "Not Started".

### Phase goals

| Phase | Days | Goal | Key Milestone |
|---|---|---|---|
| Foundation | 1–30 | Pipeline live, site live, affiliates applied, social active | First 3 posts via pipeline; X + TikTok created |
| Traction | 31–60 | 500 visitors/mo, 100 email subscribers, first affiliate clicks | Make vs Zapier comparison live; X at 5x/week |
| Optimize | 61–90 | $100+ affiliate revenue, 500 subscribers, clear picture of what works | Second high-intent page; Beehiiv Boost evaluated; retrospective written |

### Tasks breakdown

| Category | Phase 1 | Phase 2 | Phase 3 | Total |
|---|---|---|---|---|
| Setup | 16 | 1 | 0 | 17 |
| Content | 6 | 5 | 5 | 16 |
| Distribution | 9 | 8 | 0 | 17 |
| Monetization | 8 | 0 | 5 | 13 |
| Analytics | 5 | 7 | 13 | 25 |
| **Total** | **39** | **21** | **23** | **83** |

Analytics is back-loaded — Phase 3 is almost entirely assessment and decisions.

### Re-running the script

```bash
npm install @notionhq/client
NOTION_TOKEN=secret_xxx NOTION_PARENT_PAGE_ID=your_page_id node create-notion-plan.js
```

Or edit the two constants at the top of the file directly. Script validates both are set before making API calls.

### Notion plan next steps

- Set a default filter on each database view to show only the current week's tasks
- Add a formula column for actual date: `dateAdd(date("2026-04-22"), prop("Day") - 1, "days")`
- Drive `blogTopic` in n8n from the Notion plan — query `Category = Content AND Status = Not Started`
- Add a Beehiiv subscriber count tracker table
- Use Day 89 go/no-go output to create a Phase 4 page if warranted

---

## 4. Open Placeholders (current state — 2026-05-03 EOD)

| Placeholder | Where | Status |
|---|---|---|
| `BEEHIIV_EMBED_URL_PLACEHOLDER` | `src/components/EmailSignup.astro` | ✅ Done — Beehiiv form ID `d41efc59-7041-482b-8178-6d238e6c3cfa` wired |
| `AFFILIATE_LINK_PLACEHOLDER` (raw) | `src/pages/index.astro`, `src/pages/tools.astro` | ✅ Replaced with `/go/[tool]` redirects. Live (2026-05-12): Make, Apollo, Clay, Beehiiv, Smartlead, Kit. Rejected: HubSpot, n8n (re-apply when traffic builds). Pending PartnerStack Network: Pipedrive. |
| `[COMPANY_LOGOS_PLACEHOLDER]` | `src/pages/index.astro` hero | ✅ Replaced with HGC publisher line |
| `ian@theautomationsguide.com` | `src/pages/about.astro` and legal pages | ✅ Done — alias on Ian's HGC Google Workspace |
| Notion DB IDs / Slack URL | n8n Config nodes | ✅ Filled in workflow JSONs (Content Calendar `62f34586-...`, Drafts `7399699b-...`) |
| `sameAs: []` | `src/layouts/BaseLayout.astro` | ✅ Populated with LinkedIn (Ian) + HGC. TAG company page LinkedIn/Twitter URLs still pending |
| Apple touch icon | `public/apple-touch-icon.png` | ✅ Done (HGC's icon) |
| OG image template | `public/og-default.png` | ❌ Not done — needs design work |

---

## 5. Master Next Steps (current state — 2026-05-13 EOD)

### What's running already

- [x] Site live on theautomationsguide.com, auto-deployed from `master` via Netlify (Node 22 LTS).
- [x] **Content engine v5** (Session 9, 2026-05-13) live in n8n Cloud. Adds PERSONAL VOICE + EXTERNAL CITATIONS + NO EM/EN DASHES prompt rules, Humanize verify passes for each, and a deterministic `sanitizeMdx()` in Parse Draft that converts camelCase SVG attrs → kebab-case and strips em/en dashes regardless of LLM compliance. ~$0.13 per post API spend (unchanged from v4).
- [x] **Topic Suggestor** (Haiku 4.5, Mon/Thu) + **Daily Briefing** (Slack ping each morning) live in n8n Cloud.
- [x] **Auto-merge content PRs GHA** (daily 14:00 UTC, 14-day staleness threshold, Slack-notifies via `SLACK_WEBHOOK_URL` repo secret).
- [x] **QA auto-fix pipeline GHA** (Claude Vision review + 2-fix-cap, ~$0.30 worst-case per PR). **camelCase SVG attrs CI lint** (Session 9) runs before screenshots and fails fast if camelCase attrs slip into a content PR — defense-in-depth against hand edits that bypass the engine sanitizer. See Session 8 note about one-shot limitation pending PAT swap.
- [x] **PostHog liveness monitor** in n8n (daily 9am ET, Slack-alerts on zero pageviews in 24h).
- [x] **Notion publish-status webhook** in n8n (auto-flips Notion topic Status → Published on PR merge + Slack notification).
- [x] **n8n Error Trigger backstop** wired as "Error workflow" on every active n8n flow.
- [x] **Pagefind static search** — index built at `npm run build`, served from `/pagefind/`, navbar input + `/search` page.
- [x] **Visual MDX component library** (SideBySide, StatRow, PullQuote, MyTake, StepRow, Figure, ComparisonTable) used in all 9 published posts.
- [x] PostHog analytics + Beehiiv newsletter wired and shipping.
- [x] HGC publisher branding (AuthorNote, About, footer, schema).
- [x] Legal pages (privacy, terms, disclosure).
- [x] `/go/[tool]` affiliate redirect system with PostHog tracking.
- [x] Apple touch icon, email alias `ian@theautomationsguide.com`, GSC + Bing submitted.
- [x] (2026-05-12) **Anthropic / GitHub PAT / Notion Integration Token all rotated** through every consumer (1Password, n8n credential, `.env`, GitHub repo secret as applicable).
- [x] (2026-05-12) **First fully-engine-generated + auto-QA-fixed post live** — `/blog/2026-05-12-newsletter-automation-stack-...` (PR #16, qa-fix-1 applied 6 layout issues).
- [x] (2026-05-12) **6 affiliate programs live:** Make (`pc=automationsguide`), Apollo, Clay, Beehiiv, Smartlead, Kit. All wired in `src/data/affiliate-links.ts`. HubSpot + n8n rejected (re-apply when traffic builds). Pipedrive gated by pending PartnerStack Network application.
- [x] (2026-05-13) **Substack registered as `no-program` affiliate entry** in `src/data/affiliate-links.ts` — links via `/go/substack` fall back to substack.com + UTM tag. Pattern for any tool without an affiliate program: add the entry, add the slug to the engine's slug list, and `resolveDestination()` handles the homepage fallback automatically.
- [x] (2026-05-13) **Navbar mobile hamburger drawer + tablet CTA specificity fix** (PR #23). Mobile <768px shows a hamburger that opens a drawer (Blog/Tools/About + search + Newsletter CTA + LinkedIn). Tablet 768-1023px hides the CTA + LinkedIn icon via `.btn.nav-cta { display: none }` (specificity 0,2,0).
- [x] [DEPLOYMENT.md](DEPLOYMENT.md) — rollback safety guide pinned at repo root.

### Open / pending — tracked in TODO.md

**Canonical source of truth for all TheAutomationsGuide open tasks:** [TODO.md](TODO.md) — synced to the root `TODO.md` rollup + the `Project Tasks` Notion database by todo-sync.

**Going forward, do not add new to-do items to this CLAUDE.md file, and do not use the old "TAG Tasks" Notion DB** (`df30d3d4…`, `TAG - Content Engine` workspace) — it is **DEPRECATED as of 2026-06-11** in favor of the single cross-project tracker (one task system everywhere). Add open tasks to [TODO.md](TODO.md) and re-rank the `## TODO` block on each add (per `../todo-sync/CONVENTION.md`). Before archiving the old DB, eyeball it once for any still-open item not already in TODO.md; recurring cadence items it held (monthly engine audit, quarterly key rotation) can move to a future `OPERATIONS.md`. Past Sessions' completed work is preserved in the Quick reference sections above for historical context.

### Revert paths (in case anything breaks)

| Concern | Revert command |
|---|---|
| tsconfig `ignoreDeprecations` line wrong / TS 7.0 breaks it | `git revert ecc68c7` (commit, no PR — direct master) — re-surfaces VS Code TS 6.0 deprecation warning but build still works |
| Navbar mobile drawer / tablet hide broken | `git revert 4cec916` (PR #23 — navbar mobile/tablet fix) |
| camelCase SVG CI lint blocking a PR you don't want it to | `git revert bae8a23` (PR #26 — also restores the qa-fix-2 noise) |
| Newsletter post (Beehiiv vs Substack vs HubSpot) needs rollback | `git revert cc295c5` (PR #24 — full post + Substack affiliate-links entry) |
| Engine v5 prompts produce odd output | `git revert 8377188` (PR #25) — then re-import the reverted JSON into n8n Cloud. Falls back to v4 behavior. |
| Latest engine-generated content PR not what you want | `git revert 73a8e86` (PR #16 — newsletter automation post) |
| Backfilled posts look worse than originals | `git revert 52e6807` (PR #11 — backfill 8 posts to MDX) |
| QA auto-fix pipeline misbehaves | `git revert c2c2b18` (PR #12 — QA pipeline) — engine still works without QA loop |
| Right-size models causing social output quality regression | `git revert 8733108` (PR #13 — model right-sizing) — restores 3 Sonnet social calls |
| Automation workflows / Node 22 / auto-merge GHA broken | `git revert b9f4932` (PR #10 — automation improvements) |
| QA workflow `grep -c` or screenshot height bugs surface again | `git revert 0ac804b` (PR #17) or `git revert 2e248ae` (PR #19) — both are bug fixes; reverting restores the failing behavior. Don't revert these. |
| Visual format redesign caused regression | `git revert a83b5cd` (PR #7) |
| Engine v4 MDX prompt produces bad output | `git revert c23036c` (PR #8) — falls back to pre-fix v4 prompt. To fully revert to v3 markdown engine: `git revert a83b5cd` and re-import the resulting JSON into n8n Cloud. |

For step-by-step rollback instructions (UI / CLI / Netlify emergency button) see [DEPLOYMENT.md](DEPLOYMENT.md).
