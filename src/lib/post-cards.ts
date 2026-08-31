// Classification helpers for the build-time /cards/<slug>.png generator
// (src/pages/cards/[...route].ts). Kept separate from src/data/tools.ts so the
// card generator's narrower selection logic (see selectCardLogos below) doesn't
// get confused with postMentionsTool, which serves a different purpose.
import type { CollectionEntry } from 'astro:content';
import type { Tool } from '../data/tools';
import { topicLabel } from './topic-label';

type Post = CollectionEntry<'blog'>;

const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Editorial section for the card's teal tab label. Title-pattern first (these
 * are the formats the growth audits show actually earn clicks — migrations,
 * 3-way comparisons, pricing breakdowns, reviews), falling back to the post's
 * primary topic tag via the same normalizer the homepage topic tiles use.
 */
export function classifySection(post: Post): string {
  const title = post.data.title ?? '';
  if (/\bvs\.?\b/i.test(title) || /alternative/i.test(title)) return 'Tool vs tool';
  if (/migrat/i.test(title)) return 'Migration guide';
  if (/pricing/i.test(title)) return 'Pricing breakdown';
  if (/review(ed)?/i.test(title)) return 'Review';

  // "guide"/"tools"/"comparison" are content-type meta-tags, not a topic (same
  // exclusion index.astro's topic tiles already apply). "automation" joins them
  // here: it's on 96 of 118 posts, so as a fallback label it's exactly as
  // generic as "guide"/"tools" — just at a much higher hit rate.
  const META_TAGS = new Set(['guide', 'tools', 'comparison', 'automation']);
  const tag = (post.data.tags ?? [])
    .map((t) => t.toLowerCase())
    .find((t) => !META_TAGS.has(t));
  return tag ? topicLabel(tag) : 'Guide';
}

/**
 * Up to 3 tools the card should show a logo for. Deliberately NOT
 * postMentionsTool (src/data/tools.ts) — that scans the full post body and
 * saturates at 3+ matches for nearly every post (incidental mentions in
 * related-post links, CTA boxes, "if you use X instead" asides), which is
 * useless as a "what is this post about" signal. This matches the title first,
 * left-to-right (so "X vs Y vs Z" titles keep their order), then tops up from
 * tags if the title alone doesn't fill 3 slots.
 */
export function selectCardLogos(post: Post, tools: Tool[]): Tool[] {
  const title = post.data.title ?? '';
  const tags = (post.data.tags ?? []).map(normalize);

  const firstTitleIndex = (tool: Tool): number => {
    const indexes = tool.aliases
      .map((alias) => title.match(new RegExp(`\\b${escapeRe(alias)}\\b`, 'i'))?.index)
      .filter((i): i is number => i !== undefined);
    return indexes.length ? Math.min(...indexes) : Infinity;
  };

  const titleMatches = tools
    .filter((tool) => firstTitleIndex(tool) !== Infinity)
    .sort((a, b) => firstTitleIndex(a) - firstTitleIndex(b));

  const selected: Tool[] = [...titleMatches];
  if (selected.length < 3) {
    const tagMatches = tools.filter(
      (tool) => !selected.includes(tool) && tool.aliases.some((alias) => tags.includes(normalize(alias)))
    );
    selected.push(...tagMatches);
  }

  return selected.slice(0, 3);
}

/**
 * Greedy word-wrap for the SVG headline, sized in characters rather than
 * measured pixel width (no font-metrics access at this layer) — calibrated
 * against Source Serif 4 700 at the card's headline size in src/pages/cards/.
 */
export function wrapHeadline(title: string, maxCharsPerLine: number, maxLines: number): string[] {
  const words = title.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxCharsPerLine && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
    if (lines.length === maxLines - 1 && current.length > maxCharsPerLine) break;
  }
  if (current) lines.push(current);

  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    kept[maxLines - 1] = kept[maxLines - 1].replace(/\s*\S*$/, '') + '…';
    return kept;
  }
  return lines;
}
