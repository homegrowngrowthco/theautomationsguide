import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    author: z.string().default('The Automations Guide'),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    faqs: z.array(z.object({ question: z.string(), answer: z.string() })).optional(),
  }),
});

export const collections = { blog };
