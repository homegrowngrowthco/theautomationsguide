# QA scripts

Two layers: **deterministic gates** (plain Node, $0, run in CI as hard gates) and **visual QA** (Playwright + Claude Vision).

## Deterministic gates (no API key, no browser)

Run in CI on every content PR and locally. They catch the *class* of formatting/render defect that used to reach Ian, deterministically.

```bash
npm run build        # render-acceptance reads dist/, so build first
npm run qa:lint      # syntax/structure: bad /go + /tools slugs, em dashes, <style>/grid squish
                     #   wrappers, hallucinated components, + registry integrity & logo completeness
npm run qa:render    # RENDERED result: post actually rendered, DecisionTree branches all render,
                     #   registry-backed tool logos actually show up in the HTML
```

- [`lint-content.mjs`](lint-content.mjs) — `--post <path> | --slug <slug> | --all [--fix]`. Source-side. `--fix` auto-corrects the safe class (strips `<style>`/multi-column wrappers, em dashes). Exit 1 on any HARD violation.
- [`render-acceptance.mjs`](render-acceptance.mjs) — `--post | --slug | --all`. Parses built `dist/blog/<slug>/index.html` (via `linkedom`) and asserts rendered-result invariants. **Requires `npm run build` first.** Exit 1 on any HARD violation.
- [`registry.mjs`](registry.mjs) — shared registry/MDX-parse helpers (one source of truth for "does this tool have a logo" + "which tools a post references"), imported by both so they can't drift apart.

The two are complementary on logos: `qa:lint` warns when a compared tool has **no logo in the registry** (source gap); `qa:render` hard-fails when the registry **says** a tool has a logo but it **didn't render** (render-path regression).

## Visual QA (Playwright + Claude Vision)

Playwright screenshots at 4 breakpoints, optionally piped to Claude Sonnet for a layout review pass.

## Setup (one-time)

```bash
# 1. Install Playwright Chromium (browsers go to %USERPROFILE%\AppData\Local\ms-playwright,
#    NOT inside OneDrive — safe).
npx playwright install chromium

# 2. Add your Anthropic API key to .env at the project root.
echo "ANTHROPIC_API_KEY=sk-ant-..." > .env
```

## Workflow

### Local — full QA pass

```bash
# Build the static site (Pagefind index runs as part of build).
npm run build

# Serve the static build on localhost:4321.
npm run preview

# In a second terminal:
npm run qa
```

`npm run qa` runs both:
1. `qa:screenshots` — Playwright captures every blog post + key static page at mobile (375), tablet (768), desktop (1280), and wide (1440). Output: `qa-screenshots/<slug>/<viewport>.png`.
2. `qa:review` — sends each page's 4 screenshots to Claude Sonnet 4.6, asking for layout issues. Output: `qa-review.md` at the project root.

Both outputs are gitignored.

### Reviewing a Netlify deploy preview

```bash
QA_BASE_URL=https://deploy-preview-7--theautomationsguide.netlify.app npm run qa:screenshots
npm run qa:review
```

### Just one pass

```bash
npm run qa:screenshots   # only screenshots, no Claude review
npm run qa:review        # only review, assuming screenshots already exist
```

## What the Claude review catches

The prompt focuses on layout issues that look unprofessional:
- Width inconsistencies (header at one width, content below at another)
- Components overflowing or wrapping awkwardly (e.g. 3-card row wrapping to 2+1)
- Vertical spacing that's too loose or tight between sections
- Mobile cards that feel inflated/wasteful
- Text/visual misalignment inside SideBySide blocks
- Reading lines that run too wide
- Anything that breaks the visual rhythm

It does **not** catch: copy quality, factual errors, SEO issues, perf, accessibility (a11y). Those are separate review passes.

## Cost

A typical run (~10 pages × 4 viewports = 40 images) at Sonnet 4.6 vision rates is **~$0.15–0.25**. Run as often as you want.

## Auto-fix pipeline (GitHub Action)

A separate GitHub Action — [`.github/workflows/qa-content-pr.yml`](../.github/workflows/qa-content-pr.yml) — runs the QA loop automatically on every engine-generated content PR. Lives in GitHub Actions, not n8n, because Playwright is native to GHA.

