import { getCollection, type CollectionEntry } from 'astro:content';

// Audience / role hubs powering the "Teams" nav dropdown and /teams/<slug>/ pages.
// Posts are tagged by TOPIC, not audience, so each hub auto-collects posts whose
// topic tags intersect `tags` (case-insensitive). A post can also opt in
// explicitly via its `audiences:` frontmatter (slug match) as an override.
export interface Audience {
  slug: string; // URL segment: /teams/<slug>/
  navLabel: string; // dropdown + card label, e.g. "For Sales"
  title: string; // page H1 (keyword-rich)
  description: string; // page subhead + meta description (keyword-rich)
  tags: string[]; // topic tags (lowercase) that map to this audience
}

// NOTE: tags below are the REAL frontmatter tags in use (the taxonomy is mostly
// topic/type tags, not tool-name tags). `automation` is deliberately excluded as
// an audience signal because it sits on ~27/36 posts and would collapse a hub
// into the full blog.
export const audiences: Audience[] = [
  {
    slug: 'sales',
    navLabel: 'For Sales',
    title: 'Cold Email & Outbound Automation for Sales Teams',
    description:
      'Cold email, outbound sequencing, and sales-engagement playbooks and tool reviews for sales teams and SDRs.',
    tags: [
      'outbound',
      'cold-email',
      'cold-outbound',
      'sales-engagement',
      'sales-tech',
      'sales-ops',
      'apollo',
      'outreach-platform-criticism',
    ],
  },
  {
    slug: 'revops',
    navLabel: 'For RevOps',
    title: 'Automation Playbooks for RevOps Teams',
    description:
      'CRM operations, pipeline data quality, revenue intelligence, and the tooling decisions RevOps teams actually face.',
    tags: [
      'revops',
      'revenue-intelligence',
      'lead-enrichment',
      'pipeline-data-quality',
      'crm',
      'hubspot',
      'salesforce',
      'workflow',
      'tech stack',
    ],
  },
  {
    slug: 'marketing',
    navLabel: 'For Marketing',
    title: 'Newsletter & Email Automation for Marketing Teams',
    description:
      'Newsletter automation, email marketing, demand gen, and creative ops workflows and tool reviews for marketing teams.',
    tags: [
      'newsletter',
      'email-marketing',
      'email',
      'creators',
      'demand-gen',
      'creative-ops',
    ],
  },
  {
    slug: 'founders',
    navLabel: 'For Founders',
    title: 'Lean GTM Stacks for Founders',
    description:
      'Budget-friendly automation stacks, tool roundups, and build-vs-buy calls for founders and small GTM teams.',
    tags: ['budget', 'budget-tools', 'strategy', 'tech stack', 'tools'],
  },
];

export function getAudience(slug: string): Audience | undefined {
  return audiences.find((a) => a.slug === slug);
}

export function postMatchesAudience(
  post: CollectionEntry<'blog'>,
  audience: Audience,
): boolean {
  const explicit = post.data.audiences ?? [];
  if (explicit.includes(audience.slug)) return true;
  const tags = post.data.tags.map((t) => t.toLowerCase());
  return audience.tags.some((t) => tags.includes(t));
}

export async function getAudiencePosts(
  audience: Audience,
): Promise<CollectionEntry<'blog'>[]> {
  const all = await getCollection('blog', ({ data }) => !data.draft);
  return all
    .filter((p) => postMatchesAudience(p, audience))
    .sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime());
}
