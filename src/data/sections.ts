import { getCollection, type CollectionEntry } from 'astro:content';
import { classifySection } from '../lib/post-cards';

// Editorial-format hubs powering /guides/<slug>/ and the homepage's "Browse by
// format" sections. Different taxonomy from src/data/audiences.ts (role, not
// format): a post's section here comes from classifySection() in
// src/lib/post-cards.ts (the same title-pattern classifier that drives the
// card generator's teal tab label), never a parallel tag-matching scheme.
//
// Only 3 of classifySection()'s 4 named formats get a /guides/ hub here.
// "Review" is deliberately left out: src/pages/reviews.astro already lives at
// /reviews/ and is the format's hub, so a /guides/reviews/ duplicate would
// split the same content across two URLs. The homepage's Reviews section
// (built directly in index.astro, not from this registry) links its
// "View all" at /reviews/ instead.
export interface Section {
  slug: string; // URL segment: /guides/<slug>/
  classifyLabel: string; // exact classifySection() return value this hub collects
  navLabel: string; // homepage sub-heading + nav-facing label
  title: string; // hub page H1 + meta title
  description: string; // hub page subhead + meta description
  dek: string; // one-line homepage card dek, Ian's voice
  intro: string[]; // 150-250 words of hand-written editorial prose, one string per paragraph
}

export const sections: Section[] = [
  {
    slug: 'migrations',
    classifyLabel: 'Migration guide',
    navLabel: 'Migration guides',
    title: 'Migration Guides: Switching RevOps Tools Without Losing Data',
    description:
      'Step-by-step guides for migrating off a CRM, cold email sender, or enrichment tool, covering what transfers automatically and what you have to rebuild by hand.',
    dek: 'What breaks when you move CRMs, sequencers, or email platforms, and the order to migrate in so you do not lose deal history or sender reputation.',
    intro: [
      "I write a migration guide every time I actually move a client off one tool and onto another, not because a vendor asked me to. That means each guide here covers a real switch: Pipedrive to Close, GetResponse to ActiveCampaign, Aircall to JustCall, the kind of move that happens because a team outgrew a tool or got burned by a price hike.",
      "The same pattern repeats across almost every migration. Contacts and deals export cleanly. Custom fields need to be recreated before you import, or the mapping silently drops them. Sequences, automations, and workflow logic almost never transfer, so budget real time to rebuild and test them before you cut over. Email history usually lands as flat notes instead of live threads.",
      "Start with the migration closest to your own stack. If you are not migrating yet but weighing a switch, the guide will tell you honestly how much rebuild work to expect, which is usually the number that decides whether the move is worth it.",
    ],
  },
  {
    slug: 'tool-vs-tool',
    classifyLabel: 'Tool vs tool',
    navLabel: 'Tool vs tool',
    title: 'Tool vs Tool: Head-to-Head RevOps Comparisons',
    description:
      'Direct comparisons of CRMs, sequencers, enrichment tools, and email platforms, decided by what they actually do differently in production, not by feature checklist.',
    dek: 'Two or three tools, the same job, tested side by side instead of read off a spec sheet.',
    intro: [
      'Every comparison here follows the same rule: I only write "X vs Y" when I have used both tools enough to know where they actually diverge, not just where their pricing pages differ. That is why the same few tools show up across multiple comparisons: Apollo, HubSpot, Pipedrive, Attio, ActiveCampaign. Most RevOps stacks are choosing between the same handful of options, and the honest answer is usually "it depends on your team size and data model," not a universal winner.',
      "I weigh the same things in every comparison: what breaks at scale, what the free trial actually lets you test, what support looks like when something goes wrong before a campaign goes live, and what it costs once you are past the entry tier. Feature parity gets a mention, but it rarely decides the call.",
      'If two tools you are choosing between are not covered yet, that is likely because I have not run both in production long enough to have an honest opinion, and I would rather say nothing than guess.',
    ],
  },
  {
    slug: 'pricing',
    classifyLabel: 'Pricing breakdown',
    navLabel: 'Pricing breakdowns',
    title: 'Pricing Breakdowns: What RevOps Tools Actually Cost',
    description:
      'Full pricing breakdowns for RevOps and GTM tools: seat minimums, credit costs, and the add-ons that do not show up on the plans page.',
    dek: 'What a tool actually costs once you add seats, credits, and the add-ons the pricing page does not show up front.',
    intro: [
      'Pricing pages for RevOps tools are built to make comparison hard: hidden seat minimums, credits that reset on a schedule nobody reads, and an "Enterprise" tier that is really "call us." Every breakdown here covers a single tool in depth, from Pipedrive to RB2B to LeadMagic, and pulls the real number: what you pay in month one, what triggers the first upgrade, and which add-ons the plans page does not mention until you hit a limit.',
      "I build these from the vendor's own published pricing, the same way the site's pricing index does, then add what I have actually seen clients get billed once seats, overages, or annual commitments show up. When a vendor changes pricing, the post gets a note, not a silent rewrite.",
      'If you are comparing more tools at once than a single post covers, the <a href="/revops-automation-pricing/">pricing index</a> has entry pricing for dozens of tools in one table, sourced and dated the same way.',
    ],
  },
];

export function getSection(slug: string): Section | undefined {
  return sections.find((s) => s.slug === slug);
}

export async function getSectionPosts(
  section: Section,
): Promise<CollectionEntry<'blog'>[]> {
  const all = await getCollection('blog', ({ data }) => !data.draft);
  return all
    .filter((p) => classifySection(p) === section.classifyLabel)
    .sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime());
}
