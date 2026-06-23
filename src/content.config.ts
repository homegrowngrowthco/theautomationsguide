import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  // Astro 5 Content Layer API: the legacy `type: 'content'` collection is now a
  // glob loader pointing at the same folder. Entry ids are derived from the
  // filename (e.g. 2026-06-16-foo.mdx -> "2026-06-16-foo"), identical to the old
  // slug, so /blog/<id>/ and /og/<id>.png URLs are unchanged.
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
