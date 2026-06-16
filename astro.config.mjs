import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';

// Pages we intentionally noindex — must be excluded from the sitemap, otherwise
// GSC reports "Excluded by 'noindex' tag" (sitemap and page directive disagree).
const NOINDEX_PATHS = ['/search/', '/privacy/', '/terms/', '/disclosure/'];

export default defineConfig({
  site: 'https://theautomationsguide.com',
  // Canonical URL form is trailing-slash (directory output + sitemap + canonical
  // tags all already emit it). Setting these explicitly keeps internal links and
  // the dev server aligned to the one indexable form so we stop feeding Google the
  // redirecting no-slash variant. Output is unchanged (directory is Astro's default).
  trailingSlash: 'always',
  build: { format: 'directory' },
  // Code blocks are styled by the cream/ink design system in global.css
  // (.prose pre = cream bg + border, .prose pre code = ink text). Astro's default
  // Shiki highlighter (github-dark) injects an inline dark background-color on
  // <pre> that overrides that cream rule, and a plaintext (no-language) fence emits
  // no per-token colors, so .prose pre code's ink text lands on the dark inline bg
  // = an unreadable "blank black box". Disabling syntaxHighlight emits clean
  // <pre><code> with no inline styles, letting the CSS fully control the look
  // (cream box, ink monochrome text) on every post. MDX inherits this via
  // extendMarkdownConfig (default true).
  markdown: { syntaxHighlight: false },
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
