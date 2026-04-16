export const STANDARD_APPLICANTS_SORT_MAP: Record<string, string> = {
  code: 'code',
  name: 'name',
  address: 'addressLine1',
  useFrom: 'from',
  useTo: 'to',
};

export const toStandardApplicantSortKey = (uiSortKey: string): string =>
  STANDARD_APPLICANTS_SORT_MAP[uiSortKey] ?? uiSortKey;
