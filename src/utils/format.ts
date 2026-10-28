export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

export function formatCount(n: number, locale?: string): string {
  return new Intl.NumberFormat(locale, { notation: n >= 10_000 ? 'compact' : 'standard' }).format(
    n,
  );
}

/** Strip simple HTML that sometimes appears in NASA descriptions. */
export function stripHtml(text: string): string {
  return text
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}
