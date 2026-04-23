import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const GET: APIRoute = async () => {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());

  const articleLines = posts
    .map((post) => {
      const url = `https://theautomationsguide.com/blog/${post.slug}`;
      return `- [${post.data.title}](${url}): ${post.data.description}`;
    })
    .join('\n');

  const body = `# The Automations Guide

> Practical automation guides, tool reviews, and workflows for revenue operations
> and go-to-market teams. Independent publication covering Zapier, Make, n8n,
> HubSpot, Salesforce, and the modern RevOps stack.

## Core Pages
- [Home](https://theautomationsguide.com/): Overview of the publication
- [About](https://theautomationsguide.com/about): Mission and editorial approach
- [Blog](https://theautomationsguide.com/blog): All articles

## Articles
${articleLines}

## About
The Automations Guide is an independent publication. Articles are based on
hands-on testing. Some links are affiliate links, disclosed on each page.
`;

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
