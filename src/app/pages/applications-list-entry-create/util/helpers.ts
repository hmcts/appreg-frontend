import { ContactDetails } from '../../../../generated/openapi';

// Helpers
export const toOptionalTrimmed = (
  input: string | null | undefined,
): string | undefined => {
  const s = input?.trim();
  return s || undefined;
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
    if (v === null) {
      delete rec[k];
    }
  }
  return o;
}

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
    postcode: toOptionalTrimmed(src.postcode),
    phone: toOptionalTrimmed(src.phoneNumber),
    mobile: toOptionalTrimmed(src.mobileNumber),
    email: toOptionalTrimmed(src.emailAddress),
  };

  pruneNullish(cd);
  return cd as ContactDetails;
}
