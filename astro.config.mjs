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
