export function filterSuggestions<T>(
  items: T[],
  query: string,
  matches: (item: T, q: string) => boolean,
  limit = 20,
): T[] {
  const q = (query ?? '').trim().toLowerCase();
  if (!q) {
    return [];
  }
  return (items ?? []).filter((i) => matches(i, q)).slice(0, limit);
}

export const courtMatches = (
  c: { name?: string; locationCode?: string },
  q: string,
): boolean =>
  (c.name ?? '').toLowerCase().includes(q) ||
  (c.locationCode ?? '').toLowerCase().includes(q);

export const cjaMatches = (
  x: { code?: string; description?: string },
  q: string,
): boolean =>
  (x.code ?? '').toLowerCase().includes(q) ||
  (x.description ?? '').toLowerCase().includes(q);
