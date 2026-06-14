import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
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
