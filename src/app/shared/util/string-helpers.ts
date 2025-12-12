export function trimToString(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

export function trimToUndefined(v: unknown): string | undefined {
  const s = trimToString(v);
  return s === '' ? undefined : s;
}
