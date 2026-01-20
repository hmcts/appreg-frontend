import type { ErrorItem } from '@components/error-summary/error-summary.component';

// TODO: Refactor TextInput/SelectInput to accept ErrorItem[] directly,
export function buildErrorTextByDomId(
  items: readonly ErrorItem[] | null | undefined,
): Record<string, string> {
  const out: Record<string, string> = {};
  if (!items?.length) {
    return out;
  }

  for (const e of items) {
    const href = typeof e.href === 'string' ? e.href : undefined;
    const domId = href?.startsWith('#') ? href.slice(1) : (e.id ?? undefined);

    if (!domId) {
      continue;
    }

    // keep first message
    out[domId] ??= e.text;
  }

  return out;
}

export function errorTextForDomId(
  map: Record<string, string>,
  domId: string,
): string | null {
  return map[domId] ?? null;
}

export function getUniqueErrors(
  parentErrors: readonly ErrorItem[],
  childErrors: readonly ErrorItem[],
): ErrorItem[] {
  const uniq = new Map<string, ErrorItem>();

  for (const e of [...parentErrors, ...childErrors]) {
    const key = `${e.id ?? ''}|${e.text}`;
    uniq.set(key, e);
  }

  return [...uniq.values()];
}
