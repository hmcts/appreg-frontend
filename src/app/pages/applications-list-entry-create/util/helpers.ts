import { ContactDetails } from '@openapi';

// Helpers
export const toOptionalTrimmed = (
  input: string | null | undefined,
): string | undefined => {
  const s = input?.trim();
  return s || undefined;
};

export const toOptionalInteger = (input: unknown): number | undefined => {
  if (input === null) {
    return undefined;
  }

  if (typeof input === 'number') {
    if (!Number.isFinite(input) || !Number.isInteger(input) || input === 0) {
      return undefined;
    }
    return input;
  }

  if (typeof input !== 'string') {
    return undefined;
  }

  const asString = input.trim();
  if (!asString) {
    return undefined;
  }

  if (!/^\d+$/.test(asString)) {
    return undefined;
  }

  // If user enters 0 we still want to omit
  const n = Number(asString);
  return n === 0 ? undefined : n;
};

export const compactStrings = (
  values: (string | null | undefined)[],
): string[] | undefined => {
  const out = values.map((v) => v?.trim()).filter((v): v is string => !!v);
  return out.length ? out : undefined;
};

export function hasRequiredPerson(p: {
  firstName?: string | null;
  surname?: string | null;
  addressLine1?: string | null;
}): boolean {
  const first = toOptionalTrimmed(p.firstName);
  const sur = toOptionalTrimmed(p.surname);
  return !!first && !!sur;
}

export function hasRequiredOrg(o: {
  name?: string | null;
  addressLine1?: string | null;
}): boolean {
  const name = toOptionalTrimmed(o.name);
  const addr = toOptionalTrimmed(o.addressLine1);
  return !!name && !!addr;
}

export function pruneNullish<T extends object>(o: T): T {
  const rec = o as Record<string, unknown>;
  for (const [k, v] of Object.entries(rec)) {
    if (v === null || v === undefined) {
      delete rec[k];
    }
  }
  return o;
}

export const normalisePhone = (
  input: string | null | undefined,
): string | undefined => {
  const s = input?.trim();
  if (!s) {
    return undefined;
  }
  // keep only digits, spaces, hyphens (legacy)
  return s.replaceAll(/[^0-9 -]/g, '');
};

export function makeContactDetails(src: {
  addressLine1?: string | null;
  addressLine2?: string | null;
  addressLine3?: string | null;
  addressLine4?: string | null;
  addressLine5?: string | null;
  postcode?: string | null;
  phoneNumber?: string | null;
  mobileNumber?: string | null;
  emailAddress?: string | null;
}): ContactDetails {
  const cd: Partial<ContactDetails> = {
    addressLine1: toOptionalTrimmed(src.addressLine1)!,
    addressLine2: toOptionalTrimmed(src.addressLine2),
    addressLine3: toOptionalTrimmed(src.addressLine3),
    addressLine4: toOptionalTrimmed(src.addressLine4),
    addressLine5: toOptionalTrimmed(src.addressLine5),
    postcode: toOptionalTrimmed(src.postcode)?.toUpperCase(),
    phone: normalisePhone(src.phoneNumber),
    mobile: normalisePhone(src.mobileNumber),
    email: toOptionalTrimmed(src.emailAddress),
  };

  pruneNullish(cd);
  return cd as ContactDetails;
}
