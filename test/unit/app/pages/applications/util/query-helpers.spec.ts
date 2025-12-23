import {
  hasAnyApplicationsEntrySearchParams,
  loadApplicationsEntrySearchQuery,
} from '../../../../../../src/app/pages/applications/util/query-helper';

import type { ApplicationsSearchFormValue } from '@shared-types/applications/applications-form';
import { toStatus } from '@util/application-status-helpers';
import { has } from '@util/has';

jest.mock('@util/has', () => ({
  has: jest.fn((v: unknown) => {
    if (typeof v === 'string') {
      return v.trim().length > 0;
    }
    return Boolean(v);
  }),
}));

jest.mock('@util/application-status-helpers', () => ({
  toStatus: jest.fn((s: string) => `STATUS:${s}`),
}));

const emptyForm = (): ApplicationsSearchFormValue => ({
  date: null,
  applicantOrg: '',
  respondentOrg: '',
  applicantSurname: '',
  respondentSurname: '',
  location: '',
  standardApplicantCode: '',
  respondentPostcode: '',
  accountReference: '',
  court: '',
  cja: '',
  status: null,
});

describe('query-helper', () => {
  const hasMock = has as jest.MockedFunction<typeof has>;
  const toStatusMock = toStatus as jest.MockedFunction<typeof toStatus>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('hasAnyApplicationsEntrySearchParams', () => {
    it('returns false when all values are empty', () => {
      const v = emptyForm();

      const res = hasAnyApplicationsEntrySearchParams(v);

      expect(res).toBe(false);
      expect(hasMock).toHaveBeenCalled(); // don’t assert exact count due to short-circuiting
    });

    it('returns true when any value is present', () => {
      const v = emptyForm();
      v.respondentSurname = 'Smith';

      const res = hasAnyApplicationsEntrySearchParams(v);

      expect(res).toBe(true);
    });

    it('treats whitespace-only strings as empty (via has)', () => {
      const v = emptyForm();
      v.applicantOrg = '   ';

      const res = hasAnyApplicationsEntrySearchParams(v);

      expect(res).toBe(false);
    });
  });

  describe('loadApplicationsEntrySearchQuery', () => {
    it('maps and trims form values into EntryGetFilterDto', () => {
      const v = emptyForm();
      v.date = ' 2025-01-02 ';
      v.court = '  COURT01 ';
      v.location = '  Temporary Courtroom ';
      v.cja = ' 01 ';
      v.applicantOrg = '  Org Ltd ';
      v.applicantSurname = '  Smith ';
      v.respondentOrg = '  Resp Org ';
      v.respondentSurname = '  Jones ';
      v.respondentPostcode = '  AB1 2CD ';
      v.standardApplicantCode = '  STD123 ';
      v.accountReference = '  ACC-999 ';
      v.status = 'OPEN';

      const filter = loadApplicationsEntrySearchQuery(v);

      expect(filter).toEqual({
        date: '2025-01-02',
        courtCode: 'COURT01',
        otherLocationDescription: 'Temporary Courtroom',
        cjaCode: '01',
        applicantOrganisation: 'Org Ltd',
        applicantSurname: 'Smith',
        respondentOrganisation: 'Resp Org',
        respondentSurname: 'Jones',
        respondentPostcode: 'AB1 2CD',
        standardApplicantCode: 'STD123',
        accountReference: 'ACC-999',
        status: 'STATUS:OPEN',
      });

      expect(toStatusMock).toHaveBeenCalledTimes(1);
      expect(toStatusMock).toHaveBeenCalledWith('OPEN');
    });

    it('omits keys for empty/whitespace-only values', () => {
      const v = emptyForm();
      v.date = '   ';
      v.court = '\n\t ';
      v.location = '';
      v.status = null;

      const filter = loadApplicationsEntrySearchQuery(v);

      expect(filter).toEqual({});
      expect(toStatusMock).not.toHaveBeenCalled();
    });

    it('does not set status when status is an empty string', () => {
      const v = emptyForm();
      v.status = '';

      const filter = loadApplicationsEntrySearchQuery(v);

      expect(filter).toEqual({});
      expect(toStatusMock).not.toHaveBeenCalled();
    });
  });
});
