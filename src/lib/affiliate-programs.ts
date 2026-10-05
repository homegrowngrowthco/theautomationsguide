// Live affiliate PROGRAMS (not links) from src/data/affiliate-links.ts, for the
// disclosure page. The registry holds one entry per /go/ slug, so a program with
// page-specific deep links has several live entries (`apollo`, `apollo-signup`,
// `apollo-pricing`). A live key whose hyphen prefix is itself a live key is one of
// those variants; hyphenated program keys (`reply-io`, `cal-com`) have no such
// prefix and stay. The prefix idea of deepLinkParent() in qa/auto-register-tools.mjs,
// without its "parent is a registered tool" condition (a program needs no hub).
import { affiliateLinks } from '../data/affiliate-links';

export type LiveProgram = { slug: string; name: string };

export function liveAffiliatePrograms(): LiveProgram[] {
  const live = Object.entries(affiliateLinks).filter(([, v]) => v.status === 'live');
  const keys = new Set(live.map(([k]) => k));
  const isVariant = (k: string) => {
    const parts = k.split('-');
    for (let i = 1; i < parts.length; i++) if (keys.has(parts.slice(0, i).join('-'))) return true;
    return false;
  };
  return live
    .filter(([k]) => !isVariant(k))
    .map(([slug, v]) => ({ slug, name: v.name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
