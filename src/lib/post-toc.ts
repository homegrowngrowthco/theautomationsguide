// Shared between TableOfContents.astro (renders the list) and BlogPostLayout.astro
// (needs to know ahead of render whether the TOC will show at all, so it can
// decide whether to pair it with the TL;DR box or lay TL;DR out alone).
export interface TocHeading {
  depth: number;
  slug: string;
  text: string;
}

// Short posts aren't worth a nav block — same threshold the component always used.
export function tocHeadings(headings: TocHeading[] = []): TocHeading[] {
  return headings.filter((h) => h.depth === 2 && h.text?.trim());
}

export function hasToc(headings: TocHeading[] = []): boolean {
  return tocHeadings(headings).length >= 3;
}
