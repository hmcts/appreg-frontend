/* 
suggestions.ts
Text-suggestion utilities for Court and CJA fields.

Exports:
- filterSuggestions(list, search, matcher): returns ranked subset for autosuggest
- courtMatches(item, search): match/pick fields for court entries
- cjaMatches(item, search): match/pick fields for CJA entries

Behavior:
- Normalizes input (trim, case-insensitive)
- Supports partial and prefix matches
- Stable ordering for equal scores

Input: data list, user search string, matcher fn
Output: filtered list suitable for suggestion UIs
*/

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
