// Synthetic data only; keep fixtures independent of live services and local configuration.
export const listId = '00000000-0000-4000-8000-000000000001';
export const entryId = '00000000-0000-4000-8000-000000000002';
export const list = {
  id: listId,
  date: '2026-01-01',
  time: '10:00',
  description: 'Accessibility test list',
  status: 'OPEN',
  courtCode: 'TEST',
  courtName: 'Test court',
  cjaCode: '01',
  version: 1,
  entriesCount: 1,
};
export const entry = {
  applicationCodeId: 100,
  id: entryId,
  listId,
  applicationCode: 'TEST',
  numberOfRespondents: 1,
  applicant: {
    organisation: {
      name: 'Synthetic applicant organisation',
      contactDetails: { addressLine1: 'Synthetic test address' },
    },
  },
  lodgementDate: '2026-01-01',
  feeStatuses: [],
  officials: [],
};
const code = {
  applicationCode: 'TEST',
  title: 'Test application',
  wording: { template: 'Test wording' },
  isFeeDue: false,
  requiresRespondent: false,
  bulkRespondentAllowed: false,
  startDate: '2020-01-01',
};
function paged(content: unknown[]) {
  return {
    content,
    pageNumber: 0,
    pageSize: 100,
    totalElements: content.length,
    totalPages: 1,
    first: true,
    last: true,
    elementsOnPage: content.length,
    sort: { orders: [] },
  };
}
export const fixtures: Record<string, unknown> = {
  '/app/config': {},
  '/sso/me': {},
  '/court-locations': paged([{ locationCode: 'TEST', name: 'Test court' }]),
  '/court-locations/TEST': { locationCode: 'TEST', name: 'Test court' },
  '/criminal-justice-areas': paged([{ code: '01', description: 'Test area' }]),
  '/criminal-justice-areas/01': { code: '01', description: 'Test area' },
  '/standard-applicants': paged([]),
  '/application-codes': paged([code]),
  '/application-codes/TEST': code,
  '/application-codes/by-id/100': code,
  '/result-codes': paged([]),
  '/application-lists': paged([list]),
  [`/application-lists/${listId}`]: list,
  [`/application-lists/${listId}/entries`]: paged([
    { ...entry, sequenceNumber: 1, applicationTitle: 'Test application' },
  ]),
  [`/application-lists/${listId}/entries/${entryId}`]: entry,
  [`/application-lists/${listId}/entries/${entryId}/results`]: [],
  '/reports/jobs': [
    {
      id: '00000000-0000-4000-8000-000000000003',
      type: 'FEES_REPORT',
      completedAt: '2026-01-01T12:00:00Z',
    },
  ],
};
