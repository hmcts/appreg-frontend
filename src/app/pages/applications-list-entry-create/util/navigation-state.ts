type CreateNavState = {
  entryCreateSnapshot?: unknown;
  paymentRefReturn?: unknown;
};

export function parseCreateNavState(
  raw: Record<string, unknown> | null,
): CreateNavState {
  if (raw === null || typeof raw !== 'object') {
    return {};
  }

  const parsed: CreateNavState = {};

  if ('entryCreateSnapshot' in raw) {
    parsed.entryCreateSnapshot = raw['entryCreateSnapshot'];
  }
  if ('paymentRefReturn' in raw) {
    parsed.paymentRefReturn = raw['paymentRefReturn'];
  }

  return parsed;
}