### Flow

```
Engine opens PR (content/* branch)
        │
        ▼
GHA waits for Netlify deploy preview = SUCCESS
        │
        ▼
qa-screenshots.mjs against the deploy-preview URL
        │
        ▼
qa-pr-review.mjs → Claude Vision → JSON verdict
        │
        ├── shouldFix=false ───▶ "QA pass" PR comment, exit
        │
        ├── shouldFix=true + < 2 prior fixes
        │     │
        │     ▼
        │   qa-pr-fix.mjs → Claude rewrites the .mdx
        │     │
        │     ▼
        │   Build verifies, commit `[qa-fix-N]`, push
        │     │
        │     ▼
        │   PR sync triggers a fresh QA run on the new commit
        │
        └── shouldFix=true + 2 prior fixes already
              │
              ▼
            "Manual review needed" PR comment + Slack alert, exit
```

### Why the 2-fix cap

Two fix attempts is enough to handle most layout issues without burning into infinite-loop territory. If Claude's two attempts haven't resolved the issue, the third attempt is unlikely to and the cost of running it pays for nothing. Cap = max ~$0.30 per PR in API spend.

### Setup (one-time)

1. **Add the `ANTHROPIC_API_KEY` repo secret.** GitHub → repo Settings → Secrets and variables → Actions → *New repository secret* → name `ANTHROPIC_API_KEY`, value `sk-ant-...`. Use the same key as the n8n Cloud credential, or generate a separate key for CI traceability.
2. **Confirm `SLACK_WEBHOOK_URL` is set** (already added for the auto-merge GHA — same secret reused here for manual-review pings).
3. **First run:** open any test content PR. The action triggers automatically on `content/*` branches.

### Tracking attempts

The action counts commits matching `[qa-fix-N]` on the branch since `origin/master`. This means:
- A fresh content PR has 0 prior fixes
- After the first auto-fix commit, count=1
- After the second auto-fix commit, count=2 → next QA run that finds issues falls through to manual review

### Cost per PR

- Screenshots: free (Playwright in GHA)
- Vision review: ~$0.05 (4 images × Sonnet 4.6 vision)
- Fix generation (only if review says shouldFix): ~$0.05–$0.10 (full post in/out)
- Worst case (initial review + 2 fix attempts + 2 re-reviews): ~$0.25–$0.30

### Known limitation — auto-loop is one-shot (2026-05-12)

The `[qa-fix-N]` commits are pushed using the default `GITHUB_TOKEN`. By GitHub Actions security design, **pushes made with `GITHUB_TOKEN` do NOT trigger new workflow runs**. This was intentional on GitHub's side (loop prevention) but it means our intended `review → fix-1 → re-review → optional fix-2 → re-review` flow degrades to `review → fix-1 → (human reviews deploy preview manually)`.

The fix-1 commit still lands on the PR branch and Netlify rebuilds the deploy preview with the fix applied — so the visual-review loop still works, just without the automated 2nd-pass verification.

**To restore the full 2-attempt auto-loop:** swap the `Commit and push the fix` step in `.github/workflows/qa-content-pr.yml` to use a fine-grained PAT (stored as repo secret `AUTO_FIX_PAT`) instead of `GITHUB_TOKEN`. PAT-authored pushes DO trigger downstream workflows. The PAT needs `Contents: R/W` + `Pull requests: R/W` scoped to this repo. ~15 minutes of work when prioritized — flagged in [CLAUDE.md](../CLAUDE.md) §5 deferred items.

### Skipping the loop

If a generated post fails the same way twice and the auto-fix can't resolve it, you'll get a Slack ping. Options:
- Edit the .mdx manually on the PR branch (your edit doesn't carry a `[qa-fix-N]` marker, so the next QA run starts the counter fresh from a manual baseline)
- Close the PR if the post isn't worth the effort
- Dismiss as a false positive — push an empty commit with `[qa-skip]` in the message and the action skips itself (TODO: not yet implemented; current workaround is to disable the workflow file temporarily)

## Other future hooks

- Add Playwright accessibility checks (`@axe-core/playwright`) for a11y regression alongside visual.
- Visual regression diffing against a baseline screenshot set (catches drift the LLM might miss).
