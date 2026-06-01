# Beehiiv Import Guide

These two HTML files are **inbox-safe, Beehiiv-compatible** versions of the design system newsletter templates. They're stripped of everything Beehiiv would reject (`<style>` blocks, `<link>` font imports, `<script>`) and use inline styles on every element with table-based layout for maximum email client compatibility.

## How to import each one

**Option A — Paste as full HTML template (recommended for first send)**

1. In Beehiiv, click **New → Template post**
2. Choose **Blank draft**
3. Click anywhere in the body, type `/`, choose **HTML Snippet** under Premium
4. Open one of the files in any text editor
5. Copy everything inside the `<body>...</body>` tags
6. Paste into the HTML Snippet input, click **Preview**, then save
7. Save the resulting post as a template: click the **Save as template** icon, name it (e.g. "The Briefing — Daily"), click **Save template**

You now have a reusable template. Future sends: New post → My Templates → pick the cadence.

**Option B — Recreate in Beehiiv editor using these as a visual reference**

For long-term flexibility (Beehiiv's editor handles dark mode + mobile better than raw HTML), open these in a browser to see the look, then rebuild block-by-block in Beehiiv's native editor using:

- The hex codes documented in the design system
- The fonts named in each file
- The section order

## Files

| File | Cadence | Send time | Color signature |
|---|---|---|---|
| `daily.html`   | Mon–Fri | 7:00 ET | Warm cream paper, orbital mark |
| `weekly.html`  | Sundays | 9:00 ET | Deep teal masthead, parchment body, ochre accent |

## Beehiiv constraints these files respect

- **No `<style>` blocks.** Beehiiv strips them. Every style is inlined on the element.
- **No `<link>` to Google Fonts.** They never load in email clients. We use system font stacks with Georgia / Times New Roman fallbacks for the serif, and standard sans-serif / monospace.
- **No `<script>`.** Stripped.
- **No `<iframe>`.** Won't render in the email version.
- **Tables for layout.** Outlook still uses Word's renderer, which only reliably supports tables.
- **Inline width caps at 600px.** Standard email max-width.

## Editing checklist before each send

1. **Issue number** — find the `#NNN` or `Issue NNN` and update
2. **Date** — find the dateline (e.g. `May 11, 2026`) and update
3. **Headlines and copy** — keep the structure, swap the text
4. **Affiliate / sponsor link** — replace `#` href with the live URL
5. **Read-time estimate** — eyeball it, update the `X min read` line
6. **Preview header text** — Beehiiv's preview text field is separate; write a fresh line for each send (it's what shows next to the subject line in the inbox)

## Cadence positioning (locked in design)

- **Daily — The Briefing.** One thing, three quick links, one sponsor slot. ~3 min read. Designed for phones at 7am.
- **Weekly — The Guide.** One feature, five things shipping, one tool review, one sponsor. ~9 min read. The flagship.

## Things to test before going live

Send a test from Beehiiv to yourself and check on:
- Gmail web (light mode)
- Gmail web (dark mode — Gmail aggressively re-themes; light teal sometimes becomes hard to read)
- Apple Mail (iPhone)
- Outlook desktop (the renderer breaks unusual CSS)
- Superhuman / Hey if your audience uses them

If anything breaks specifically in dark mode, add `[data-ogsc] *` overrides or wrap critical color elements with `<!--[if !mso]><!-- -->` conditional comments. Most things in these files are already dark-mode safe.

— Last updated: May 12, 2026
