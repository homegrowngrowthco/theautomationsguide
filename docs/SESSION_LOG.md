# Session Log (archive) — The Automations Guide

Append-only session history, newest first. Moved here from CLAUDE.md on 2026-07-17 (docs cleanup) so the auto-injected CLAUDE.md stays lean.

**Convention going forward:** one entry per session, target 20 lines or fewer: what shipped / PRs + SHAs / one-line verification / revert path / new gotchas. Detail beyond that belongs in the PR description. Commit docs-only changes direct to master (no PR, no worktree needed).

Entries below Session 65 use the older long-form format and include the pre-cleanup project docs (site structure, engine v3 pipeline, 90-day plan, placeholders) at the bottom for historical reference. Do not treat those bottom sections as current.

---

Last updated 2026-07-18 (Session 69).

## Quick reference — recent additions (Session 70, 2026-07-17 to 07-19)

- **Shipped:** repo-wide docs cleanup `149e509`+`1d465c2` (CLAUDE.md 1,941->60 lines, history moved HERE; TODO purged of 43 done items; AFFILIATE_PROGRAMS/CONTENT_CALENDAR/GSC-TIER2 deleted or merged; audits -> `audits/`; DEPLOYMENT table -> pointers; new `qa:docs` lint). `@ian` tag on human-only TODOs `193951c`; stale-current-state lint `84398d6`; GSC_TOKEN_JSON secret set by Ian 2026-07-18 (demand mining arms next weekly backlog run; TODO item closed).
- **Portfolio context:** same cleanup executed across growth-engine/flyrai/HGC/copperline; new cross-project ops systems (Ian queue reminder Mon+Thu 8am, Monday Scoreboard Mon 7:45am, both n8n) verified live. See root ops-log #536-541.
- **Verify:** qa:docs green; todo-sync drift lint clean; both Slack digests posted (execs 20733/20734).
- **Revert:** `git revert <sha>` per commit above. S69 (CI failure-recurrence ledger) is the separate entry below.
- **Gotcha:** the engine merged content mid-cleanup twice; both resolved by `git pull --rebase` + folding S66-68 into this archive before pushing.

---

## Quick reference — recent additions (Session 69, 2026-07-18)

**QA failure recurrence ledger shipped — the 2nd same-class QA failure within 14 days now escalates loudly.** Direct to master: `2fec0cf`.

- `.github/workflows/qa-content-pr.yml`: gate steps got explicit `id:`s (auto-register, lint-content, lint-logos, build, render-acceptance, mobile-overflow, apply-fix, verify-fix — no behavior change). Two NEW steps, both `failure()`-only + `continue-on-error: true` so a green run is structurally untouchable: (1) derive a failure signature from the first failed gate's `steps.<id>.outcome`; (2) `node qa/failure-ledger.mjs` appends `{date, pr, sha, signature}` to `qa-failure-ledger.json` on the dedicated `qa-ledger` branch via the contents API (branch auto-created from master's sha on first use), prunes entries >30d, outputs `recurrence_count` over a 14d window.
- Escalation: the existing failure PR comment + Slack ping get a `:repeat: RECURRING FAILURE: Nth '<sig>' failure in 14 days` prefix (with ledger link) when count >= 2; rest of both messages untouched. Both stay behind the PR #200 stale-run guard; the ledger WRITE deliberately does not (data is data, even for a superseded run).
- Verify: YAML parses (js-yaml), `node --check`, `DRY_RUN=1` fixture runs proved append/prune/count + `GITHUB_OUTPUT` plumbing (counts 1/2/3 as expected, 40d entry pruned, malformed entry dropped), Slack escalation shell logic simulated for empty/1/2/3/5/garbage counts, `npm run qa:docs` green. NOT verifiable locally: an actual red run — **the next real QA failure is the ledger's first live test** (expect the `qa-ledger` branch to appear then).
- Revert: `git revert 2fec0cf` (optionally delete the `qa-ledger` branch; it is data-only and harmless to leave).
- Gotcha: the ledger step's missing/garbage `recurrence_count` (its step is continue-on-error) is normalized to 0 in both consumers, so escalation silently skips instead of erroring the notification steps.

---

## Quick reference — recent additions (Session 68, 2026-07-15)

