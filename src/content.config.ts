import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
// Astro 6+: zod is no longer re-exported from astro:content; import it from astro/zod.
import { z } from 'astro/zod';

const blog = defineCollection({
  // Astro 5+ Content Layer API: the legacy `type: 'content'` collection is a glob
  // loader on the same folder. Entry ids come from the filename (2026-06-16-foo.mdx
  // -> "2026-06-16-foo"), the same as the old slug, so /blog/<id>/, /og/<id>.png and
  // /cards/<id>.png URLs are unchanged (op #1538, M3 dependency patch).
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    // Bolded answer-first summary rendered at the very top of the post (GEO: gives
    // AI answer engines an extractable definitive answer above the fold).
    tldr: z.string().optional(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    author: z.string().default('The Automations Guide'),
    tags: z.array(z.string()).default([]),
    // Optional explicit audience-hub membership (slugs from src/data/audiences.ts).
    // Most posts are matched to hubs by tag; this is an override/force-include.
    audiences: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    faqs: z.array(z.object({ question: z.string(), answer: z.string() })).optional(),
  }),
});

export const collections = { blog };
