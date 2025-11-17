import { ApplicationListEntriesApi, ContactDetails } from '../../../../generated/openapi';

export type ApplicantStep = 'select' | 'person' | 'org' | 'standard';

export type CreateBody = NonNullable<
  Parameters<ApplicationListEntriesApi['createApplicationListEntry']>[1]
>;

type Writable<T> = { -readonly [K in keyof T]: T[K] };

export type CDWrite = Partial<Writable<ContactDetails>>;

export const toOpt = (v: string | null | undefined): string | undefined => {
  const t = v?.trim();
  return t || undefined;
};