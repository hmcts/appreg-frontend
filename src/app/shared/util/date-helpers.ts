export function asIsoDate(v: unknown): string {
  // Accept yyyy-mm-dd or full ISO; otherwise blank
  if (typeof v !== 'string') {
    return '';
  }

  const s = v.trim();
  if (!s) {
    return '';
  }

  return /^\d{4}-\d{2}-\d{2}/.test(s) ? s : '';
}
