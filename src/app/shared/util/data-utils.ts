export function asObj(v: unknown): Record<string, unknown> | null {
  return v && typeof v === 'object' ? (v as Record<string, unknown>) : null;
}

export function asArr(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}

export type Indexable = Record<string, unknown>;

export function isRecord(x: unknown): x is Indexable {
  return typeof x === 'object' && x !== null;
}

export function asString(v: unknown): string | null {
  return typeof v === 'string' ? v : null;
}

export function hasStringProp<K extends string>(
  o: Indexable,
  key: K,
): o is Indexable & Record<K, string> {
  return typeof o[key] === 'string';
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

export function makeTempId(prefix = 'tmp'): string {
  const c = globalThis.crypto;
  if (c && 'randomUUID' in c && typeof c.randomUUID === 'function') {
    return `${prefix}_${c.randomUUID()}`;
  }

  // Fallback: use getRandomValues (still cryptographically strong)
  if (c && 'getRandomValues' in c && typeof c.getRandomValues === 'function') {
    const bytes = new Uint8Array(16);
    c.getRandomValues(bytes);
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join(
      '',
    );
    return `${prefix}_${Date.now()}_${hex}`;
  }

  // Last resort (should be rare): no crypto available
  return `${prefix}_${Date.now()}_${Math.floor(Date.now() * 1000)}`;
}