**Traction analysis → data-driven backlog triage → engine anti-slop hardening (PR #202 MERGED `efd7c25`).**

### What the GSC data says wins (28d: 7,808 impr @ pos 48.5, clicks still ~0)
Joined all 68 posts by format + theme + per-tool branded demand (`scratchpad/gsc_dump.py`, 28d+90d):
- **Migration guides are the only reliable page-1 format** (migrate-substack-to-kit pos 9.4). stack/tutorial rank well but low demand; 3-way comparison is the workhorse (pos 27); **"alternatives" is the worst format (pos 65)**.
- **Winning themes:** enrichment (Apollo/Clay/Lusha, 728 impr, the site's only clicks), newsletter/email (pos 19), CRM. **Traps:** Gong/Outreach ("sales-eng-intel", 346 impr @ pos 64, no program) and automation-platforms (n8n/Make/Zapier, over-produced for its demand).

### Backlog triage (engine auto-fires on Status=Queued)
Notion Content Calendar had **56 Queued** — mostly single-tool `[needs LP]` reviews + duplicates of published posts. Curated to **14 Queued / 18 Suggested / 126 Skipped**. 40 rows scrapped total; 5 weak-format Suggested reshaped into migration/workflow/decision angles. Full split in the STATUS row + op #504.

### Engine hardening (PR #202, `backlog/build-backlog.mjs` only — no shipped-site change)
1. **Anti-slop `NO_ANCHOR` fence** — the builder can never anchor a post on a no-affiliate incumbent the young domain can't rank for (Gong/Outreach/Salesloft/ZoomInfo/Salesforce/Gainsight/Marketo/Clari/6sense/Drift/Highspot). They may be a comparison foil or a migration "from" side, never the `anchorTool`. Prompt states it; `dedup()` drops any that slip through.
2. **Publish-time `--audit-queue`** — dedup only ran at generation, so junk still reached Queued via manual/bulk/stale paths. Dedup refactored to a shared index (`buildIndex`/`collide`/`addToIndex`) used by BOTH `dedup()` and a new `auditQueue()` that re-checks every Queued/Suggested Notion row against the current published corpus; `--prune-apply` auto-Skips hard dedup collisions (fence mentions are advisories only). Near-dup title threshold 0.75→0.72.
Verified: `node --check`, dry-run generation (0 fenced anchors kept), Gong/ZoomInfo/Outreach confirmed real universe entries. **Follow-up:** wire `--audit-queue --prune-apply` into the weekly topic-backlog GHA (NOTION_TOKEN is already a repo secret).

### Verified already-done (guarded against redundant work)
- **CTR titles** — the 4 page-1-zero-click posts were already rewritten 2026-07-09 (`updatedDate` proves it); the "0 clicks" GSC pull predates that change. No churn.
- **Internal-link mesh** — done; 3/76 orphans (motion/trigify/factors-ai) are unclosable because no published post mentions them in linkable prose yet; the CI orphan-flow links new hubs going forward.

### Blocked on Ian
PostHog `phx_` key + a full VS Code restart to pull `affiliate_click` conversion data — the only revenue-true success metric (impressions/position are proxies).

---

## Quick reference — recent additions (Session 67, 2026-07-15)

**PR #199 (Circleback vs Fathom vs tl;dv) looked "failed AGAIN" but was GREEN + MERGEABLE — a stale re-run posted a false "🚨 QA needs tl;dv" 4s AFTER tl;dv was registered on a newer commit. Merged #199. Root-caused the false alarm + opened PR #200 to stop QA commenting from superseded/re-run jobs.**

Ian: "ANOTHER failed PR even though I followed the directions?" — the scary 🚨 was a race, not a rejection.

### What actually happened on #199
- 12:30:29 Ian replied `tl-dv = https://tldv.io/` → `handle-tool-reply.yml` registered it on commit `64daff39` (12:30:41) + posted the ✅ "registered" ack.
- A **manual re-run (attempt 2)** of the OLD commit `695715eb` (pre-registration) started 12:29:54 and finished 12:30:48, posting the `failure()` "🚨 QA needs tl;dv" at **12:30:45** — a verdict about a sha two commits behind HEAD.
- The real run on current HEAD (`29415490526`, evaluated up to its own auto-register commit `7d97bdc8` == HEAD) posted the green ✅ at **12:33:41**. PR was `MERGEABLE` the whole time. **Merged (squash) 12:38.**

### The fix — PR #200 (`ci/suppress-stale-qa-comments`, OPEN, NOT merged)
`qa-content-pr.yml` posted comments based on whatever commit *that run* evaluated, with no check it was still the PR head — so any re-run of an old commit (or a run superseded by a newer push) contradicts reality. Added a **stale-run guard** (two steps: capture local `git rev-parse HEAD`, then compare to the live PR head via `pulls.get`) and gated **all 7 comment/Slack steps** on it. Local HEAD is used deliberately because it INCLUDES the run's OWN auto-register/auto-fix commits, so a legit self-fixing run still counts as current; only a commit landed by *someone else* (a re-run, `handle-tool-reply`, a human) suppresses. Fail-safe: unresolved local HEAD (e.g. checkout failed) → default to posting, so a real infra failure is never swallowed. YAML validated, 7 steps gated. Revert: close PR #200.

### Open thread
Couldn't determine WHO/what triggered the attempt-2 re-run at 12:29:54 (GitHub doesn't expose the re-run actor cleanly). The guard makes it harmless regardless; worth checking whether something auto-retries failed QA runs.

---

## Quick reference — recent additions (Session 66, 2026-07-13)

**Full `/audit-seo` run → [AUDIT-SEO-2026-07-13.md](AUDIT-SEO-2026-07-13.md). Found a LIVE `/go/quickmail` 404 on prod (broken affiliate CTA) that the audit's own scanner structurally cannot see, and root-caused the orphan-hub FLOW. Both fixed at the source: PR #193 (`bc5b5b2`) + PR #194 (`f897d76`), merged + prod-verified. Engine then verified end-to-end — but I DOUBLE-FIRED it, producing two surprise content PRs (#195 + #196, both merged by Ian).**

### Audit results (production)

The July remediations demonstrably worked: **140/145 indexed (96.6%)** (was 122/129), **em/en-dash titles 51 → 0** (S59 tools-title colon fix), **long titles 108 → 34** (S59 conditional brand-suffix), 0 hard on-page, technical crawl fully clean (145 sitemap URLs, zero `/go/` or `/og/` leaks, single-hop redirects, HSTS/nosniff/CSP, `/go/` correctly `noindex,follow`). Lighthouse: home desktop 0.99 / mobile 0.94, post mobile 0.93, SEO 1.00 + CLS 0 everywhere.

### 🔴 CRITICAL: `/go/quickmail/` was 404ing on PRODUCTION (live revenue leak)

The 2026-07-12 cold-email-infra post links `[Quickmail](/go/quickmail/)` in prose, but `quickmail` was never added to [affiliate-links.ts](src/data/affiliate-links.ts), so `go/[tool].astro` never generated the redirect. **Readers clicking a money link hit a 404** (curl-confirmed; controls `/go/maildoso/` + `/go/clay/` = 200). Registered as a `no-program` entry w/ homepage fallback (the S50 mailchimp pattern; `quickmail.com` content-validated as the real product, `quickmail.io` 301s to the apex). Prod now 200 w/ UTM.

**Why two consecutive audits reported "zero critical findings" while this was live:** the `/audit-seo` runbook used `qa:seo` for on-page checks, and **`qa:seo` deliberately SKIPS `/go/` pages** (they're noindex by design) — so it structurally cannot see this class. Only `lint-content --all` checks `/go/` registry integrity, and **CI lints only the CHANGED post**, so a slug that slips past one PR is invisible forever after. Same class as audit C-1 (S40/S41: zapier/canva/creatify). **PR #194 fixes the runbook** ([.claude/commands/audit-seo.md](.claude/commands/audit-seo.md)): it now runs `lint-content --all` FIRST and treats any HARD as Critical, plus an orphan-hub census step.

### Orphan-hub FLOW closed at the source (the structural finding)

**16 of 67 `/tools/` hubs had ZERO in-body inbound links**, and the set regrew on its own. Mechanism: [qa/auto-register-tools.mjs](qa/auto-register-tools.mjs) mints a new tool's `/tools/<slug>/` hub **during CI, AFTER the draft was generated** — so the S63 engine slug feed can only ever offer Generate Draft the hubs that already existed, and **the post covering a new tool was structurally incapable of linking to its own hub**. Every newly covered tool was born orphaned. This is the root cause behind the growth audit's "top-impression pages are orphan hubs at pos 50-78." S62's mesh fixed the *stock*; nothing fixed the *flow*.

**Fix ([.github/workflows/qa-content-pr.yml](.github/workflows/qa-content-pr.yml)):** the auto-register step now runs, immediately after minting the hub:
`node internal-link-mesh.mjs --post "$POST" --orphans-only --no-llm --write`
- `--orphans-only` → touches ONLY hubs at zero inbound links; never rewrites links the engine already placed.
- `--no-llm` → **deterministic + key-free**: it can do nothing but wrap the tool's OWN name in prose that already exists. The lint gate then proves the link resolves.
- The mesh's edits **ride the EXISTING `[auto-register]` commit** rather than adding a new bot-commit prefix, so [auto-merge-content.yml](.github/workflows/auto-merge-content.yml)'s trailing-bot-commit regex (`^\[(auto-register|qa-fix-\d+)\]`) keeps working untouched. **This was load-bearing** — a new prefix would have stranded every auto-merge.

**Two bugs found on the way, in [internal-link-mesh.mjs](internal-link-mesh.mjs):**
1. **Census substring bug hid an orphan.** The check was `body.includes('/tools/' + slug)`. Slugs are prefixes of one another, so `/tools/surfer/` satisfied the test for slug **`surfe`** — a real orphan counted as linked. New `linksToHub()` requires the slug be followed by a non-slug char. True count was **16, not 15**.
2. **AMBIGUOUS guard was over-conservative.** `Warmly` sits in the AMBIGUOUS set (so "warmly" the adverb is never linked), which blocked the fallback on a post *titled* "RB2B vs Warmly vs Vector vs Factors". An ambiguous alias is now fallback-linkable **only when the tool is NAMED IN THE POST TITLE**, where the word is unambiguously the product.

Also: **4 slashless `/tools/` links** (`adcreative`, `nutshell`, `lusha`, `reply-io`) given their canonical trailing slash (site is `trailingSlash:'always'` → each was a needless 301 hop). Orphan **stock 16 → 8** (9 hand-reviewed links across 6 posts).

**The 8 that remained were NOT linkable, correctly:** 7 were LP-only hubs with **no article written** (no prose exists to link from — they need *content*, not a mesh run; still crawlable via the `/tools` A-Z index per S26), and `factors-ai` is only ever named inside an existing `[Factors.ai](/go/factors-ai/)` link or component data, so there is no free prose anchor.

### Engine verified end-to-end — and DOUBLE-FIRED by mistake (the lesson)

Fired the live engine (`sjZADhZGIuz9tZHK`) to answer Ian's "is the output shit or not." **`mcp__n8n__n8n_test_workflow` returned `success:false, "No response from n8n server"` — but it HAD fired.** The temp webhook used `responseMode: lastNode`, which makes n8n hold the HTTP response until the whole workflow finishes (~3 min), so the MCP's 120s timeout always looks like failure. I then listed executions **twice**, saw nothing new (n8n hadn't started the run yet — **absence is not evidence**), concluded it hadn't fired, and re-fired via curl.

**Two runs, two articles, two surprise PRs Ian had to deal with.** Diagnosed after the fact from the trigger node's captured `headers.user-agent`: exec **18790** = `axios/1.17.0` (the MCP tool) → **PR #195** (FullEnrich vs BetterContact vs Surfe); exec **18794** = `curl/8.19.0` (me) → **PR #196** (Storydoc vs PandaDoc vs Qwilr). Memory saved: `reference_n8n_test_workflow_false_timeout` — **never re-fire an n8n workflow on a timeout/failure report; confirm by identity (user-agent), not by absence.**

**The output itself was good, though — which was the actual question.** Both posts **passed EVERY QA gate on first review with zero `[qa-fix]` commits** (auto-register, lint, logo gate, build, render-acceptance, mobile-overflow, screenshots, Vision review → "QA pass"). Both: ~2.3k words, 8 components, **0 em/en dashes**, 0 AI-slop vocabulary, real first-person MyTake, real logos + a real screenshot, working `/go/` CTAs. **The content pipeline is healthy; the only defect this session was mine.**

**PR #196 was the first live firing of the orphan fix, and it worked:** its `[auto-register]` commit auto-added in-body `/tools/` links for all **4 brand-new hubs** (storydoc, pandadoc, qwilr, getaccept) — hubs that would previously have been born orphaned. Orphans now **5/72** (was 16/67) **while adding 5 new hubs**.

### Deliberately NOT fixed (do not re-litigate)

- **Blog-post mobile LCP (2.7s).** The S59 audit's #1 recommendation ("preload the hero, check image sizing, confirm `font-display: swap`") is **disproven by measurement**: `render-blocking-insight` reports **zero** blocking resources (the S59 CSS inlining removed the last one), `font-display-insight` is clean, and the LCP element is a **text node** (`p.post-tldr-text`) — breakdown is TTFB 212ms + **element render delay 1210ms**. There is no image to preload and no font to unblock; the remainder is main-thread work under Lighthouse's 4x CPU throttle. This loop has now run **three times** (S39 fonts, S59 CSS, S66). **CrUX field data is the arbiter. Stop investing.**
- **The 1 crawled-not-indexed post** (`2026-05-08-cheap-outbound-...`): its last crawl (**2026-07-03**) *predates* both the 7/07 internal links (PR #170) and the 7/07 Request Indexing. Google hasn't re-evaluated it. Re-run `gsc-index-status.py` ~1-2 weeks; escalate only if still stuck after a post-7/07 crawl date. (The other previously-stuck post, `hubspot-data-quality`, is now **indexed** — that remediation worked.)

### Cadence note

**3 posts published 2026-07-13** (the 8am cron's Bland AI post + my two double-fire posts) against the deliberate **hold at 1/day** policy, burning 2 extra queued topics (~72 days runway remains, so not scarce). **Ian's call: leave both.**

### Key notes

- **Reverts:** `git revert bc5b5b2` (PR #193 — 4 independent commits: quickmail / mesh+content / CI / docs) · `git revert f897d76` (PR #194 runbook). #195 + #196 are content.
- Engine left **active, exactly 32 nodes**, temp webhook removed (no leftover trigger surface).
- Worktrees `C:\tmp\tag-orphan-hubs` + `C:\tmp\tag-audit-cmd` (both removed; the OneDrive read-only worktree-metadata prune from S59 applies).

---

## Quick reference — recent additions (Session 65, 2026-07-13)

**PR #191 (Bland AI vs Vapi vs Synthflow) failed the lint gate: `/go/aloware` would 404. Root-caused TWO more auto-register defects — a discovery-scope gap (the visible failure) and a homepage-probe flaw that would have silently registered the WRONG Aloware domain next. Fixed both + registered Aloware. PR #191 QA green + MERGEABLE; NOT merged (awaiting Ian, same classifier-gate protocol as #187).**

Ian: "pr 191 failed AGAIN. Why does stuff keep failing?" The red was the lint gate doing its job; the gap was upstream of it, in what auto-register can *see*.

### The two defects (both in [qa/auto-register-tools.mjs](qa/auto-register-tools.mjs), commit `dcb5a97`)

1. **Discovery scope narrower than the gate it feeds (the visible failure).** `parsePost()` only discovered tools via component `affiliateSlug` props (ComparisonTable/ToolBreakdown rows), but `lint-content` hard-fails on **EVERY** `/go/<slug>` in the body. The engine's post mentioned Aloware only as an inline markdown link (`[Aloware](/go/aloware/)`, the "deserves a mention" paragraph) — invisible to auto-register (not even `unresolved`; simply never seen), so CI registered bland-ai/vapi/synthflow and the lint then hard-failed on aloware. **Discovery now covers the markdown-link form (link text = display name) + any bare `/go/<slug>`, matching the lint gate's scope exactly.** Principle: a pre-gate fixer must scan the same surface as the gate it's meant to satisfy, or the gap class recurs forever.

2. **Bare-brand app-shell would have beaten the real homepage (caught before it shipped).** With defect 1 fixed, the TLD probe resolved `aloware.io` — Aloware's **login SPA** (title just "Aloware", no og tags, no h1) — because its bare-brand title earns the `+100` startsWith bonus while the REAL `aloware.com` fails the identity check outright (its title, "Top-Rated Contact Center Software | Built For Your Favorite CRM", never names the brand; og:site_name absent). Same shape as the S64 raw-domain-title placeholder check, bare-brand variant: **a title that is exactly the brand, with no og:image AND no og:description, is now rejected as an app shell** → the tool goes `unresolved` → the PR-comment human-confirm flow (reply `aloware = https://aloware.com`), instead of registering a wrong homepage silently.

### PR #191 data (commit `37500c1` on the content branch, master merged in via `3ee6db3`)

`aloware` registered via `--url-hint aloware=https://aloware.com/` (probe can't self-resolve it — see defect 2): affiliate-links.ts `pending` entry w/ homepageFallback `https://aloware.com/`, tools.ts entry (category inherited: `AI Voice & Dialers`, `listed: false`), logo = Aloware's official 256px apple-touch-icon.

### Verification

`lint-content` on the post **1 hard → 0 hard / 0 warn**; `lint-logos` 0 hard (aloware.png clean). CI run `29251801609` **green — "QA pass on first review"**, PR `MERGEABLE`/`CLEAN`. Deploy preview live-checked: `/go/aloware/` **200 → aloware.com** (not the .io shell), logo 200, post 200. Dry-run regression: bland-ai/vapi/synthflow still resolve to the same homepages as before the probe change.

### Key notes

- **PR #191 is GREEN but NOT MERGED** — Ian merges (content PR carrying agent commits, per the S64 protocol).
- **Reverts:** `git revert dcb5a97` on master (script fixes) and `git revert 37500c1` on the content branch (the Aloware data) are independent.
- The stale `action_required` run stub (29248385374) from the CI bot's own `[auto-register]` push is superseded by the green run; ignore it.
- Worktree: `C:\tmp\tag-pr191` (removed after push). `node_modules` junctioned in for `sharp` via `cmd //c mklink /J` (S64 gotcha holds: quote the whole command through `cmd //c`, Git Bash eats bare backslashes).

---

## Quick reference — recent additions (Session 64, 2026-07-11)

**PR #187 (Surfer vs Frase vs Clearscope) failed QA. Root-caused FOUR defects in `qa/auto-register-tools.mjs` — the visible failure was the least bad of them; two silently shipped a WRONG homepage + wrong logo rather than failing. Fixed all four + re-registered the PR's tools. PR #187 QA green + mergeable; NOT yet merged (awaiting Ian).**

Ian: "pr187 failed wtf?" The red was the lint gate hard-failing on 4 errors (`/go/frase` would 404). That part worked as designed. What it was covering for did not.

### The four defects (all in [qa/auto-register-tools.mjs](qa/auto-register-tools.mjs), commit `6fca299`)

1. **Identity read from a 20KB byte slice → rejected the tool's OWN homepage (the visible failure).** `resolveHomepage()` parsed `<title>`/og tags out of `html.slice(0, 20000)`. **frase.io closes `</head>` at byte ~4,188 but emits its real `<title>` at byte ~172,331** (client-rendered page), so the window read an EMPTY identity, concluded frase.io does not identify as "Frase", and declined → `unresolved` → lint gate red. **Neither a byte slice nor `</head>` is a safe bound** (the `</head>` bound was tried first and also failed). Now reads the WHOLE document via a new `metaOf()` and collects **every** `<title>` (a page can carry several — inline SVGs have them), picking the one that names the tool.

2. **A half-registered tool got its known-good homepage re-derived.** `surfer` was **already in affiliate-links.ts with `homepageFallback: 'https://surferseo.com/'`**; auto-register ran only to source its missing logo, and re-probed the homepage from scratch anyway — landing on a domain broker. The registry is now consulted FIRST (`registryHomepages()`) and trusted (new `fromKnownUrl()` helper, shared with the `--url-hint` path). The answer was sitting in the file it was about to write to.

3. **Parked-domain scoring flaw, THIRD occurrence (artisan.so S57, calendly.ai S60).** `surfer.app` is parked and titled **"Surfer.app is for sale"** → `PARKED_RE` only matched the literal word *domain* before "for sale", so it passed; then its bare-domain title earned the `+100` startsWith bonus while the real `surferseo.com` (title "Positive Surfer - AI Visibility Platform…") got only `+50`. It **registered Surfer against `https://www.fortune.domains/` and committed that broker's favicon as `surfer.png`.** Fixed **structurally** rather than adding a 4th copy-pattern: **reject any candidate whose FINAL host carries none of the brand's identity stems.** A parked domain redirects to the broker's own host; a real one keeps the brand (`surfer.ai` → `surferseo.com`). `PARKED_RE` also broadened to the `<domain> is for sale` form.
   - **Regression-verified against every historically-tricky tool** — justcall.io, otter.ai, customer.io, artisan.co, calendly.com, factors.ai, activepieces.io, bardeen.ai **all still resolve**; the S57 PARKED_RE + S60 generator guards still catch artisan.so + calendly.ai (guards compose, nothing regressed).
   - **Bonus catch:** the host guard also rejects two competitor squats the old code would have scored — **`otterai.ai` / `otterai.app` → transkriptor.com**, and **`surferseo.ai` → humanize.ai**.

4. **`pickIcon()` preferred `rel="mask-icon"`.** It scored `60 + 50`-for-svg = **110**, beating a sizeless `apple-touch-icon` (100). A mask-icon is a **Safari pinned-tab mask — the spec makes it a single flat colour**, so it can never be a brand logo. That is how surfer got a black silhouette. Now never taken.

**Also:** new tools inherit their `category` from the already-registered tool in the same post (auto-register only ever runs on head-to-head comparisons, so the tools are the same kind by construction) instead of the flat `'Sales Engagement'` default, which had filed the SEO tools **Frase + Clearscope under sales** on their `/tools` hubs.

### PR #187 data (commit `e285bd4`)

Registries regenerated from scratch against the fixed resolver: **frase** registered (`www.frase.io`, was the unresolved blocker); **surfer** logo replaced (fortune.domains' favicon → Surfer's real mark from surferseo.com; its homepage was correct all along); **clearscope + frase** category → `SEO & Content`.

### Verification

`lint-content` on the post **4 hard + 1 warn → 0 hard / 0 warn**; `lint --all` 0 hard across 65 posts; `lint-logos` 0 hard; `astro build` clean (223 pages); render-acceptance 0 hard; auto-register **idempotent** on re-run (no bot re-push in CI → **no `action_required` stub run this time**). All 3 logos rasterized over the cream card bg and eyeballed = the real brand marks. **CI `qa` green + Netlify deploy-preview green + `mergeable: MERGEABLE`.** Deploy-preview live-checked: `/go/{frase,surfer,clearscope}/` all **200** and pointing at `frase.io` / `surferseo.com` / `clearscope.io` (not the broker); all 3 logos 200; post 200; Playwright desktop 1280 + mobile 390 → ToolBreakdown renders all 3 real logos, **0px horizontal overflow**, all 3 `/go/` CTAs present (mobile logos are `loading="lazy"`, load on scroll).

### Key notes

- **PR #187 is GREEN but NOT MERGED** — the merge was classifier-gated (a content PR carrying only agent commits, no human approval). Ian merges, or re-authorizes.
- **Reverts:** `git revert 6fca299` (pipeline hardening) and `git revert e285bd4` (the re-registered data) are independent — deliberately split so either can be rolled back alone.
- **The failure class is now closed at the source three ways:** the resolver can't miss an identity it can see, can't re-derive a homepage it already knows, and can't land on a host that isn't the brand's.
- Worktrees: `C:\tmp\tag-pr187` (content branch), `C:\tmp\tag-s64-docs` (this log). `node_modules` junctioned in for `sharp` — **`mklink /J` via Git Bash eats the backslashes**; run it through `cmd //c "mklink /J <link> <target>"` with the whole command quoted.

---

## Quick reference — recent additions (Session 63, 2026-07-09)

**Built + deployed the deferred engine work from S62: the S-1(b) internal-link slug feed (so NEW posts get the contextual mesh at generation, 404-safe) + the last S-4 CTA-floor lint piece. Engine LIVE (32 nodes, GET-verified). Also fixed a live `/go/factors-ai` 404 the new lint surfaced.**

Ian: "ok let's do that now" (the separate n8n-deploy session S62 deferred). Confirmed first that S54 already shipped most of S-4 (CTA-floor skeleton + general first-mention /go/ rule + trailing-slash sanitizer), so the real build was S-1b.

**S-1(b) engine slug feed — [n8n/update-engine-internal-links.mjs](n8n/update-engine-internal-links.mjs), deployed live (29 → 32 nodes):** the reason this was punted in S52 was hallucinated-404 risk on new in-body /tools/ + /blog/ links. Closed it by feeding the engine the EXACT valid targets at generation:
- 3 new nodes wired `Mark Topic Generating → Fetch Tools Registry → Fetch Blog List → Build Link Targets → Generate Draft`. Two unauthenticated httpRequest GETs (the repo is PUBLIC): `raw.githubusercontent…/src/data/tools.ts` (hub slugs) + the GitHub contents API for `src/content/blog` (recent post slugs). Both `neverError:true` → a GitHub hiccup degrades to "no mesh that day", never a broken run. `Build Link Targets` is a pure-parse Code node (no network) → `{hubSlugsCsv, postSlugs, recentPostsList}`.
- **Generate Draft** gained an INTERNAL LINKS section interpolating those lists (`${$('Build Link Targets').first().json.hubSlugsCsv}` — same proven pattern as the existing `$('Parse Topic')` interpolations; braces stay 1/1 so the `{{ }}` tokenizer footgun is untouched): link 2-4 in-body mentions to `/tools/<slug>/` hubs (a DIFFERENT occurrence than the /go/ CTA) + 1-3 genuinely-related `/blog/<slug>/` siblings, ONLY from the given slugs.
- **Humanize** gained an INTERNAL LINKS verify (preserve, never invent).
- **Parse Draft** gained `guardInternalLinks()` (real jsCode, backticks safe) applied as `guardInternalLinks(sanitizeMdx(...))` — deterministically strips any `/tools/` or `/blog/` link whose slug isn't in the fetched valid set (unwraps to plain text). **Fail-OPEN per-list**: if a fetch returned nothing that list is left alone (the CI lint backstops), so a fetch miss can't nuke every internal link. Load-bearing guard per `feedback_deterministic_sanitizer_over_prompt`.
- **Verified**: JSON round-trips, both prompt expression bodies compile + stay 1/1 `{{`, both code nodes compile; the parse + guard **unit-tested against real fetched data** (61 hub slugs, 12 post slugs; guard keeps valid, strips invalid to text, leaves /go/ CTAs, fail-opens on empty); idempotent re-run (0 applied); deploy `--apply` + live GET (all 3 nodes + all markers + chain present, active untouched).

**S-4 CTA floor — [qa/lint-content.mjs](qa/lint-content.mjs):**
- New WARN: a post that names ≥2 registered tools (by name/alias, with an AMBIGUOUS_NAMES guard so "make"/"close" prose can't inflate the count) but exposes <2 affiliate CTAs (/go/ + affiliateSlug). Fired correctly on the 7/02 GEO post (2 tools, 0 CTAs). Non-hard: comparison posts clear it via ToolBreakdown.
- New HARD `/blog/<slug>/` 404 check — the mesh + engine feed emit /blog/ links but they were previously UNvalidated (only /go/ + /tools/ were). **Anchored to internal-link context** (`](/blog/` or `href="/blog/`) after the first pass false-fired on external blog URLs cited in `<Sources>` blocks (emailtooltester.com/en/blog/…). Negative-tested.

**Live `/go/factors-ai` 404 fix — [src/data/affiliate-links.ts](src/data/affiliate-links.ts):** the new lint surfaced 3 hard errors on the 7/09 RB2B post: S61 (PR #177) auto-registered `factors-ai` in tools.ts + logo but the **affiliate-links.ts entry never landed**, so `/go/factors-ai/` **404'd on prod** (curl-confirmed) — a live broken money link. Added the `factors-ai` pending entry (homepageFallback `https://www.factors.ai/`, customerio pattern). Build clean (210 pp); `/go/factors-ai/` now redirects with UTM. `lint --all` back to **0 hard**.

**VERIFIED END-TO-END LIVE (same session):** rather than wait for the 8am cron, fired the real engine on a backlog topic — temporarily added a Webhook trigger via n8n MCP (`n8n_test_workflow` only fires webhook/form/chat, and the public API can't invoke the Manual/Schedule triggers), ran it, then removed the webhook (back to 32 nodes). Exec `17248` **success**. The previously-unexercised path is now proven: the `Build Link Targets` node returned **61 hub + 12 post slugs from n8n Cloud** (egress to raw.githubusercontent + GitHub contents API + response-shape parse all work live); Generate Draft wove in **2 `/tools/` (n8n, pabbly) + 2 `/blog/` sibling links, all from the fed slugs and all reading naturally in-context** (not slop — e.g. "the [Relevance AI vs Lindy vs n8n comparison](/blog/…) is worth reading alongside this one"); the guard kept all (every slug valid, none stripped); auto-register resolved the 2 new tools (activepieces→activepieces.io, bardeen→bardeen.ai); the `qa` gate went **green**; deploy-preview + **prod all 200** (post, both `/tools/`, both `/go/`). **PR #184 MERGED** (`fc64cd7`, topic "Activepieces vs Bardeen vs Pabbly"), published to prod. **Zero issues found.** (Degradation note kept for the record: a rate-limited contents API — shared-IP, 60/hr unauth — would drop related-post linking for a day while hub linking via the CDN stays; the guard + CI lint backstop 404s either way.) **Revert:** `git revert <squash-sha>` (all additive) + re-run `deploy-engine.mjs --apply` against the reverted JSON to roll the live engine back.

---

## Quick reference — recent additions (Session 62, 2026-07-09)

**PR #180 (OPEN, `content/seo-internal-links-freshness`, 70 files, +711/-152) ships the top SEO/GEO growth levers in one content PR; grounded in a fresh 2026-07-09 GSC snapshot. Engine-side work (S-1b slug feed + S-4 CTA floor) deferred to a separate n8n-deploy session.**

Ian asked about pushing content volume to 2-3/day. Pulled a fresh **2026-07-09 GSC snapshot** (new [gsc-search-analytics.py](gsc-search-analytics.py), Search Analytics API, same cached `~/.gsc/` token): 28d = **8 clicks / 5,994 impr / CTR 0.13% / avg pos 51** vs the 7/03 baseline (7 / 5,040 / 0.14% / 51) — impressions up ~19%, clicks still flat at ~0. Decisive detail: **17 posts + 1 hub rank page-1 (pos ≤10) with zero clicks**, and the **top-impression pages are the orphan tool hubs** (/tools/getresponse pos 50, bland-ai 65, lusha 78). Bottleneck is authority/CTR, not supply → **recommendation: hold at 1/day**, fix the mesh + CTR first. Queue is NOT the constraint: **74 topics Queued** in Notion as of 7/09 (~74 days runway).

**PR #180 (verified build 137pp / lint 0 hard / mobile-overflow 0/61):**
- **S-1(a) internal-link mesh** — new [internal-link-mesh.mjs](internal-link-mesh.mjs): per post the LLM picks a **verbatim existing phrase** to hyperlink (it never writes prose); the script wraps it deterministically with forbidden-range guards (code fences, existing links, multi-line `<Component>` blocks, headings) + an anchor-length cap; a name-fallback links the tool's own name at its first safe prose occurrence (non-ambiguous aliases only, so "Make" is never linked inside "Make sure"). **179 contextual links across 59 posts; 42 hubs now have in-body inbound links, up from 4.** Idempotent (per-href dedup). **AI-detection-safe by construction** (only re-wraps Ian's own words, zero generated prose). 3 QA iterations closed the component-prop / heading / clause-anchor edge cases.
- **S-3 freshness** — `updatedDate: 2026-07-09` on all 59 edited posts, so `dateModified` JSON-LD + the "Updated" byline now populate (cheapest EEAT signal; bootstraps the S-3 process).
- **S-2/S-7 schema** — `SoftwareApplication` JSON-LD on all tool hubs; `ItemList` on /reviews, /playbooks, /teams/* via new shared [ItemListSchema.astro](src/components/ItemListSchema.astro).
- **S-5 title/CTR** — the **4 audit-scoped titles only** (voice preserved, no dashes, ≤57ch, freshness-dated): migrate-substack-to-kit ("in 2026"), apollo-vs-clay ("Sales Nav" to "Sales Navigator"), clay-smartlead-n8n ("The 2026 Cold Email Stack"), revops-500mo ("The $500/mo" front-loaded). **Deliberately did NOT churn the other ~13 page-1-zero-click titles**: they're already strong, their zero-clicks are position/volume-driven, so mesh + freshness are the real lever and rewriting good indexed titles would churn rankings + strip the first-person voice.
- **S-6** — circleback `/go` homepage fallback `www.` to apex (apex 200, `www.` TLS-fails; kills the interstitial).
- **Bug fix** — [qa/lint-content.mjs](qa/lint-content.mjs) tool-slug regex made quote-agnostic (was single-quote-only, blind to double-quoted LP-builder hubs like attio/fillout; would have 404-flagged the new mesh links). Same class as the S28 registry.mjs fix.
- **Tooling** — `gsc-search-analytics.py` (repeatable GSC clicks/impr/CTR/pos snapshot + page-1-zero-click set); `backlog/build-backlog.mjs --status` (read-only Content Calendar queue census; needs `NOTION_TOKEN`).

**Revert:** `git revert <PR #180 squash-sha>` (all additive). **Worktree:** `C:\tmp\tag-seo-mesh` (removed). **Still open (separate n8n-deploy session):** S-1(b) engine slug feed (new posts get contextual hub + sibling links at generation, else the mesh decays as posts publish) + S-4 tutorial CTA floor, both engine-prompt changes needing one live n8n redeploy (build, QA, deploy once verified).

---

## Quick reference — recent additions (Session 61, 2026-07-09)

**PR #177 (RB2B vs Warmly vs Vector vs Factors) failed QA again — root-caused TWO independent failures behind "why can't it find the URLs?", unblocked the PR, then shipped two durable fixes that close the class. PR #177 MERGED (`8b67a00`); fixes PR #178 MERGED (`045a3f8`).**

Ian: "PR177 failed AGAIN why can't it find the URLs? When I google factors.ai there are clear URLs available wtf?" It was never a Google/availability problem — two separate mechanisms:

- **Root cause 1 — auto-register genuinely can't resolve `Factors.ai` (the dotted-domain class).** The post's slug is `factors-ai`. `resolveHomepage()` de-hyphenates to `factorsai` and the TLD probe only ever builds `factorsai.com/.io/.ai/...` — it **never constructs the real `factors.ai`** (where the `.ai` IS the TLD, not part of the name), so it correctly declined and posted the "QA needs one thing" ask. Same family as customer.io (S48). This half worked as designed.
- **Root cause 2 — Ian's reply couldn't be parsed (the actual "nothing happened").** [handle-tool-reply.yml](.github/workflows/handle-tool-reply.yml) only understood `slug = url`. Ian replied `Factors AI link: https://www.factors.ai/` — no `=`, zero pairs. **Worse:** his reply quoted the entire bot comment, so the only `slug = url` pattern *anywhere* in the body was the bot's own example ``otter = https://otter.ai`` — i.e. if the (runner-stuck) reply-handler had parsed anything, it would have registered **Otter**, not Factors. (GitHub runners were badly backed up all session; the reply-handler run sat queued ~13 min then died at infra with no steps — harmless.)

### Unblock (PR #177, `bdd43c9` → merged `8b67a00`)

`C:\tmp\tag-pr177` worktree (no OneDrive churn), `node_modules` junctioned from the main checkout so `sharp` was available: `node qa/auto-register-tools.mjs --post <mdx> --url-hint factors-ai=https://www.factors.ai/` → registered `factors-ai` in affiliate-links.ts + tools.ts + sourced a real 256×256 logo (`unresolved: []`). `lint-content` + `lint-logos` both 0 hard → pushed → Netlify preview green → merged.

### Durable fixes (PR #178, `045a3f8`; worktree `C:\tmp\tag-pr177-fix` off master)

1. **[qa/auto-register-tools.mjs](qa/auto-register-tools.mjs) — dotted-domain probe.** If the slug's last hyphen segment is a known TLD (`ai`/`io`/`co`/`so`/`app`/`dev`/`com`), read it as the TLD: add `<stem>.<tld>` (e.g. `factors.ai`) to the probe hosts AND add the bare stem (`factors`) to the identity targets (the site titles itself "Factors.ai: The AI ABM…", so the stem is the real identity). Refactored the `bases × TLDS` double-loop into one de-duped `hosts` Set; the placeholder check and TLD tiebreak now derive from the host string. **Verified end-to-end** on a throwaway post: `factors-ai` auto-resolves to `https://www.factors.ai/` with **no url-hint**; test registry/logo writes reverted so the diff is code-only. Also recovers customer.io / reply.io without a human hint.
2. **[.github/workflows/handle-tool-reply.yml](.github/workflows/handle-tool-reply.yml) — accept a bare URL + kill the quote trap.** New `pending` github-script step scrapes the `affiliateSlug`(s) from the latest github-actions "QA needs one thing" ask on the PR. The parse step now (a) **drops reply-quoted lines** (`^\s*>`) FIRST, so the bot's `otter = https://otter.ai` example inside a quoted comment is never parsed, and (b) when exactly ONE tool is pending and no explicit `slug = url` is given, maps the first bare URL in the reply to that slug. **Verified** against Ian's actual PR #177 reply → `factors-ai=https://www.factors.ai/` (otter ignored); the pending-slug regex tested against the real bot comment → `factors-ai`; YAML parses (8 steps).

### Key notes

- **The rigid `slug = url` reply format has now silently swallowed Ian's replies twice** (S51 = backtick-wrapping; S61 = natural language + quoted example). Bare-URL acceptance is the real durable fix; the resolver change means `.ai`/`.io`/`.co` brands shouldn't even reach the reply step anymore.
- **Reverts:** `git revert 045a3f8` (both fixes) · the #177 squash is content.
- Worktree `node_modules` junction trick (for `sharp` in an isolated worktree): `cmd //c mklink //J <worktree>\node_modules <main>\node_modules`, then `cmd //c rmdir` the junction before `git worktree remove` so it can't recurse into the real tree.

## Quick reference — recent additions (Session 60, 2026-07-08)

**PR #174 (Cal.com vs Calendly vs Chili Piper) failed QA again — root-caused TWO auto-register pipeline defects (opaque sourced logo + a squatted-domain registration the S57 parked guard missed), fixed the PR data, and hardened the pipeline so auto-register can no longer ship a logo or homepage its own gates reject. PR merged (`b8ce4ad`) + prod-verified.**

Ian: "PR174 failed AGAIN this needs to STOP." The red was the deterministic **logo gate**: `chili-piper.png` (sourced by auto-register from the webclip icon) shipped with an opaque white background. Investigating surfaced two more latent defects on the same PR:

- **Calendly was registered against `calendly.ai` — a GoDaddy Website Builder placeholder page (squatted domain), not Calendly.** The placeholder's title is literally "calendly.ai", so it earned the brand-startsWith +100 bonus and outscored the real `calendly.com` (whose title only *contains* the brand) — the exact artisan.so scoring flaw from S57, but the PARKED_RE guard missed it because a site-builder placeholder carries no for-sale copy. Consequences on the branch: `/go/calendly` redirected readers to a parked page, the blurb was the generic fallback, and `calendly.jpg` was **GoDaddy's default icon**, not Calendly's mark.
- **`calendly.jpg` slipped the logo gate entirely**: [qa/lint-logos.mjs](qa/lint-logos.mjs) scanned only `png/webp` — a JPEG has no alpha channel (opaque by construction) and would have rendered in a box on the cream cards, silently.

### PR data fixes (commit `0d8d312` on the branch)

`chili-piper.png` white background knocked out (red mark on transparency); calendly `homepageFallback` → `https://calendly.com/`; blurb → real og:description; logo → Calendly's transparent brand-blue mark (initially the 48px Google-favicon fallback; same-day follow-up PR #176 `d53aca7` upgraded it to the official hi-res wordmark, 661x160, Ian-supplied source); the GoDaddy placeholder jpg deleted.

### Pipeline hardening (commit `05cf0a5` — the "make it STOP" part)

1. **[qa/auto-register-tools.mjs](qa/auto-register-tools.mjs) — sourced-logo validation (`validateRasterLogo`)**: every raster icon now passes the SAME 4-corner transparency bar as the lint gate before being written. All-4-corners-opaque → background knockout keyed on the corner color (output png); a candidate whose surviving mark would be near-invisible on the cream cards (mean luminance >215 — the mailreach trap) or nearly empty is **skipped for the next icon URL**; if `sharp` is unavailable, raster logos are rejected rather than shipped unvalidated (SVGs pass through). Verified against the real failures: the original opaque chili-piper.png gets FIXED, the GoDaddy calendly.jpg gets REJECTED, the clean calendly.png passes untouched.
2. **[qa/auto-register-tools.mjs](qa/auto-register-tools.mjs) — placeholder-page guard**: after PARKED_RE, candidates are rejected when `<meta name="generator">` names a parking/site-builder product (godaddy/starfield/sedo/parking) OR the title is just the raw probed domain on a page with no og:image. Live-verified: calendly.ai REJECTED (generator = "Starfield Technologies; Go Daddy Website Builder"), calendly.com kept.
3. **[qa/lint-logos.mjs](qa/lint-logos.mjs)** now scans `jpg/jpeg` too (always opaque → hard fail; closes the calendly.jpg blind spot).
4. **[.github/workflows/qa-content-pr.yml](.github/workflows/qa-content-pr.yml)**: the auto-register + lint-content steps moved AFTER `npm ci` so `sharp` is available to the validator in CI (under the old before-deps order, the hardened script would have silently dropped every logo on the runner).

### Verification

Local: auto-register idempotent on the post (`unresolved: []`, no new changes); lint-content 0 hard; lint-logos 29 checked 0 hard; `astro build` + render-acceptance clean; workflow YAML parses with the new step order confirmed. CI: the re-triggered QA run (`28944186742`) ran EVERY gate under the new order — auto-register, lint, logo gate, build, render-acceptance, mobile-overflow, screenshots, Vision review — **all green, no auto-fix needed**. Merged (`b8ce4ad`). Prod: post 200, `/go/calendly` → `calendly.com/?utm_source=theautomationsguide` (not the parked page), `/go/chili-piper` 200, both logos 200, `calendly.jpg` 404 (gone).

### Key notes

- **Reverts:** data fixes + hardening merged in `b8ce4ad` (squash) — `git revert b8ce4ad` restores the broken state (don't). The two logical changes were separate commits on the branch (`0d8d312` data, `05cf0a5` hardening) if archaeology is ever needed.
- **The failure surface is now closed at the source**: the resolver can't register a site-builder placeholder, and any logo auto-register commits has provably transparent corners (or the tool ships logo-less, which is a WARN + a one-line human upgrade later — never a red PR).
- Worktree: `C:\tmp\tag-pr174` (removed after merge).

---

## Quick reference — recent additions (Session 59, 2026-07-07)

**Full `/audit-seo` run → [AUDIT-SEO-2026-07-07.md](AUDIT-SEO-2026-07-07.md): zero critical findings. PR #170 merged (`92ed1de`) with the remediations: CSS inlining (LCP), conditional title brand-suffix, dash-free tools titles, internal links to the crawled-not-indexed budget-stack post.**

### Audit results (production)

- **Technical crawl fully clean:** robots.txt (AI crawlers allowed) + sitemap-index 200 with 129 URLs and zero `/go/`/`/og/` leaks; single-hop redirects (no-slash/www/http); HSTS + nosniff + CSP; `/go/` pages correctly `noindex,follow` + meta refresh.
- **On-page:** `qa:seo` PASS, 0 hard issues. JSON-LD complete on spot-check (BlogPosting/BreadcrumbList/FAQPage/SoftwareApplication/Person/Organization/ImageObject) + byline `rel="author"` + TL;DR box.
- **GSC (URL Inspection API):** 122/129 indexed; 5 "unknown to Google" (all pages published ≤5 days ago, normal); 2 "Crawled - currently not indexed" (May-08 cheap-outbound-stack + Jun-18 hubspot-data-quality, both verified 200/self-canonical/indexable = crawl-budget wait). **@high TODO: manual Request Indexing for the 7 URLs** (full list in the audit file).
- **Lighthouse:** home 1.00 desktop / 0.99 mobile, SEO 1.00 everywhere; post mobile LCP 2.6s = the one Medium finding. BP 0.77 = known third-party-cookie/CSP cap.

### Changes (PR #170, squash `92ed1de`)

1. **`astro.config.mjs` `inlineStylesheets: 'always'`** — post LCP element is text (TL;DR box) and the ~34KB CSS bundle was the last render-blocking request. **Honest outcome:** post-deploy render-blocking requests = 0 (insight score 1), but simulated-mobile LCP is unchanged within run noise (3-run median 2.7s vs 2.6s pre; the ~1.2s element render delay is main-thread parse/font work, not CSS fetch). Directionally right for field users (one less blocking round trip); **CrUX field data is the arbiter, same conclusion as the S39 font work.**
2. **`BaseLayout.astro`** — `| The Automations Guide` suffix now appended only when the full `<title>` stays ≤62 chars (long-title warnings 108 → 32; the remaining 32 are headlines long on their own → @low editorial TODO item).
3. **`tools/[tool].astro`** — title em dash → colon (em/en-dash title warnings 51 → 0; house no-dash style).
4. **Internal links** — contextual in-body links from the $500/mo stack + $1K/mo enterprise stack posts to the crawled-not-indexed under-$200/mo post (it had zero in-body links from other posts; the hubspot-data-quality one already had 4).

### Key notes

- **Revert:** `git revert 92ed1de`.
- **`/audit-seo` discovery gotcha:** the project slash command only loads when the session starts inside `theautomationsguide/`; a session rooted at `claude_projects/` won't see it (this session ran the command file manually).
- **Stale-checkout gotcha (again):** the OneDrive checkout's `master` was 35 commits behind origin; session edits made there were cherry-picked through `C:\tmp\tag-seo-s59` per the worktree convention, re-verified against real HEAD (long-title count 31→32 corrected), then PR'd. Local master reset to `origin/master` after merge.
- REDDIT_PLAYBOOK.md backup-drift flag = **false positive second session running** (untracked local copy blob-identical to origin/master; S57 hit the same thing). If it flags again, just delete the local untracked copy — resolved this session by the master reset.
- GSC token (`~/.gsc/token.json`) refreshed silently; the checker inspected all 129 URLs foreground-backgrounded with zero interim output because the run was piped through `tail` — expected, not a hang.

### Same-day follow-up (op #440)

- **Ian submitted all 7 URLs to GSC** → TODO item closed (PR #172 `3c5eb31`), todo-sync'd to root + Notion. Re-run `gsc-index-status.py` ~2026-07-21 to confirm the transitions.
- **OneDrive checkout reset executed** (Ian's explicit OK; the earlier attempt was classifier-blocked): `git reset --hard origin/master` after verifying both stray local commits were byte-duplicated upstream; 3 merged session branches deleted. Checkout now tracks origin exactly — backup-drift flags should be clean.
- **RECOVERY NOTE — the chronic "failed to delete `.git/worktrees/<x>`: Permission denied" spam is fixed**: OneDrive marks worktree metadata read-only/locked, so git's auto-prune can never delete stale entries and every git op re-prints ~20 errors. Fix: `git worktree prune -v` names the stale ones ("gitdir file does not exist"), clear read-only attrs via PowerShell, `Remove-Item -Recurse -Force` ONLY those git-confirmed-stale dirs. 20 removed; the 7 live worktrees (`astro-upgrade-theautomationsguide`, `tag-affiliate-fix`, `tag-docs-s49/s50`, `tag-lows`, `tag-pr143`, `tag-tbd-align`) untouched. If the spam returns, repeat — never delete a metadata dir git hasn't confirmed stale.
- Full end-to-end verification green: prod shows all 4 PR #170 changes (0 render-blocking stylesheets, colon tools titles, conditional suffix both directions, both internal links) with no regressions (/go/ noindex, sitemap 129/0 leaks, 1-hop redirects, S58 search CSP intact).

---

## Quick reference — recent additions (Session 58, 2026-07-07)

**PR #168 merged (`22e0145`): production site search was completely broken (CSP blocked Pagefind's WASM) + desktop nav dropdown hover gap fixed. Notion publish writeback audited = working (false alarm).**

### Root causes

1. **Search dead in prod** — `public/_headers` CSP `script-src` lacked `'wasm-unsafe-eval'`, so browsers refused to compile Pagefind's WebAssembly engine. Every query hung at "Searching for ..." forever with `Failed to load the Pagefind WASM: CompileError` in console. The index itself was fine (134 pages, all `/pagefind/*` assets 200). Local `npm run preview` never catches this class because `_headers` only applies on Netlify.
2. **GA4 beacons CSP-blocked** (found during the same probe) — GA sends engagement hits to `https://www.google.com/g/collect`, which `connect-src` didn't allow. Some analytics loss since the CSP was added.
3. **Nav dropdowns close mid-travel** — [src/styles/global.css](src/styles/global.css) put the popover at `top: calc(100% + 0.35rem)`, leaving a ~6px unhoverable gap between the toggle and the menu. Moving the pointer from "Tools" down to a subitem crosses the gap, `:hover` drops, menu `display:none`s instantly. Mouse-speed dependent → Ian's "sometimes but not all the time".
4. **Notion writeback = FALSE ALARM** — the `Notion Publish Status` n8n workflow (`LKKVtHqiD6cyxBWc`) succeeded on every content merge; Content Calendar rows for PRs #160/#161/#162/#166 (Pub Dates 7/4–7/7) all verified currently `Status: Published`, written within ~2s of each merge. Engine swept e2e: Blog Post Engine daily success 7/3–7/7, Topic Suggestor healthy, auto-merge firing.

### Changes (`public/_headers` + `src/styles/global.css`)

- `script-src` += `'wasm-unsafe-eval'`; `connect-src` += `https://www.google.com`
- Invisible `.nav-dropdown-menu::before` bridge (0.4rem, absolute) over the gap, scoped `@media (min-width: 768px)` — the mobile drawer renders the menu inline and is unaffected

### Verification (headless Playwright A/B)

- Prod pre-merge: 0 results + WASM CompileError; menu closes on a 1px-step pointer traversal of the gap
- Deploy preview + prod post-deploy: **89 results for "hubspot"**; menu survives the same worst-case traversal and the subitem click lands on `/tools/#workflow-automation`; 0 page errors

### Key notes

- **Revert:** `git revert 22e0145`
- Pagefind (or any WASM lib) + strict CSP → always needs `'wasm-unsafe-eval'` in `script-src`; test search on deploy previews, not local preview
- Probe scripts live in the session scratchpad (`verify-168.mjs` pattern: CSP header check + pagefind result count + 1px-step hover traversal)

---

## Quick reference — recent additions (Session 57, 2026-07-07)

**Unblocked PR #166 (AI SDR comparison post): the auto-register bot broke the Netlify build with an unquoted `11x:` registry key and registered Artisan against the parked-for-sale `artisan.so` instead of the real `artisan.co`. Fixed the PR data + hardened `qa/auto-register-tools.mjs` against both failure classes (commit `fb9690f` on the PR branch).**

Ian reported PR #166 failing; the deploy preview died with "Build script returned non-zero exit code: 2".

- **Build breaker:** `qa/auto-register-tools.mjs` emits affiliate-links entries as bare object keys, and `11x` starts with a digit — invalid TypeScript, so `astro build` failed at compile. Fix in the PR: `'11x': {` (quoted). Fix in the script: keys that aren't valid identifiers are now emitted quoted (the lint parse was already quote-agnostic, so no gate change needed).
- **Parked-domain miss:** the homepage resolver scored the for-sale `artisan.so` page *above* the real `artisan.co` because a parked page's title IS the brand ("artisan.so…" → the `startsWith` +100 bonus), while artisan.co's title ("Boost Your Outbound Sales with an AI BDR from Artisan") only gets +50. Result: `/go/artisan` pointed at a domain marketplace, the tools.ts blurb read "Own artisan.so today. Secure checkout…", and the logo was the parked page's. Fix in the PR: homepageFallback → `https://www.artisan.co/`, real og:description blurb, logo re-sourced from artisan.co. Fix in the script: new `PARKED_RE` guard rejects candidates whose title/og:title/description carry parked/for-sale markers (Atom/Dan/Sedo/GoDaddy-style copy).
- **Verified:** local `astro build` + `qa:lint` + `qa:logos` clean; deploy preview green; preview post renders both logos; `/go/artisan` and `/go/11x` pages target `www.artisan.co` / `www.11x.ai` with UTM params.
- **Revert:** `git revert fb9690f` on the PR branch (restores the broken build — don't). The script hardening merges with PR #166.
- **ToolBreakdown alignment "STILL broken" — root cause was an unmerged PR:** Ian re-reported the Session 55 highlights-panel misalignment on the new post. The fix was correct but **PR #163 had never been merged**, so every build (including #166's preview) still used the old CSS (`.tbd-cols { padding-right: 130px }`). Verified the fix pixel-level first (applied #163's component to the #166 branch locally, built, headless-measured: panel/heading/prose/card edges all at 1256px, logo within 4px), then squash-merged #163 (Ian approved) and merged master into the #166 branch (`5f8acaf`) so its preview renders fixed. Lesson: a session log saying "fixed (PR open)" is not shipped — check `gh pr view <n> --json state` before assuming a logged fix is live.

---

## Quick reference — recent additions (Session 56, 2026-07-06)

**Branded every n8n Slack alert with a `🤖 The Automations Guide` header, prefixed the HGC notify-emails with `[HomeGrown Growth]`, and wrote a Reddit playbook. No repo code change (n8n edits are live-instance-only); the one repo artifact is [REDDIT_PLAYBOOK.md](REDDIT_PLAYBOOK.md).**

Ian: most Slack alerts weren't identifying which project they came from, so a shared channel blurred together.

- **TAG Slack branding (convention going forward):** every Slack message from a TAG n8n workflow now leads with a first line `🤖 *The Automations Guide*`. Applied to all 7 TAG workflows / 10 message points — Error Trigger (`Slack Alert`), PostHog Liveness Monitor (`Slack Alert`), Notion Publish Status (`Slack Notify`), Daily Briefing (`Build Briefing` code node), Topic Suggestor (`Slack Notify`), Blog Post Engine (`Slack Notification` + `Slack Queue Empty` + `Log Cost to Slack`), PR + Backlink Monitor (`Build Slack Message` code + `Post Alert to #backlinks`). **Any new alerting workflow should keep this header.**
- **HGC finding:** the HGC workflows (01-09) do **not** post to Slack at all — they notify via `emailSend` to Ian's inbox. So the Slack channel noise was entirely TAG's (now fixed). To satisfy "make every alert self-identify," prefixed the 6 internal HGC notify-email subjects with `[HomeGrown Growth]` (Response Handler ×2, Demo Booked ×3, Error Handler ×1). The customer-facing "Confirm Prospect" email was deliberately left unbranded.
- **Revert:** these are additive prefixes in the live n8n instance (no repo artifact). Undo any one by deleting its `🤖 *The Automations Guide*\n` / `[HomeGrown Growth] ` prefix, or roll back via the workflow's version history in n8n.
- **Reddit playbook — [REDDIT_PLAYBOOK.md](REDDIT_PLAYBOOK.md):** 6-part audit + operating manual. Reality check (link-dropping gets the *domain* shadow-filtered; 9:1 rule; Reddit is a trust + topic-intelligence play, not a top-3 traffic source), profile setup (run it as Ian the operator, not a brand account; profile social-links are the one safe always-on URL), subreddit map (r/n8n is the #1 fit, then r/RevOps / r/automation / r/nocode), weekly rhythm (comment-first, start in `#backlinks`, link ≤1-in-5), ban triggers, and a **human-in-the-loop automation plan** layered on the existing `PR + Backlink Monitor` (automate monitoring + drafting, never posting; keyword tuning; a Monday digest; UTM attribution into PostHog). See op #426.

---

## Quick reference — recent additions (Session 55, 2026-07-06)

**Permanently fixed the ToolBreakdown comparison-card layout (full-width + logo-aligned + tighter). PR #163 open. CSS-only; affects all 26 posts using the format.**

Ian shared a screenshot of PR #162's Relevance AI / Lindy / n8n post: the "Highlights" panel didn't right-align with the logo (or with the header/body above it), the cards weren't using the full column width, and each ran longer than necessary.

- **Root cause ([src/components/post/ToolBreakdown.astro](src/components/post/ToolBreakdown.astro)):** both `.tbd-head` and `.tbd-cols` reserved `padding-right: 130px` to clear the top-right brand logo — but the logo only occupies a ~30px-tall band in the top-right corner. That 130px gutter was therefore wasted across the **entire** card: the Highlights panel's right edge stopped ~130px short of the logo's right edge (the reported misalignment), and every prose line + highlight bullet wrapped ~130px early, padding out the vertical length. (This partly reverses the S46 fix, which had aligned the panel to the *header text* by adding the same 130px to `.tbd-cols`; Ian now wants both aligned to the *logo* / full width instead.)
- **Fix:** the logo-gutter reservation now lives on **`.tbd-name` alone** (`display:flex` + `padding-right:130px` + `min-height:30px` so the tagline always drops below the logo). Tagline, pricing, body, and the Highlights panel all run **full width** and line up flush-right with the logo. Vertical tightening: body `line-height` 1.6→1.55, highlights `line-height` 1.45 + bullet margin 0.3→0.25rem, panel padding 0.7/0.85→0.65/0.8rem, meta gaps trimmed, card `margin-bottom` 1.5→1.25rem. The `@media (max-width:480px)` block was reworked to match (dropped the stale 100px gutter on the now-stacked columns; kept name clearance for the smaller logo).
- **Verified** on the dev server with measured geometry (not eyeballed): at 1280px the Highlights panel, tagline/pricing meta, and card edge all land at x=1241 (aligned with the logo at 1237, its 0.25rem inset); the name content ends at x=155, well clear of the logo's left edge (1207); the tagline row starts below the logo bottom; **no horizontal overflow at 1280px or 375px**.

**PR #163** (`d6eec90`, branch `fix/tool-breakdown-fullwidth-align` off origin/master, worktree `C:\tmp\tag-tbd-align`) — open, pending Ian's Netlify-preview review. **Revert:** `git revert d6eec90` (CSS-only, no markup/prop/content change).

---

## Quick reference — recent additions (Session 54, 2026-07-04, same sitting as S53)

**Executed Ian's audit decisions: cannibalization consolidation (PR #158) + the format-diversification build (PR #159 + live engine deploy). Both merged; engine deployed + GET-verified.**

### 1. Cannibalization consolidation — PR #158 (`316e6cf`, merged + live)

Ian: "consolidate." Folded the two TRUE-duplicate clusters only: Instantly-alternatives pair → kept the 6/10 post (adds Reply.io, better GSC pos), 301'd 6/02; RevOps-stack trio → kept the $500/mo build (site-best pos 4.3), 301'd `revops-automation-stack-2026` + `revops-tech-stack-2025`. 301s in netlify.toml BEFORE the catch-all; kept posts got `updatedDate: 2026-07-03` (first use of the wired S-3 plumbing — the "Updated" byline + real dateModified render, preview-verified); stale grandfather entry dropped from lint. The other 3 clusters (Outreach pair, n8n-vs-Make trio, CRM trio) target distinct queries → differentiate, not delete (flagged in TODO for Ian's confirmation). **Revert:** `git revert 316e6cf`.

### 2. GSC demand mining + intent dedup gate — PR #159 (`48c4794`, merged)

[backlog/build-backlog.mjs](backlog/build-backlog.mjs):
- **Query mining**: last-28d GSC queries (env `GSC_TOKEN_JSON`/`GSC_TOKEN_FILE`, OAuth refresh → `searchconsole.googleapis.com` v3; rank-tracker junk filtered; kept when no covered topic serves ≥60% of query tokens; top 40 fed to the proposal prompt as OBSERVED SEARCH DEMAND, highest priority). Degrades gracefully without creds. `--mine-only` debug mode. **First live run: "pipedrive alternatives" 139 unserved impr/28d, "bettercontact review" 60, "rb2b alternatives" 56, pricing + review + problem-first demand all visible.**
- **Intent dedup gate** (the fix for the engine "minting the same poor ideas"): alternatives/pricing keyed per anchor-tool-in-TITLE, migration keyed per tool PAIR (pd→attio ≠ pd→close); unit-tested against the real Instantly-duplicate case (token-jaccard of those two titles was only 0.29 — exact-match AND similarity both missed it; the intent gate catches it). Plus a 0.75 token-jaccard near-dup title net, and within-batch intent dedup. Full dry run: 12 proposed → 9 kept, drops correct.
- **FORMAT MIX quotas** in the prompt: ≤count/4 plain vs-comparisons; ≥count/5 each migration guides + pricing breakdowns; integration recipes, problem-first posts, single-tool reviews ("X review" demand is in the GSC data); alternatives only where none exists for that tool.
- [.github/workflows/topic-backlog.yml](.github/workflows/topic-backlog.yml): passes `GSC_TOKEN_JSON` secret env. **SECRET NOT YET SET** — the permission gate (correctly) wanted Ian's sign-off on storing an account-level Google OAuth token in a PUBLIC repo's secret store. Until set, the builder runs registry-only. To enable: `gh secret set GSC_TOKEN_JSON < ~/.gsc/token.json` (webmasters.readonly scope only).

### 3. Engine formats — new [n8n/update-engine-content-formats.mjs](n8n/update-engine-content-formats.mjs) (idempotent, 6 edits), DEPLOYED LIVE

- POST TYPES + full skeletons for **migration** + **pricing** posts (KeyTakeaways/StepRow/gotchas/verify/ChooseIf/BottomLine; pricing = annotated tier table + true-cost math + tier-fit ChooseIf).
- **TUTORIAL CTA floor** (audit S-4): ChooseIf/ToolBreakdown near the end + conditional BottomLine — the 7/02 GEO post had shipped ZERO /go/ links.
- **Affiliate rule generalized** in BOTH Generate Draft + Humanize: the stale 11-slug list → first-mention `[Tool](/go/<kebab-slug>/)` for ANY covered tool (auto-register + lint gate backstop unknown slugs), trailing slash required.
- **Parse Draft sanitizer**: deterministic trailing slash on `/go/` links (markdown + href forms; tested idempotent).
- Deployed via `deploy-engine.mjs --apply` (dry-run first: 29→29 nodes, creds resolved, active untouched) + **live GET-verified all 6 markers present** on workflow `sjZADhZGIuz9tZHK`.

### Watch tomorrow's 8am run for

Format adherence if the queued topic is comparison-shaped (unchanged path), correct /go/ trailing slashes, and richer affiliate linking. The new formats only fire when migration/pricing topics get queued — the next backlog batch will propose them.

**Reverts:** PR #158 `git revert 316e6cf` · PR #159 `git revert 48c4794` + re-run `deploy-engine.mjs --apply` against the reverted JSON to roll the live engine back.

---

## Quick reference — recent additions (Session 53, 2026-07-03 PM)

**Full GROWTH audit of the live site + engine — deliverable [AUDIT-GROWTH-2026-07-03.md](AUDIT-GROWTH-2026-07-03.md) (repo root, tracked). Findings only, no fixes applied (S40 precedent). Docs-only commit direct to master.**

Scope requested (via the Copperline session's cross-audit prompt): baseline capture, codebase crawl, live-site QA, SEO/content-model gaps, off-site, programmatic-scaling assessment, three-bucket prioritized report. Method: GSC Search Analytics + URL Inspection APIs (cached `~/.gsc/` OAuth — Search Analytics works with the same token, first time used), local Lighthouse 13.4 (PSI API keyless quota was exhausted), scripted affiliate sweep (all 60 /go/ slugs + outbound destinations, browser UA), scripted content link-graph/frontmatter analysis, prod curl spot-checks, web fetches for PH/circleback.

### Headline findings (detail + effort estimates in the audit doc)

- **Baseline 28d GSC: 7 clicks / 5,040 impressions / CTR 0.14% / avg pos 51.** Impressions ramped ~4x through June (70/day → 300+/day); clicks flat ~0. Branded impressions: **zero**. Impression counts partly inflated by rank-tracker scraper queries. Three pages rank page-1 with 0 clicks (migrate-substack-to-kit pos 9.5 / 119 impr the standout).
- **Affiliate routing is healthy**: all 60 /go/ pages 200; all 13 live-affiliate destinations resolve with partner tags intact (make/lusha 403 = bot-blocking only, redirect chains verified). One defect: circleback fallback `www.` → TLS cert mismatch.
- **Internal-link mesh is the top gap (S-1)**: 4/53 posts link to any tool hub, 7/53 to another post; all 23 LP-builder hubs have zero content inlinks — the newest of them are today's GSC "unknown to Google" set, and none accumulate authority. Backfill script + engine slug feed re-prioritized to @high. (Indexation itself improved: 116/126 vs 96/105 at S47 — the June request-indexing round worked.)
- **Cannibalization (C-1)**: 5 same-intent clusters incl. two "Instantly alternatives" posts 8 days apart and three "RevOps stack" posts. Engine/backlog dedup doesn't check published slugs — root-cause gate proposed.
- **EEAT/schema quick wins**: zero of 59 posts populate the already-wired `updatedDate` plumbing, so dateModified always = datePublished and the byline never shows an update (S-3, process fix); tool hubs emit no SoftwareApplication schema (S-2); tutorial-format posts ship ~zero affiliate CTAs (7/02 GEO post = 0 /go/ links, S-4).
- **Time-critical: Notion Content Calendar queue runs dry ~7/08** (last top-up 6/12). Now the top @high TODO.
- **Positioning question answered**: the site was NEVER HR/people-ops — all 59 posts RevOps/GTM from day one (repo grep + first-post check). The external note was wrong. Real scope question = topic drift into adjacent niches (ad-creative/GEO-tools/proposal posts, C-3).
- **Scaling verdict**: the pipeline IS the productized engine and generalizes (parameterize brand kit + registries + prompts; the QA/auto-register/auto-merge scaffolding is niche-agnostic). Bottleneck order: Notion queue top-up → hub LP build rate (auto-register mints /go/ slugs but no hub pages) → screenshot library (9 tools) → social distribution (drafts generated, posting dormant) → engine internal links.
- **Perf is solved — stop investing**: Lighthouse mobile 0.93-0.98 perf, CLS 0 everywhere, SEO 1.0; BP 0.77 sitewide is third-party cookies (cosmetic). No CrUX field data yet (traffic below threshold).

### Also updated

- [TODO.md](TODO.md): 2 new @high (queue top-up w/ 7/08 deadline — subsumes the old backlog-review @med; internal-link mesh), 8 new @med (C-1 decisions, hub schema, updatedDate, tutorial CTA floor, title/CTR pass, circleback fix, PH comment reply, GSC links export), 2 new @low (freshness policy, no-program hubs). Block re-ranked.
- GSC index status re-run this session: sitemap now 126 URLs (was 105 at S47) — per-URL verdicts in the audit doc's baseline section.

**Revert:** docs-only commit — `git revert <sha>`. Worktree: `C:\tmp\tag-audit`.

---

## Quick reference — recent additions (Session 52, 2026-07-03 PM)

**Full content-engine audit (Ian: "problems with consistent posting, missing images/links"). Unstuck all 3 open content PRs (#88 open 20 days, #150, #151 — all merged + live), fixed the engine defects that caused them, and rewired the auto-merge backstop from a silent 14-day fallback to a loud 2-day one.**

### Consistency: why posts weren't going out

The engine opens a PR every day at 8am ET without fail (execution history is clean). Publication was the bottleneck — it depends on a manual merge, and the auto-merge backstop only fired at **14 days** and **silently skipped any PR with a failing check, forever**:

- **PR #88** (6/13): draft was truncated by `max_tokens: 4096` mid-`<ChooseIf>` → MDX build failed → sat failing for 20 days with zero pings. Completed the post's ending by hand (compile-verified with `@mdx-js/mdx` first), bumped pubDate, updated the branch (its 6/13-era branch predated `qa/auto-register-tools.mjs`, which 404'd the first QA rerun) → full QA pass → merged.
- **PR #150** (7/2): the in-job auto-register push left the head sha with only an `action_required` run stub (the passing qa check lives on the pre-push sha), so the PR looked unreviewed; it had also gone merge-conflicted on the registries. Resolved via a merge commit taking master's registries (QA auto-register re-adds), full QA pass → merged.
- **PR #151** (7/2): QA green since yesterday, just nobody merged it → merged.

**[.github/workflows/auto-merge-content.yml](.github/workflows/auto-merge-content.yml) rewritten:** threshold 14d → **2d**; stuck PRs (failed checks, missing/non-success qa, changes-requested, Netlify red, merge conflict) past the threshold now **Slack-alert with the reason** instead of skipping silently; requires a successful `qa` check before merging, walking back over trailing `[auto-register]`/`[qa-fix-N]` bot commits (whose tree the passing run did test — the push happens inside that job before the gates run).

### Engine fixes (n8n workflow `sjZADhZGIuz9tZHK`, applied live via MCP; JSON re-synced)

- **Truncation guard (the #88 class):** new "Verify Draft Complete" Code node between Generate Draft and Humanize throws on `stop_reason === 'max_tokens'`; Parse Draft now throws the same for Humanize; `max_tokens` raised 4096 → **8192** on both Sonnet calls. Errors reach Slack via the existing errorWorkflow (`FTIVt7L1ZXleNUf6`).
- **Missing images:** posts have shipped **zero images since 2026-06-05** — the prompt banned screenshots pending "a human later pass" that never happens, while `public/screenshots/` holds 11 real product screenshots May posts used. Generate Draft now carries a **SCREENSHOT LIBRARY** (all 11 files, slug-mapped) + the `<Figure class="post-screenshot">` + `/go/` wrap pattern, requiring ONE screenshot when the post covers a library tool and still banning invented paths (lint hard-fails dangling `src` as backstop).
- **Missing/broken social links:** the social prompt's POST_URL was `/blog/<title-slug>` — the live URL is filename-based (`/blog/<date>-<slug>/`), so every tweet that did include a link **404'd**; the link was also "optional" for Twitter and absent from the LinkedIn spec entirely (while the Notion callout claimed "Live URL is in the body already"). Fixed the URL to `filename`-based with trailing slash, made it required in both outputs, and added a **deterministic append** in Parse Social Outputs (if the URL string is missing, append `Full post: <url>`), per the sanitizer-over-prompt rule.

### Verification

- #88 / #150 / #151 all `MERGED` (21:17–21:19 UTC), open content PRs: **0**. Full QA (build, render-acceptance, mobile-overflow, screenshots, Vision) passed on #88 + #150's final trees.
- Engine validates clean (29 nodes, 0 errors; 3 pre-existing prompt-text warnings).
- [n8n/blog-post-engine.json](n8n/blog-post-engine.json) re-pulled from live with credential ids re-placeholder-ized (deploy-engine.mjs convention), settings trimmed to `{executionOrder}` (PUT 400s on extra keys).

### Key notes / gotchas

- **`action_required` stub runs:** a GITHUB_TOKEN push from inside the qa job DOES create a pull_request run on the new head — permanently stuck `action_required` (the fork-PR approve API 403s on same-repo runs). The qa verdict must be read from the pre-push sha; auto-merge now does.
- **Empty commits do not retrigger** pull_request workflows (tried on #150; no run was created). A real merge commit does.
- **Next-run watch:** tomorrow's 8am post should include a library screenshot and social drafts ending in the correct live URL. If Haiku fights the required-URL instruction, the deterministic append covers it.
- **Residual / future:** in-body internal links are still ~zero engine-wide (RelatedPosts covers related linking at the page level; an engine-side "link 2-3 recent posts" needs a slug feed to avoid hallucinated 404s — punted). Per-post screenshot library only covers 9 tools; add files to `public/screenshots/` + the prompt list together.

---

## Quick reference — recent additions (Session 51, 2026-07-03)

**Content PR #153 (ZeroBounce vs Bouncer vs MailReach) wouldn't update despite Ian replying the missing tool URLs repeatedly — root-caused a backtick-parsing bug in the S48 reply-handler, fixed it durably, unblocked + merged the post, and shipped proper logos. Three PRs (#153 content, #154 fix, #155 logos), all merged to master + prod-verified.**

Ian: "I've responded multiple times with the missing links but Claude/GitHub are not updating... we went through this already and you validated it was working?" His replies were correctly formatted; the reply-handler was silently dropping them.

### Root cause (the recurring "nothing happens when I reply")

`handle-tool-reply.yml` (S48) parses `slug = url` pairs from the PR comment to auto-register the tool. Its capture was `/([A-Za-z0-9._-]+)\s*=\s*(https?:\/\/\S+)/` — `\S+` is greedy and swallows any trailing non-space char. Ian wrapped his replies in a markdown code span (`` `zerobounce = https://www.zerobounce.net/` ``), so the captured URL kept the **closing backtick**: `https://www.zerobounce.net/` + `` ` ``. The cleanup only stripped `.,;)` (not backticks), so `auto-register-tools.mjs` fetched the backticked URL, 404'd, resolved nothing, and the workflow posted "⚠️ no registry changes were made" on every reply. The run log confirmed it: `Parsed hints: ...zerobounce=https://www.zerobounce.net/\`` and `url-hint provided for zerobounce but fetch failed`.

### 1. PR #154 — parser fix (`0bf58a3`, merged to master)

- **[.github/workflows/handle-tool-reply.yml](.github/workflows/handle-tool-reply.yml):** URL capture now excludes whitespace AND markdown/quote wrappers — `(https?:\/\/[^\s\x60\x22'*<>)\]]+)`. Hex escapes `\x60` (backtick) + `\x22` (double-quote) are load-bearing: the parser runs inside a bash double-quoted `node -e "..."` string, so a literal backtick would trigger command substitution and a literal `"` would terminate the string. (Caught + fixed a literal `"..."` I'd first put in a code comment there.)
- **[qa/auto-register-tools.mjs](qa/auto-register-tools.mjs):** `--url-hint` values get trailing wrappers stripped at the parse boundary too (defense-in-depth for any caller).
- Verified by running the exact bash+node parse block against the real PR #153 comment body → clean `zerobounce=... mailreach=...` (no backtick). **`issue_comment` workflows run from the DEFAULT branch**, so this only fixes future replies once on master (which is why #153 itself had to be unblocked directly).

### 2. PR #153 — unblocked + merged (`c183e34`, post live)

Ran `auto-register-tools.mjs` with clean `--url-hint`s in a `C:\tmp\tag-pr153` worktree: zerobounce (`https://www.zerobounce.net/`), mailreach (`https://www.mailreach.co/`), bouncer all resolved (`unresolved: []`). Committed the registry additions to the content branch (`b2f1eaf`). **mailreach logo trap:** its only sourced icon was a white mark on a solid navy webclip → HARD-failed the opaque-corner logo gate, and knocking out the navy would leave an invisible white mark on the cream tool cards → dropped the logo so it rendered logo-less like bouncer (`705f877`). QA green → **merged #153** → post live; `/go/{zerobounce,bouncer,mailreach}/`=200 on prod (control `/go/clay/`=200).

### 3. PR #155 — transparent SVG logos (`334f647`, merged)

Follow-up so both compared tools show a brand mark:
- **bouncer** — used usebouncer.com's dark logo variant (`2024/08/logo.svg`): navy wordmark + colored badge. The header logo (`Logo.svg`) was the white-wordmark version (invisible on cream).
- **mailreach** — their wordmark SVG ships white-only (built for dark headers); recolored the 9 `fill="white"` to their brand charcoal `#26282d` (the color mailreach.co uses on its own light sections).
- Both verified by rasterizing over the card bg (`#f6f4ec`) with sharp before shipping. **SVGs are skipped by [qa/lint-logos.mjs](qa/lint-logos.mjs)** (transparent by construction), and 10 tools already use `.svg` logos. `/brand/tools/{bouncer,mailreach}.svg`=200 on prod.

### Key notes / gotchas

- **Backtick-wrapped replies were the whole bug** — Ian did nothing wrong. Going forward either form works (post-#154); replying without backticks always did.
- **White-on-dark webclip icons are a logo trap:** auto-register grabs apple-touch/webclip icons that are designed for dark headers → knocking out the bg yields an invisible mark on the cream cards. Prefer a site's dark logo variant, or recolor a monochrome wordmark to the brand's on-light text color.
- **Worktrees:** `C:\tmp\tag-pr153` (content branch, now deletable) + `C:\tmp\tag-logos` for the logo PR, per the no-OneDrive-churn rule.
- **Reverts:** `git revert c183e34` (#153 content) / `0bf58a3` (#154 fix) / `334f647` (#155 logos) — all independent.
- **Residual:** the post `<title>` is 64 chars (soft SERP-truncation lint warning, pre-existing on the merged content — not touched). L-9 (logoless compared tools) still open @low for the original set.

---

## Quick reference — recent additions (Session 50, 2026-07-01)

**PR #148 merged; 0 hard lint errors confirmed on master.**

**`fix/affiliate-slugs-mailchimp-li-sales-nav` — 1 file, 14 insertions (commit `115957a`, squash-merged `ab3d672`):**

- **[src/data/affiliate-links.ts](src/data/affiliate-links.ts):** Added `mailchimp` and `linkedin-sales-navigator` as `no-program` entries with Ian-supplied homepage fallback URLs:
  - `mailchimp` → `https://mailchimp.com/pricing/marketing/`
  - `linkedin-sales-navigator` → `https://business.linkedin.com/sell?trk=visit-product-website&src=li-rev-prod`

Both were referenced as `affiliateSlug` in posts but missing from the registry, so their `/go/` redirects would 404 in prod. The `no-program` status + `homepageFallback` pattern means the route exists and redirects safely while no affiliate program is in place.

### Verification

- `node qa/lint-content.mjs --all` on master (`ab3d672`): **0 hard, 21 warnings** (was 2 hard before this PR)
- `npx astro build` clean (179 pages)

### Current state after all S49 + S50 PRs

All 3 PRs from the S49/S50 cycle are merged to master:
- **PR #146** (`13ceaeb`) — audit lows L-2/L-3/L-4/L-5/L-6/L-7 fixed
- **PR #147** (`ca86714`) — docs/session-49-log
- **PR #148** (`ab3d672`) — affiliate slugs mailchimp + linkedin-sales-navigator registered

**Remaining open:** L-9 (8 logoless compared tools), L-10 (inline-style DRY-up), Astro 4→6 major — all @low.

### Key notes

- **Revert PR #148:** `git revert ab3d672`
- Worktree: `C:\tmp\tag-affiliate-fix` (now pointing to master state post-rebase)

---

## Quick reference — recent additions (Session 49, 2026-07-01)

**Audit lows L-2/L-3/L-4/L-5/L-6/L-7 fixed in PR #146 (`fix/audit-lows`). Build clean (179 pages), render-acceptance 0 hard. 2 pre-existing hard lint errors surfaced.**

### Changes shipped to PR branch (`604ca5b`)

**`fix/audit-lows` — 7 files, 173 insertions, 7 deletions:**

- **L-2 ([src/pages/index.astro](src/pages/index.astro)):** Bumped 4 feature tile headings `h3`→`h2`. The page had an h1→h3 skip (invalid heading order); adding an h2 before them is the fix.
- **L-3 ([src/layouts/BaseLayout.astro](src/layouts/BaseLayout.astro)):** Removed `aria-label="Visit Homegrown Growth Co"` from the footer publisher link. The visible text "Published by Homegrown Growth Co" is descriptive and now serves as the accessible name, eliminating the WCAG 2.5.3 label-content mismatch.
- **L-4 ([src/styles/global.css](src/styles/global.css)):** Added `.affiliate-notice a { text-decoration: underline; }`. The "Read the full disclosure" link on `/tools` was distinguishable from surrounding text by color only.
- **L-5 ([src/components/EmailSignup.astro](src/components/EmailSignup.astro)):** Added a `MutationObserver` shim inside the existing lazy-load script. After beehiiv's `loader.js` injects the cross-origin iframe, the observer fires and sets `iframe.title = "Newsletter signup form"` — the only viable fix for a vendor-injected frame.
- **L-6 ([src/data/tools.ts](src/data/tools.ts)):** Added 3 FAQs to each of the 9 oldest tool hubs that had none: `make`, `n8n`, `hubspot`, `pipedrive`, `clay`, `apollo`, `smartlead`, `beehiiv`, `kit`. These are the highest-traffic hubs — they now emit `FAQPage` JSON-LD in the built HTML (the same path used by all LP-builder tools since Session 17).
- **L-7 ([src/content/blog/revops-automation-stack-2026.mdx](src/content/blog/revops-automation-stack-2026.mdx) + [2026-06-17-apollo-sequences-vs-hubspot-sequences-the-truth.mdx](src/content/blog/2026-06-17-apollo-sequences-vs-hubspot-sequences-the-truth.mdx)):** Two over-length meta descriptions trimmed: revops-stack 183→157 chars, apollo-sequences 169→130 chars.

### Pre-existing hard lint errors surfaced (not introduced by this PR)

Running `node qa/lint-content.mjs --all` revealed 2 hard errors pre-existing in master:
- `affiliateSlug "mailchimp"` — not in `affiliate-links.ts` → `/go/mailchimp` CTA would 404
- `affiliateSlug "linkedin-sales-navigator"` — not in `affiliate-links.ts` → `/go/linkedin-sales-navigator` CTA would 404

Both are tracked in TODO.md @low for a follow-up PR. CI only lints the changed post (not all), so they shipped past gate. Same class as C-1/C-2 that were fixed in S41.

### Key notes

- **Worktree:** `C:\tmp\tag-lows` (`fix/audit-lows` branch) — separate from the main OneDrive repo per `feedback_no_git_churn_shared_onedrive_worktree`.
- **Revert:** `git revert 604ca5b` after PR #146 squash-merges (single commit).
- **Remaining open after this PR:** L-9 (8 logoless compared tools), L-10 (inline-style DRY-up), Astro 4→6 major — all @low.

---

## Quick reference — recent additions (Session 48, 2026-06-30)

**PR #143 (Loops vs Customer.io vs Brevo) unblocked: customerio registered, handle-tool-reply workflow built, activecampaign.png logo fixed.**

### Root issue investigated

QA bot comment said "Reply with `customerio = https://customer.io` and I'll register it" but no `issue_comment` workflow existed. Ian had replied twice on the PR — nothing happened. Built the automation to make the promise real.

### Changes shipped to PR branch (3 commits)

**`35d8b82` — customerio registration:**
- `src/data/affiliate-links.ts` — added `customerio` entry (`status: 'pending'`, `homepageFallback: 'https://customer.io/'`)
- `src/data/tools.ts` — added `customerio` tool entry (category: Sales Engagement, blurb sourced from og:description)
- `public/brand/tools/customerio.png` — downloaded from `customer.io/apple-touch-icon.png`; background knocked out (R=11, G=53, B=59 dark teal, Euclidean dist<30 → alpha=0) via PowerShell `System.Drawing` per-pixel; passes `lint-logos.mjs`

**`a2763a6` — handle-tool-reply workflow + url-hint support:**
- `qa/auto-register-tools.mjs` — added `--url-hint slug=url` flag (repeatable); skips TLD probe for that slug and fetches the human-confirmed URL directly for blurb + logo. Needed for dotted-domain tools like `customer.io` whose TLD probe would try `customerio.com` instead.
- `.github/workflows/handle-tool-reply.yml` — new workflow: fires on `issue_comment` (PR only, write-access commenter only); parses `slug = url` pairs from comment body (slug normalized: lowercase, non-alphanumeric stripped except hyphens); gets PR branch; runs `auto-register-tools.mjs --post … --url-hint …`; commits registry/logo additions to PR branch (push re-triggers QA automatically); posts ✅ or ⚠️ result comment. Ian can now fix QA failures by replying on GitHub web or mobile — no VS Code required.

**`189649a` — activecampaign.png background knockout:**
- `public/brand/tools/activecampaign.png` — file was stored as `.png` but was actually a WebP (RIFF/WEBP header), no alpha channel, solid royal-blue background (R=0, G=76, B=255). `System.Drawing` can't handle WebP; used Node.js/sharp: `ensureAlpha()` + raw pixel walk, dist<40 from bg color → alpha=0; saved as true PNG. All 21 raster logos now pass `lint-logos.mjs` (0 hard, 0 warn).

### Going forward

When QA fails with the "needs a URL" comment, Ian replies on the PR (GitHub.com or mobile):
```
customerio = https://customer.io
```
`handle-tool-reply.yml` fires within seconds, registers the tool, pushes a commit, re-runs QA. No VS Code or Claude Code needed for this specific flow. The workflow becomes active on all future content PRs once PR #143 merges to master.

### Key gotchas

- **WebP-as-PNG trap**: `activecampaign.png` was a WebP (magic bytes `52 49 46 46` = `RIFF`) → `System.Drawing.Bitmap` threw "Parameter is not valid"; sharp handles WebP fine
- **Dotted-domain TLD probe failure**: `auto-register-tools.mjs` probes `customerio.com`, `customerio.io`, etc. — none are the real site; `--url-hint` bypasses the probe
- **PS 5.1 heredoc `=` mangling**: git commit messages containing `slug=url` must be written via `-F file` not `-m @'...'@` (PS splits on `=` in native-exe args)
- **Worktree isolation**: used `C:\tmp\tag-pr143` worktree throughout; HEAD was detached → pushed via `git push origin HEAD:content/…`

---

## Quick reference — recent additions (Session 47, 2026-06-27)

**GSC index-status audit: 105 sitemap URLs checked via URL Inspection API; 9 not indexed — all submitted to GSC by Ian.**

Ran `theautomationsguide/gsc-index-status.py` against `sc-domain:theautomationsguide.com`. Results: 96 Submitted and indexed, 8 URL is unknown to Google, 1 Crawled - currently not indexed.

URLs submitted to GSC (Ian used URL Inspection → Request Indexing for each):

- `/blog/2026-05-08-cheap-outbound-sales-stack-for-small-b2b-teams-under-200mo/` — unknown to Google
- `/blog/2026-06-21-getresponse-vs-brevo-vs-mailchimp-which-wins-in-2026/` — unknown to Google
- `/blog/2026-06-26-lusha-vs-apollo-vs-zoominfo-b2b-contact-data-compared/` — unknown to Google (yesterday's post)
- `/tools/aircall/` — unknown to Google
- `/tools/fireflies/` — unknown to Google
- `/tools/justcall/` — unknown to Google
- `/tools/otter/` — unknown to Google
- `/tools/vector/` — unknown to Google
- `/tools/surfe/` — Crawled - currently not indexed (crawled 2026-06-17; thin-content risk; re-submitted)

No code changes this session.

---

## Quick reference — recent additions (Session 46, 2026-06-25)

**ToolBreakdown col alignment + CTA gap fixed (PR #135); Nutshell/Pipedrive/Close post published (PR #131); pre-guardrail content corrected (PR #136); tagline length guardrail added to engine prompt + deployed.**

Two more ToolBreakdown issues surfaced after the S45 CSS fix landed:

- **Highlights panel bleeding past the logo zone ([src/components/post/ToolBreakdown.astro](src/components/post/ToolBreakdown.astro)):** `.tbd-cols` lacked `padding-right: 130px` that `.tbd-head` already had, so the highlights panel's right edge extended 130px further right than the tagline/name text. Fixed. `.tbd-cta` margin-top also halved (0.85rem to 0.4rem) to cut dead space above the button. **PR #135** `e409a7f` (commit `ede8fb0`). Revert: `git revert ede8fb0`.
- **Nutshell post content was pre-guardrail ([src/content/blog/2026-06-25-nutshell-vs-pipedrive-vs-close-best-affordable-sales-crm.mdx](src/content/blog/2026-06-25-nutshell-vs-pipedrive-vs-close-best-affordable-sales-crm.mdx)):** all 3 taglines were 85-101 chars (full-sentence constructions); all 3 pricing strings were 93-118 chars (all tiers listed verbatim). Both exceeded the S45 guardrails. Corrected inline: taglines to 50-61 chars, pricing to 41-50 chars. **PR #136** `45d8967`. Revert: `git revert 45d8967`.
- **PR #131** `0486980` merged — Nutshell vs Pipedrive vs Close post is live on production.
- **Engine tagline guardrail ([n8n/blog-post-engine.json](n8n/blog-post-engine.json)):** added `tagline (max 55 chars, punchy one-liner -- no full sentence, no colon)` to the ToolBreakdown spec, mirroring the S45 pricing guardrail. Deployed via `deploy-engine.mjs --apply`. Root cause of today's content bug: the LLM wrote full-sentence taglines (85-101 chars) because there was no constraint; the S45 fix only added a pricing constraint.

---

## Quick reference — recent additions (Session 45, 2026-06-25)

**Diagnosed and fixed a ToolBreakdown desktop layout bug (green tagline text wrapping 2-3 lines due to long multi-tier pricing strings squeezing the flex row). Added prevention at two layers: upstream in the content engine prompt + downstream in the Vision QA gate. PR #132 open; pending merge + n8n deploy before merging PR #131 (Nutshell post).**

Ian shared a screenshot of PR #131's Netlify preview — the green tagline in each ToolBreakdown card wrapped 2-3 lines because multi-tier CRM pricing strings (~90 chars each) consumed ~65% of the `.tbd-meta` flex row, forcing the tagline into a cramped sliver. Root cause: `.tbd-meta` used a flex row where tagline and pricing competed for the same line. The original spec assumed short prices like "From $14/mo." Discussion: CSS fix is reactive; two proactive prevention layers added.

- **CSS fix ([src/components/post/ToolBreakdown.astro](src/components/post/ToolBreakdown.astro)):** changed `.tbd-meta` from `flex-wrap: wrap` (side-by-side) to `flex-direction: column` — tagline always spans full column width regardless of pricing length. Removed `flex: 1 1 12rem` from tagline and `text-align: right` from price. Net -8 lines CSS.
- **Engine prompt guardrail ([n8n/blog-post-engine.json](n8n/blog-post-engine.json)):** tightened ToolBreakdown `pricing` spec from "entry tier plus one higher tier when useful" to "keep under 50 chars, abbreviated only, e.g. From $14/seat or Essential $14 / Pro $49/seat -- never list all tiers verbatim." Addresses root cause upstream before generation.
- **Vision QA prompt ([qa/qa-pr-review.mjs](qa/qa-pr-review.mjs)):** added TOOL BREAKDOWN HEADER SQUEEZE to the named recurring-defects list — a 3-line-wrapping tagline on desktop is flagged as major. Catches this class if the engine ever outputs a long pricing string again.

**PR #132** (`fix/tool-breakdown-tagline-wrap`, commits `660e152` CSS + `141bd2a` engine+Vision) — **revert:** `git revert 660e152 141bd2a`.

**Next (requires Ian action):** QA pass on #132 → merge #132 → `node --env-file=../../restaurant-outreach/.env n8n/deploy-engine.mjs --apply` → merge PR #131.

---

## Quick reference — recent additions (Session 44, 2026-06-24)

**Checklist audit (todo-system maintenance): found 3 genuinely-missing TODO entries + 4 stale-done items in TAG's checklist files. Added checklist-file-type policy to todo-sync/CONVENTION.md.**

Context: `OFF_SITE_SEO_CHECKLIST.md` had two sections (Content Distribution, GEO Baseline Test) and a second Lead Magnets item with zero corresponding TODO entries — invisible to the tracker and Notion. Separately, 4 items marked `[ ]` in checklist files were already done.

- **3 missing items added to [TODO.md](TODO.md)** (all `@low`): GEO baseline test (run 5 RevOps queries in ChatGPT/Perplexity/Claude/Gemini monthly, log citations); content distribution cadence (LinkedIn 3-5x/week, RevOps Co-op Slack, r/RevOps/IH/HN, newsletter swaps at 100+ subs, podcasts at 500+ subs); second lead magnet ("All RevOps tools at $X/mo budget tier" spreadsheet, Beehiiv-gated, at 100+ subs). `## TODO` block re-ranked by priority bucket (all `@high` → all `@med` → all `@low`).
- **4 stale-done items closed in checklist files**: [OFF_SITE_SEO_CHECKLIST.md](OFF_SITE_SEO_CHECKLIST.md) — PostHog dashboard (`[x]`, done Session 29 / dashboard 1699394), Affiliate Tier 1 (`[x]`, Wave 1 complete 2026-06-14), first lead magnet (`[x]`, done 2026-06-11); [GSC-TIER2-CHECKLIST.md](GSC-TIER2-CHECKLIST.md) — all 10 `/tools/*` URLs (`[x]`) + completion header added.
- **Checklist-file-type policy added to [todo-sync/CONVENTION.md](../todo-sync/CONVENTION.md)**: defines two types — *action queue* (must have ≥1 TODO.md entry) vs *runbook* (add `> RUNBOOK` header, no per-step TODO items) — plus done-item hygiene rule.

**Verification:** `node todo-sync/sync-todos.mjs --dry-run` → drift lint clean, 14 TAG open tasks (was 11, +3 correct).

**Commits:** TAG `9df31de` (3 files, pushed to master) + todo-sync `b70cc6c` (CONVENTION.md, pushed to main). See op #328.

---

## Quick reference — recent additions (Session 43, 2026-06-24)

**Content PR #128 (Laxis vs Fireflies vs Otter) failed QA again — root-caused TWO distinct pipeline bugs (not content, not a regression), fixed both durably, merged the post, then made the residual failure self-serve per Ian. Two PRs (#128 + #129), both merged to master.**

Ian: "another error on PR 128 why does this keep happening? How am I supposed to be interacting with this so I don't have to keep going to you? I can't actually review code." The reds were genuinely pipeline bugs, not the post.

- **Bug 1 — auto-register couldn't confirm `Otter.ai` (TLD-in-brand-name class).** The post names the tool `Otter.ai`, which `norm()`s to identity target `otterai`, but otter.ai's homepage `<title>` is "Otter Meeting Agent…" → normalizes to `otter…`, which does NOT contain `otterai`, so the page-identity check in `resolveHomepage()` failed and the tool fell through to the lint gate (HARD: `affiliateSlug "otter"` not in affiliate-links.ts). Laxis + Fireflies resolved fine (bare brand names); Otter was the only casualty. **Fix ([qa/auto-register-tools.mjs](qa/auto-register-tools.mjs)):** match page identity against the **clean slug** (`otter`) as well as the name — the slug is the canonical clean identifier and matches "Otter Meeting Agent". Generalizes to the whole class (Otter.ai / Reply.io / Bland.ai). Dogfooded locally (residential IP) → registered `otter`→`https://otter.ai/` + sourced an apple-icon logo ([public/brand/tools/otter.png](public/brand/tools/otter.png), 256×256, transparent corners → passes `lint-logos`). Idempotent on re-run.
- **Bug 2 — stale-branch changed-post mis-detection (THE recurring one).** [qa-content-pr.yml](.github/workflows/qa-content-pr.yml) "Identify changed post slug" used `git diff --name-only origin/master..HEAD` (**two-dot = full tree diff between the two tips**). While #128 sat open, PRs #119 (GetResponse) + #127 (Reply.io) merged to master, so that diff reported those master-only posts as differences and `head -1` grabbed the alphabetically-first one (`2026-06-21-getresponse…`), which isn't on the branch → the lint opened a non-existent path → `ENOENT`, red. **Any content PR left open across another merge hits this.** **Fix:** three-dot `origin/master...HEAD` (changes since the merge-base, i.e. only this branch's post) + `--diff-filter=d` (exclude deletions). Also brought #128's branch up to date with master (the S42 precedent for #120). **PR #128 `c53c01e`** (squash-merged): both fixes + the Otter registration; QA re-ran **green** (qa pass) + Netlify preview green → **post published**.
- **Residual policy — keep blocking, ping in plain English (Ian's choice).** The lint gate stays HARD on an unresolved tool (protects `/go/<slug>` affiliate links from 404ing — the S40/S41 revenue-leak guarantee). But the failure message was generic ("a QA step failed; see the run"), which needed code-literacy to action. **PR #129 `e5082e0`** (squash-merged): `auto-register-tools.mjs` writes any unresolved `slug\tname` to `qa-unresolved-tools.txt` (gitignored, not committed); the **QA-failed PR comment + Slack ping** read it and render a plain-English ask naming the exact tool and requesting only the homepage URL ("reply with `otter = https://otter.ai`"), falling back to the generic message for non-tool failures. So the only human action left on a content red is a one-line business call (what's the site + do we affiliate it), not a code review.

**Verification:** otter resolves + lint-content 0 hard + lint-logos 0 hard (sharp) + auto-register idempotent; workflow YAML parses (js-yaml, 27 steps); PR #128 QA run `28101353145` = qa pass; both PRs squash-merged to `origin/master`.

**Revert:** PR #128 `git revert c53c01e`; PR #129 `git revert e5082e0` (all additive — resolver match-broadening, a workflow diff flag, a registry+logo entry, and a failure-message breadcrumb).

---

## Quick reference — recent additions (Session 42, 2026-06-22)

**Investigated why content PR #120 failed QA, then built auto-registration so an unregistered tool stops being a stopper. Two PRs (#125 infra + #120 content), both merged + prod-verified.**

Ian: "PR 120 failed QA? I thought we fixed the QA fails?" **It wasn't a regression — the QA gate worked as designed.** PR #120 (bot post *KrispCall vs JustCall vs Aircall*) hard-failed the **`affiliateSlug` gate I added in S41**: its `<ChooseIf>`/`<BottomLine>` CTAs point at `/go/justcall` + `/go/aircall`, neither of which is in `affiliate-links.ts`, so they'd 404 at build. `krispcall` was already registered (so it passed); only the two unregistered tools tripped it. The gate caught a real defect — but per Ian, unregistered tools shouldn't be a manual stopper: "figure out a way to handle this automatically… just get the links/logos independently."

- **New [qa/auto-register-tools.mjs](qa/auto-register-tools.mjs) (PR #125 `2e93900`).** For each tool a post references that isn't in the registries: (1) **resolves the homepage** by probing common TLDs (`.com/.io/.ai/.co/.app/.so/.dev`) and **verifying the page identifies as that tool** (normalized name in `<title>`/`og:site_name`/`og:title`), **scoring all candidates and picking the best** — this is load-bearing: a first-match-wins resolver registered the squatter `justcall.com` ("Just Call", an unrelated site) over the real `justcall.io`; scoring (name-in-title + has-og-image + has-apple-touch-icon + descriptive-title) correctly prefers `.io`. (2) **Sources a logo** from the site's own icons (apple-touch-icon → `rel=icon` → og:image) with a Google-favicon fallback, saved to `public/brand/tools/`. (3) **Appends** a `pending` affiliate-links entry (homepage fallback) + a `tools.ts` entry (or back-fills a logo on an existing one), HTML-entity-decoding the og:description blurb. **Idempotent** (CRLF-aware registry parse + a defensive guard in `addLogoToTool` — an early CRLF bug double-added `logo:` lines on re-run, caught + fixed before shipping), **key-free**, no new deps (Node global fetch).
- **Wired into [qa-content-pr.yml](.github/workflows/qa-content-pr.yml)** as an **"Auto-register referenced tools"** step BEFORE the lint gate (runs on the runner's preinstalled Node, before `npm ci`). It commits the registry + logo additions to the PR branch (push via `GITHUB_TOKEN`, which by design **doesn't retrigger** the workflow). Anything it **can't confidently resolve is left untouched** → the deterministic lint gate still flags it for manual review. So a future post naming a brand-new tool self-heals instead of blocking.
- **#120 unblocked.** Dogfooded the script to register `justcall` + `aircall` + a `krispcall` logo (shipped in #125); then updated #120's branch from master → its QA re-ran **green** (auto-register idempotently skipped, lint 0 hard/0 warn, was 2 hard + 3 warn) → squash-merged (`04ba570`). **Prod-verified: `/go/{justcall,aircall,krispcall}/` = 200.**
- **Logo caveat:** sourced logos are best-effort — `justcall.png` is a 1KB favicon (low-res but passes the opaque-bg logo gate); a human can drop a higher-res mark into `public/brand/tools/` anytime. Tracked as an @low in TODO.md.

**Revert:** PR #125 `git revert 2e93900` (additive: one script + one workflow step + registry/logo additions); PR #120 is content (`git revert 04ba570`).

---

## Quick reference — recent additions (Session 41, 2026-06-18)

**Fixed the full audit's CRITICAL + ALL 6 MEDIUMS (+ lows L-1/L-8) — 6 PRs, all merged to master + deploying.** Resolution header added to [AUDIT-FULL-2026-06-17.md](AUDIT-FULL-2026-06-17.md).

- **C-1 + C-2 (critical, PR #109 `7752547`):** registered `zapier`/`canva`/`creatify` in `affiliate-links.ts` (url:'' → homepage+UTM fallback, the gong/outreach pattern) so `/go/<slug>` generates; added an `affiliateSlug:` matcher (both `: "x"` and `="x"` forms) to `lint-content.mjs` so component-prop slugs can't 404 past CI again. The matcher immediately exposed a **latent parser bug** — the affiliate known-set regex `/^\s{2}([a-z0-9-]+):/` couldn't see *quoted* hyphenated keys, so `reply-io`/`relevance-ai`/`cal-com`/`bland-ai` were silently absent; made it quote-agnostic. **Prod-verified: `/go/{zapier,canva,creatify}/` = 200.**
- **M-1 color-contrast (PR #110 `c04e37e`):** new `--accent-text` = teal-700 `#0a6d5e` (6.1:1) for all teal TEXT/links/icons; `--accent` stays teal-500 for decorative dots/borders/glow. White-on-teal fills (`.btn--primary`, about-hero LinkedIn hover, pressed filter tag) darkened to teal-700 (white 2.98→6.25:1). `--text-faint` `#8b929e`→`#656b76` (badges/meta, ~4.9:1 on the warm panel). **Lighthouse color-contrast PASS (was 34 fails), a11y 92→96.** Verified desktop+390px visually.
- **M-2/L-1/L-8 (PR #111 `2b12079`):** default share card `/og/default.png` (same astro-og-canvas style, added a `default` page to `og/[...route].ts`) defaulted in BaseLayout + emitted unconditionally → every non-post page now has a branded card; `ogType` prop (BlogPostLayout passes `article`); title separator `—`→`|`.
- **M-6 (PR #112 `fb928ca`):** `npm audit fix` non-breaking → 12→9 vulns (devalue + fast-xml-builder). Remaining 2 high + 7 moderate all chain from **Astro 4.16; the 4→6 major is DEFERRED/tracked** (build-time/dev-server advisories, no server shipped).
- **M-5 (PR #113 `4f6c4b0`):** removed 59 lines dead CSS (legacy EmailSignup form + `.nav-dropdown-sep`/`.tool-cta`/`.hero-social-proof`). Kept interleaved LIVE selectors (`.email-signup-eyebrow/-heading/-sub/-note`, `.btn:disabled`) + the `.mt-*` scale (mt-lg is live).
- **M-4/M-3 (PR #114 `9a0bf24`):** rehype plugin stamps `rel="sponsored noopener noreferrer"` on every prose `/go/` link at build; lint WARNING (not hard) when a frontmatter title >60 chars (7 surface today). M-3 engine-prompt tightening is the engine-side complement.

**Remaining open = lows only** (L-2/L-3/L-4/L-5/L-6/L-7/L-9/L-10) + the deferred Astro 4→6 major. See TODO.md + the audit doc.

---

## Quick reference — recent additions (Session 40, 2026-06-18)

**Ran a full-spectrum website audit (the companion to the SEO-only [AUDIT-SEO-2026-06-14.md](AUDIT-SEO-2026-06-14.md)). Deliverable: [AUDIT-FULL-2026-06-17.md](AUDIT-FULL-2026-06-17.md) at repo root (tracked). Findings only, NO fixes applied yet — Ian wants to work through critical + medium next.**

Method: `npm run build` + full `qa` suite (lint-content/render-acceptance/mobile-overflow/lint-logos/seo-scan, all 0 hard) as the deterministic baseline; a 5-agent read-only static fan-out (content, code, affiliate, security, SEO); Lighthouse 12 simulated-mobile vs PROD across home/post/tools-index/tool-hub/reviews/teams; Playwright network capture + axe-class checks vs PROD. **Tally: 1 critical (+1 paired root-cause), 6 medium, 11 low.**

- **🔴 C-1 (live revenue leak): 4 affiliate CTAs 404 at click time.** `affiliateSlug:` props for `zapier` (×2 posts), `canva`, `creatify` have NO `affiliate-links.ts` entry, so `go/[tool].astro` never generates the redirect → curl-confirmed `/go/zapier|canva|creatify/` = **404 on prod** (control `/go/clay/` = 200). Fix: add them as `no-program` entries w/ homepage fallback (pattern already used for gong/outreach/etc). **🔴 C-2 (root cause): the QA gate misses component-prop slugs** — `lint-content.mjs:131` only matches the prose `/go/` form, not `affiliateSlug:`, so this shipped past CI and WILL recur. Fix both in one PR (add an `affiliateSlug:` matcher to the lint).
- **🟠 Mediums:** M-1 **WCAG color-contrast sitewide** (teal `#14a890` fails AA on light bg, 34 elems 2.71-2.98 + white-on-teal buttons; the SAME brand-token class HGC fixed with a darker teal-text token — highest-leverage medium); M-2 no og:image fallback (home + all non-post pages bare social card); M-3 88/97 titles over SERP width; M-4 ~111 prose affiliate links lack `rel=sponsored` (mitigated by internal /go); M-5 ~70 lines dead CSS in 47KB un-treeshaken global.css; M-6 Astro 2 majors behind (4 high advisories, mostly build-time; `npm audit fix` clears 2 non-breaking).
- **🟢 Strong passes:** Performance FULLY resolved (Perf 97-100, LCP 1.6-2.3s, **CLS 0** every template — the old CWV-critical is gone); content 0 hard across 39 posts; **all 3 analytics firing live** (PostHog/GA4/Clarity — incl. the `y.clarity.ms/collect` endpoint that's silently CSP-blocked on HGC); CSP/headers tight + in-sync; FTC disclosure + component CTAs + newsletter injection + mobile-overflow all clean. Full coverage matrix in the doc.
- **Lows (11):** em-dash title separator (`—`→`|`), homepage heading-order (h1→h3), 9 oldest tool hubs missing FAQPage schema, 3 meta-desc outliers, og:type=website on posts, 2 minor a11y (footer publisher link name-mismatch, disclosure link color-only), 8 logo-less compared tools, repeated inline-style idioms, latent 2-form newsletter fragility.

**Next session: fix C-1+C-2 (one PR, ~30 min, stops the live 404s) → M-1 color-contrast → M-2/L-1/L-8 BaseLayout batch.** Fix sequencing + every file:line is in AUDIT-FULL-2026-06-17.md.

---

## Quick reference — recent additions (Session 39, 2026-06-17)

**Tools header dropdown (PR #105, merge `094624a`) — DEPLOYED LIVE.** Scoped from Ian's "make the site more navigable" ask. Turned the header **Tools** nav item into a dropdown mirroring the Teams pattern: **Browse all tools** + 6 curated category jump-links (`/tools/#<anchor>`) into the existing `/tools` index. No new pages/routes.

- **Pushback taken:** Playbooks deliberately left as a single link, not given a dropdown. It's a flat tag filter over only 13 thinly-tagged posts (tags collapse to ~"guide" 11 / "playbook" 10, heavily overlapping) — no real sub-taxonomy to split, a dropdown would show near-duplicate sparse sections. Tools, by contrast, already had a real `toolCategories` taxonomy + per-category `<section>`s on the index, so "sections" mapped onto existing structure.
- **Curated, not exhaustive:** dropdown lists 6 of the 9 `toolCategories`. The 5 singleton categories (Enrichment/Visitor ID/Scheduling) are reached via "Browse all tools" rather than cluttering the menu with one-tool rows.
- **Files:** [tools.ts](src/data/tools.ts) — shared `categoryAnchor()` helper + curated `navToolCategories` (single source so dropdown hrefs and index section ids can't drift); [tools.astro](src/pages/tools.astro) — `id={categoryAnchor(cat)}` on each category `<section>` + `scroll-margin-top:calc(var(--nav-h)+0.5rem)` so the sticky nav doesn't cover the heading on jump; [BaseLayout.astro](src/layouts/BaseLayout.astro) — Tools dropdown markup + **the `.nav-dropdown` JS refactored from a single `querySelector` to `querySelectorAll`** so both Teams and Tools work (opening one closes the other). That single→multiple refactor was the only real risk.
- **Verification (headless desktop + 390px mobile):** both dropdowns toggle with sibling-close; all 6 anchors resolve to real sections; jump lands the heading below the sticky nav (heading y=161 vs nav-bottom y=72); mobile drawer expands inline, no horizontal overflow. `npm run build` + `qa:lint` + `qa:render` clean (0 hard). Curl-verified live on prod (6 anchored dropdown links + 9 anchored sections on `/tools`). **Revert:** `git revert 094624a` (nav + tools index only, no data/content change).

---

## Quick reference — recent additions (Session 38, 2026-06-17)

**Reconciled the Session 35/36 divergence by splitting the parked `batch-solo-todos-2026-06-15` branch into 3 clean PRs off master, all merged + DEPLOYED LIVE. The Session-35 features now live on `master` (not a stranded branch); `batch-solo` deleted.**

Why split: `batch-solo` bundled real unmerged Session-35 product code with stale logs, and merging it directly conflicted in 3 files (`CLAUDE.md`/`astro.config.mjs`/`public/_headers`) — and per Ian the risky font change wanted isolation. So rebuilt the work as independent PRs off current master instead of merging the branch.

**1. Nav + /reviews hub (PR #100, merge `e6b5072`).** New [reviews.astro](src/pages/reviews.astro) `/reviews` comparisons hub (mirrors `/playbooks`, lists the `comparison`-tagged head-to-heads). [BaseLayout.astro](src/layouts/BaseLayout.astro) nav: added a "Comparisons" item, **promoted About to a top-level item after "Latest"** (removed from the Teams dropdown, which is now just the 4 audience links), and **renamed "Tool Reviews" → "Tools"** (header/footer/breadcrumb; homepage section `<h3>` left as descriptive content). `workflow-automation` tag added to the 6 platform posts + the blog-index pillar map. Nav-fit CSS in [global.css](src/styles/global.css) (`white-space:nowrap` on nav links + tighter `.nav-inner` gap 2rem→1.25rem + link padding) so the now-6-item bar stays single-line 920–1280px (it was wrapping "Tool Reviews"). Playwright-verified desktop/narrow/mobile-drawer.

**2. Self-hosted fonts (PR #101, merge `1280426`) — the deferred S33 LCP fix.** Replaced the render-blocking Google Fonts `<link>` with self-hosted [@fontsource](src/layouts/BaseLayout.astro) imports + the **fontaine** Vite plugin ([astro.config.mjs](astro.config.mjs)) for metric-matched fallback faces (~0 CLS). Hand-merged so it **keeps** master's `markdown.syntaxHighlight:false` (the S37 code-block fix) and the Clarity CSP — only the two Google-Fonts hosts dropped. Verified on prod: **0** Google-Fonts refs, self-hosted woff2 loads (200), Clarity intact. **LCP-under-2.5s still needs a prod mobile Lighthouse run (follow-up).**

**3. Grandfather kit-vs-beehiiv tree (PR #103, merge `6e388c3`).** The Kit-vs-Beehiiv post (PR #92, 2026-06-15) shipped a valid `<DecisionTree>` the same day as the S37 retirement and missed the grandfather scan, tripping `qa:lint --all` (1 hard). It renders fine; added to `DECISIONTREE_GRANDFATHERED` → `lint --all` back to 0 hard.

**Verification:** all 3 merged to master + live on prod (curl-verified: 0 Google-Fonts refs, self-hosted woff2 200, "Tools" nav, About + Comparisons present, `/reviews/` 200, Clarity present). `qa:lint --all` 0 hard. **Revert:** `git revert` each squash — #100 `e6b5072` / #101 `1280426` (restores Google Fonts exactly) / #103 `6e388c3`.

**Reconciliation note:** this closes the S35/36 gap. Session-35's features (fonts/reviews/tag) shipped here via #100/#101/#103, NOT via `batch-solo` (now deleted). Session 36's code (newsletter-form fix, Clarity) was already on `master` via PRs #93/#94 (see the S37 + S37-follow-up entries). Session-35's non-code decisions (LinkedIn reconcile, volume-ramp = hold 1/day) were docs-only and remain captured in STATUS.md / [TODO.md](TODO.md).

---

## Quick reference — recent additions (Session 37, 2026-06-16)

**Investigated PR #95's failure, then retired `<DecisionTree>` from the engine entirely per Ian (decision trees/flowcharts are the top source of post-generation/QA errors). Decision graphic is now `<ChooseIf>` cards. PR #96 merged + engine deployed live; PR #95 fixed and green.**

**1. PR #95 failure root-caused + fixed.** The daily-engine post `2026-06-16-lemlist-vs-instantly...` hard-failed the **render-acceptance gate** ("DecisionTree: 4 leaf result(s) in source but only 0 rendered"). Root cause: the engine emitted the `<DecisionTree>` in the WRONG prop shape: flat top-level `question=`/`branches=` props with **string** `result` values, instead of the component's required single `tree={{ question, branches:[{ label, result:{ title, note, tone } }] }}` object. The `tree` prop was `undefined`, the malformed-prop guard in [DecisionTree.astro](src/components/post/DecisionTree.astro) degraded it to empty, and 0 of 4 branches rendered. The deterministic gate (Session 28) caught it correctly.

**2. `<DecisionTree>` RETIRED for future posts (PR #96, merge `534ff00`) — engine DEPLOYED LIVE.** Ian's call: stop emitting decision trees, swap to a simpler/reliable graphic. Chose `<ChooseIf>` ("Choose X if" self-select cards) as the decision graphic (flat array props, never errors, already the Session-29 tree replacement). [n8n/update-engine-retire-decision-tree.mjs](n8n/update-engine-retire-decision-tree.mjs) (new, idempotent, token-self-checked): **Generate Draft** drops the DecisionTree import, replaces the whole DECISION TREES section with a DECISION GRAPHIC ban steering to `<ChooseIf>`/`<IntentTable>`, reworks skeleton + VISUALS; **Humanize** drops DecisionTree from the preserve list, converts any tree (svg or component) to `<ChooseIf>`, removes the FLATTEN verify, import count 15→14. Deployed via `deploy-engine.mjs --apply` + **live GET-verified** (active, 28 nodes, expression braces balanced, ban present, old section gone). Deterministic backstop in [qa/lint-content.mjs](qa/lint-content.mjs): `<DecisionTree>` in a NEW post HARD-fails (exit 1); the **14 existing live tree posts are grandfathered** (`DECISIONTREE_GRANDFATHERED` set) so `qa:lint --all` stays 0-hard. CI lints only the changed post, so live posts are untouched unless edited. Existing 14 posts keep their trees (Ian: future posts only).

**3. PR #95 converted to the new standard + GREEN.** Replaced its `<DecisionTree>` with a 2-card `<ChooseIf>` (Lemlist vs Instantly; SpectrumBar stays the main comparison block), dropped the unused import. First adopter of the new policy; would otherwise have hard-failed the new lint ban (its filename isn't grandfathered). Build + lint + render-acceptance clean; QA run `27619465195` green. **Ready for Ian to merge.**

**Verification:** updater idempotent (2nd run no-op); `qa:lint --all` 0 hard (all 36 posts); negative test (new post w/ a tree) hard-fails exit 1; deploy dry-run + apply + live GET all clean; PR #95 CI green.

**Revert:** PR #96 `git revert 534ff00` (restores lint gate + JSON source); to roll the LIVE engine back, run `deploy-engine.mjs --apply` against the reverted `blog-post-engine.json`. PR #95 content = `git revert` its commit on the branch.

> Note: Sessions 35/36 were never written as standalone entries here (their work was stranded on `batch-solo`). Reconciled in Session 38 above — S35 features shipped via #100/#101/#103, S36 via #93/#94 (covered in the S37 entries). The S37 entry follows S34 here for that reason.

### Session 37 follow-up (2026-06-16) — code-block "black box" fix + PR #95 polish + merged

Ian reviewed the (now-merged) Lemlist-vs-Instantly post and flagged two visual issues; both fixed, then **PR #95 MERGED** (`25cecbe`).

**1. Code blocks rendered as a blank black box (PR #98, merge `2865106`) — sitewide, DEPLOYED LIVE.** Astro's default Shiki theme (`github-dark`) stamps an inline dark `background-color` on every `<pre>`, overriding the cream `.prose pre` rule in [global.css](src/styles/global.css); a plaintext (no-language) fence emits no per-token colors, so `.prose pre code { color: var(--text) }` (ink) lands on the dark inline bg = invisible. Several LIVE posts with plaintext/config fences were affected, not just this one. Fix: `markdown: { syntaxHighlight: false }` in [astro.config.mjs](astro.config.mjs) → clean `<pre><code>` with no inline styles, so the cream/ink design system fully controls code blocks (MDX inherits via `extendMarkdownConfig`). Verified: build clean (143 pages), **0** `github-dark`/dark inline bg in `dist`. Tradeoff (accepted): code blocks are now monochrome ink-on-cream, which matches what the CSS already targeted. **Revert:** `git revert -m 1 2865106` (restores the github-dark default).

**2. "How the stacks actually look" comparison polish.** The right SideBySide pane was a raw ASCII diagram in a code block while the left was prose (asymmetric, AI-looking). First reformatted both panes to parallel bullet lists (bold lead-ins, Playwright-verified desktop + 390px); then per Ian **cut the SideBySide entirely** (+ its now-unused import) because it repeated the two stack paragraphs directly above it and the `<SpectrumBar>` already carries the robust comparison. The section now flows `<SpectrumBar>` → two concrete stack paragraphs → `<ChooseIf>`. Final component lineup: KeyTakeaways → StatRow → SpectrumBar → (stack paragraphs) → ChooseIf → MyTake → BottomLine → Sources.

**3. PR #95 MERGED** (`25cecbe`) — the first post on the new `<ChooseIf>` decision-card standard, code-block fix inherited from master.

**Revert:** PR #98 `git revert -m 1 2865106`; PR #95 is content (`git revert` its squash commit).

---

## Quick reference — recent additions (Session 34, 2026-06-14)

**Prepped the AI side of three manual, human-only GTM tasks so Ian can copy-paste each step (no applications submitted, no LinkedIn page created, no Beehiiv import, no GSC action — all Ian's). Docs only, committed `eca6e13`.**

**1. Wave-2 affiliate applications ([APPLICATIONS.md](APPLICATIONS.md)).** Paste-ready doc for tools 11-20 ([AFFILIATE_PIPELINE.md](AFFILIATE_PIPELINE.md) rows 11-20: Lindy, Reply.io, KrispCall, Laxis, Close, Nutshell, GetResponse, AdCreative.ai, Motion, Brevo). A top "Standard answers" block (site URL, long-form audience, **~5K/mo traffic** per Ian, promo-methods, reusable "how will you promote us" paragraph, live-affiliate track record) + a per-tool block each carrying program/network, est. commission, the `/tools/<slug>/` hub to cite, real relevant post links (AdCreative.ai → its dedicated 2026-06-08 review; others → hub + 1-2 mapped comparison posts), a tool-specific promo angle, and `Applied/Approved` checkboxes mirroring the pipeline.

**2. LinkedIn + Beehiiv ([LINKEDIN_BEEHIIV.md](LINKEDIN_BEEHIIV.md)).** Section A: full from-scratch LinkedIn Company Page setup (name, slug `the-automations-guide`, tagline <120 chars, About <2,000 chars, Specialties list, first post) drawn from [about.astro](src/pages/about.astro) + homepage voice. Section B: ready-to-paste first-issue copy for both Beehiiv templates (Daily "The Briefing" = 1 feature + 3 links + sponsor; Weekly "The Guide" = 1 feature + 5 updates + 1 review + sponsor), populated with real posts/tools + `/go/<slug>` sponsor links, plus the per-send edit checklist. The HTML shells already exist in [brand-kit/beehiiv/](brand-kit/beehiiv/); this supplies the words.

**3. GSC Tier-2 ([GSC-TIER2-CHECKLIST.md](GSC-TIER2-CHECKLIST.md)).** Ordered Request-Indexing checklist of the **10** unindexed `/tools/*` hubs from [AUDIT-SEO-2026-06-14.md](AUDIT-SEO-2026-06-14.md) (bettercontact, circleback, fillout, fullenrich, leadmagic, lemlist, mailforge, surfe, vapi, vector), trailing-slash/canonical form; `/tools/warmly/` listed as the 11th but **monitor-only** (crawled-not-indexed = no action).

**4. [TODO.md](TODO.md) annotated** (4 inline `(PREPPED ...)` notes on the affiliate/LinkedIn/Beehiiv/GSC items; no items added/removed, order preserved, drift lint clean).

**Flag for Ian:** TODO.md still lists "Create LinkedIn Company Page" as open, but [OFF_SITE_SEO_CHECKLIST.md](OFF_SITE_SEO_CHECKLIST.md) + ops-log #281 mark it done (created 2026-06-12, `sameAs` live). Ian chose from-scratch setup this session (treating the existing page as a stub) — reconcile whether to close that TODO or downgrade the checklist's "done." **Revert:** `git revert eca6e13` (additive docs).

---

## Quick reference — recent additions (Session 33, 2026-06-14)

**Full SEO audit of the live site + fixed the one material finding (mobile Core Web Vitals). Shipped to prod via PR #91 (merge `0691ac6`).**

**1. Full SEO audit ([AUDIT-SEO-2026-06-14.md](AUDIT-SEO-2026-06-14.md)).** Technical (curl: robots/sitemap/redirects/headers) + on-page (built `dist/` scan) + indexing (GSC URL Inspection) + performance (Lighthouse prod). Verdict: exceptionally clean foundation — Lighthouse **SEO 1.00** everywhere, **0 hard on-page issues** (0 missing canonical / 0 duplicate titles / 0 multi-H1 across 89 indexable pages), correct rich JSON-LD (BlogPosting/FAQPage/SoftwareApplication/BreadcrumbList/Person/Org), clean single-hop redirects, AI crawlers allowed, sitemap excludes `/go/`+`/og/`+noindex. **Indexing: 67/89 indexed** — the 22 unindexed are brand-new pages awaiting first crawl (6 Session-32 `/teams` + `/playbooks` hubs, 5 recent posts, 11 newest `/tools` hubs); Request-Indexing list is in TODO.md. (GSC OAuth token re-consented this session — cached again, so `/audit-seo` + `gsc-index-status.py` won't hang on auth next time.) Non-critical findings logged in the report: homepage + 53 hub pages have no `og:image` fallback (M-1); 82/89 titles >62 chars (M-2); a11y 0.91 with frame-title/heading-order quick wins (M-3); em-dash `<title>` separator on 88/89 (L-1).

**2. Reusable SEO tooling.** [qa/seo-scan.mjs](qa/seo-scan.mjs) (`npm run qa:seo`) — noindex-aware sitewide on-page scanner (title/desc length, canonical/og/H1 presence, dup titles), slots into the existing qa/ gate suite. [.claude/commands/audit-seo.md](.claude/commands/audit-seo.md) — full-site SEO audit command (technical → indexing → on-page → perf → report).

**3. C-1 mobile Core Web Vitals fix (the material finding), DEPLOYED.** Mobile was failing sitewide (Perf 0.65, LCP ~7.5-7.8s; desktop fine at 0.99). Root cause: the **beehiiv newsletter embed** ([EmailSignup.astro](src/components/EmailSignup.astro)) loaded `v3/loader.js` eagerly on every page → ~25 sub-requests (Stimulus app, flatpickr, its own webfont + GTM container `GTM-WJXL7FH`, a Cloudflare challenge), plus **PostHog + GA4** ([Analytics.astro](src/components/Analytics.astro)) loaded eagerly. Fix: lazy-load the beehiiv embed via IntersectionObserver (600px early, 290px space reserve = CLS-safe, `<noscript>` fallback) + defer PostHog/GA4 to first-interaction OR `requestIdleCallback` (3s ceiling), mirroring homegrowngrowth.co. Tradeoff (accepted): a visitor who bounces in <~3s without interacting isn't counted. **Prod after deploy: home mobile 0.65→0.83 (LCP 7.8s→3.4s); post 0.67→0.86 (LCP 7.5s→3.2s); CLS 0; a11y/BP/SEO unchanged.** Fonts left render-blocking on purpose — a non-blocking print-swap was tested but added font-swap CLS on text-heavy posts with no reliable LCP gain; deferred as the CLS-safe follow-up (the remaining LCP gap to <2.5s, now in TODO.md).

**Verification:** build clean (141 pages); prod homepage/post initial load carry **zero** eager beehiiv/analytics requests (both load on demand). **Revert:** `git revert -m 1 0691ac6` — all changes additive/behavioral (defer-loading + new tooling files), no schema/route/content change.

---

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
