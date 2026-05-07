# QA scripts

Automated visual QA for the site — Playwright screenshots at 4 breakpoints, optionally piped to Claude Sonnet for a layout review pass.

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

## Future hooks

- Wire `npm run qa` into the n8n `blog-post-engine` workflow so every PR gets an auto-generated `qa-review.md` posted as a PR comment.
- Add Playwright accessibility checks (`@axe-core/playwright`) for a11y regression alongside visual.
