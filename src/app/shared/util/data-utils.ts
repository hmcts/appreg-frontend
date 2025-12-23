export function asObj(v: unknown): Record<string, unknown> | null {
  return v && typeof v === 'object' ? (v as Record<string, unknown>) : null;
}

export function asArr(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}

/**
 * Coerce to string only if the input is already a string or number.
 * Useful when IDs can arrive as either "123" or 123.
 */
export function asStrOrNum(v: unknown): string {
  if (typeof v === 'string') {
    return v;
  }
  if (typeof v === 'number') {
    return String(v);
  }
  return '';
}
