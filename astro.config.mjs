import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import { FontaineTransform } from 'fontaine';

// Pages we intentionally noindex — must be excluded from the sitemap, otherwise
// GSC reports "Excluded by 'noindex' tag" (sitemap and page directive disagree).
const NOINDEX_PATHS = ['/search/', '/privacy/', '/terms/', '/disclosure/'];

// In-body markdown affiliate links — [Clay](/go/clay) — render as bare <a> with
// no rel. The structured component CTAs already carry rel="noopener noreferrer
// sponsored"; this stamps the same on every prose /go/ link at build so the whole
// site is consistent (audit M-4). Self-contained hast walk, no extra deps.
function rehypeAffiliateRel() {
  return (tree) => {
    const visit = (node) => {
      if (
        node.tagName === 'a' &&
        typeof node.properties?.href === 'string' &&
        node.properties.href.startsWith('/go/')
      ) {
        node.properties.rel = 'sponsored noopener noreferrer';
      }
      node.children?.forEach(visit);
    };
    visit(tree);
  };
}

export default defineConfig({
  site: 'https://theautomationsguide.com',
  // Canonical URL form is trailing-slash (directory output + sitemap + canonical
  // tags all already emit it). Setting these explicitly keeps internal links and
  // the dev server aligned to the one indexable form so we stop feeding Google the
  // redirecting no-slash variant. Output is unchanged (directory is Astro's default).
  trailingSlash: 'always',
  // inlineStylesheets 'always': the LCP element on posts is text (the TL;DR box),
  // and the ~34KB post CSS bundle was the last render-blocking request (audit
  // 2026-07-07: mobile LCP 2.6s, 1.2s of it element render delay). Inlining trades
  // cross-page CSS caching for zero blocking stylesheet fetches, the right side of
  // the trade for a content site where most sessions are single-page organic visits.
  build: { format: 'directory', inlineStylesheets: 'always' },
  // Code blocks are styled by the cream/ink design system in global.css
  // (.prose pre = cream bg + border, .prose pre code = ink text). Astro's default
  // Shiki highlighter (github-dark) injects an inline dark background-color on
  // <pre> that overrides that cream rule, and a plaintext (no-language) fence emits
  // no per-token colors, so .prose pre code's ink text lands on the dark inline bg
  // = an unreadable "blank black box". Disabling syntaxHighlight emits clean
  // <pre><code> with no inline styles, letting the CSS fully control the look
  // (cream box, ink monochrome text) on every post. MDX inherits this via
  // extendMarkdownConfig (default true).
  markdown: { syntaxHighlight: false, rehypePlugins: [rehypeAffiliateRel] },
  vite: {
    plugins: [
      // Generate metric-matched fallback @font-face faces (size-adjust /
      // ascent-override / descent-override) for the self-hosted @fontsource
      // families so the swap from system fallback to the real webfont causes ~0
      // layout shift (CLS). `fallbacks: {}` (an empty object, NOT omitted —
      // fontaine 0.8 indexes fallbacks[family] and crashes on undefined) routes
      // each family to its category-aware default local(): Arial for
      // sans/display, Times New Roman/Georgia for the serif, Courier New for
      // mono. The generated faces are named "<Family> fallback"; because our
      // font stacks live in CSS custom properties (--font-*), which fontaine's
      // font-family walk skips, we reference those names explicitly in global.css.
      FontaineTransform.vite({ fallbacks: {} }),
    ],
  },
  integrations: [
    mdx(),
    sitemap({
      filter: (page) => {
        const path = new URL(page).pathname;
        if (path.startsWith('/go/')) return false;
        if (path.startsWith('/og/')) return false; // per-post OG images, not indexable pages
        return !NOINDEX_PATHS.includes(path);
      },
    }),
  ],
});
