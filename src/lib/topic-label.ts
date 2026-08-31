// Editorial casing for raw tag values — CSS text-transform:capitalize breaks
// brand casing (HubSpot -> Hubspot, n8n -> N8n), so map it explicitly. Shared by
// the homepage topic tiles and the per-post card generator (src/pages/cards/)
// so both display the same label for a given tag.
export const topicLabelMap: Record<string, string> = {
  crm: 'CRM',
  hubspot: 'HubSpot',
  revops: 'RevOps',
  ai: 'AI',
  n8n: 'n8n',
  saas: 'SaaS',
};

export function topicLabel(tag: string): string {
  if (topicLabelMap[tag]) return topicLabelMap[tag];
  return tag.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}
