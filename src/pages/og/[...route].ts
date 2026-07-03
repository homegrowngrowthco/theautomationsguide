// Per-post Open Graph share images, generated at BUILD time (free, no runtime/
// no paid service) via astro-og-canvas (wasm). Produces /og/<slug>.png — a branded
// card (post title + primary tag + site name on the cream/teal brand) used for
// og:image, twitter:image, and the BlogPosting JSON-LD image. Additive: if a card
// fails to generate, posts simply fall back to no og:image (build still succeeds).
import { getCollection } from 'astro:content';
import { OGImageRoute } from 'astro-og-canvas';

const posts = await getCollection('blog', ({ data }) => !data.draft);
const pages = Object.fromEntries(posts.map((p) => [p.slug, p.data]));

// Default share card (M-2) — /og/default.png. Used by BaseLayout for every
// non-post page (home, /blog, /about, /tools, /reviews, /playbooks, /teams/*)
// so link shares never render a bare text card. Same branded card style as posts.
pages['default'] = {
  title: 'The RevOps & GTM automation playbook',
  tags: ['Guides · Reviews · Workflows'],
} as (typeof posts)[number]['data'];

export const { getStaticPaths, GET } = OGImageRoute({
  param: 'route',
  pages,
  getImageOptions: (_path, page: (typeof posts)[number]['data']) => ({
    title: page.title,
    description: (page.tags?.[0] ? page.tags[0].toUpperCase() + '  ·  ' : '') + 'The Automations Guide',
    bgGradient: [[253, 252, 248]],
    border: { color: [20, 168, 144], width: 24, side: 'inline-start' },
    padding: 70,
    font: {
      title: { color: [38, 43, 50], size: 62, weight: 700, lineHeight: 1.25 },
      description: { color: [13, 140, 120], size: 28, weight: 600 },
    },
  }),
});
