import { mapSaToRow } from '@components/standard-applicant-select/util/standard-applicant-select-row-helpers';
import { StandardApplicantGetSummaryDto } from '@openapi';
import { formatDate } from '@util/standard-applicant-helpers';

const buildStandardApplicantRows = (input: StandardApplicantGetSummaryDto[]) =>
  input.map((item) => mapSaToRow(item));

describe('formatDate', () => {
  it('returns formatted date in mediumDate en-GB format for a valid ISO date', () => {
    const result = formatDate('2025-12-01');
    expect(result).toBe('1 Dec 2025');
  });

  it('returns an em dash for undefined', () => {
    const result = formatDate();
    expect(result).toBe('—');
  });

  it('returns an em dash for null', () => {
    const result = formatDate(null);
    expect(result).toBe('—');
  });

  it('passes through invalid dates (still not returning the em dash)', () => {
    const result = formatDate('not-a-date');
    expect(result).toBe('—');
  });
});

describe('buildStandardApplicantRows', () => {
  it('builds a row for a person applicant with full name and address', () => {
    const input = [
      {
        code: 'SA-001',
        startDate: '2025-12-01',
        endDate: '2025-12-31',
        applicant: {
          person: {
            name: {
              title: 'Mr',
              firstForename: 'John',
              secondForename: '',
              thirdForename: 'Q',
              surname: 'Public',
            },
            contactDetails: {
              addressLine1: '1 Test Street',
            },
          },
        },
      },
    ];

    const rows = buildStandardApplicantRows(input);

    expect(rows).toHaveLength(1);
    expect(rows[0]).toEqual({
      code: 'SA-001',
      name: 'John Public',
      address: '1 Test Street',
      useFrom: '1 Dec 2025',
      useTo: '31 Dec 2025',
    });
  });

  it('builds a row for an organisation applicant when no person is present', () => {
    const input = [
      {
        code: 'SA-ORG',
        startDate: '2025-01-10',
        endDate: '2025-02-20',
        applicant: {
          organisation: {
            name: 'Test Org Ltd',
            contactDetails: {
              addressLine1: 'Org House',
            },
          },
        },
      },
    ];

    const rows = buildStandardApplicantRows(input);

    expect(rows).toHaveLength(1);
    expect(rows[0]).toEqual({
      code: 'SA-ORG',
      name: 'Test Org Ltd',
      address: 'Org House',
      useFrom: '10 Jan 2025',
      useTo: '20 Feb 2025',
    });
  });

  it('prefers organisation name and organisation address when both exist', () => {
    const input = [
      {
        code: 'SA-BOTH',
        startDate: '2025-03-01',
        endDate: '2025-03-15',
        applicant: {
          person: {
            name: {
              title: 'Ms',
              firstForename: 'Alice',
              secondForename: 'B',
              thirdForename: '',
              surname: 'Smith',
            },
            contactDetails: {
              addressLine1: 'Person Address 1',
            },
          },
          organisation: {
            name: 'Org Name Preferred',
            contactDetails: {
              addressLine1: 'Org Address 1',
            },
          },
        },
      },
    ];

    const rows = buildStandardApplicantRows(input);

    expect(rows).toHaveLength(1);
    expect(rows[0]).toEqual({
      code: 'SA-BOTH',
      name: 'Org Name Preferred',
      address: 'Org Address 1',
      useFrom: '1 Mar 2025',
      useTo: '15 Mar 2025',
    });
  });

  it('falls back to organisation address when person address is not present', () => {
    const input = [
      {
        code: 'SA-ADDR',
        startDate: '2025-04-01',
        endDate: '2025-04-30',
        applicant: {
          person: {
            name: {
              title: 'Mr',
              firstForename: 'NoAddress',
              secondForename: '',
              thirdForename: '',
              surname: 'Person',
            },
            contactDetails: {
              addressLine1: undefined, // Invalid
            },
          },
          organisation: {
            name: 'Org With Address',
            contactDetails: {
              addressLine1: 'Fallback Address',
            },
          },
        },
      },
    ];

    const rows = buildStandardApplicantRows(
      input as unknown as Parameters<typeof buildStandardApplicantRows>[0],
    );

    expect(rows).toHaveLength(1);
    expect(rows[0].address).toBe('Fallback Address');
  });

  it('handles missing applicant, code, and dates gracefully', () => {
    const input = [
      {
        code: undefined,
        startDate: undefined,
        endDate: undefined,
        applicant: undefined,
      },
    ];

    const rows = buildStandardApplicantRows(
      input as unknown as Parameters<typeof buildStandardApplicantRows>[0],
    );

    expect(rows).toHaveLength(1);
    expect(rows[0]).toEqual({
      code: '',
      name: '',
      address: '',
      useFrom: '—',
      useTo: '—',
    });
  });

  it('treats explicit null endDate the same as undefined (useTo is em dash)', () => {
    const input = [
      {
        code: 'SA-NULL-END',
        startDate: '2025-05-01',
        endDate: null,
        applicant: {
          organisation: {
            name: 'Org Name',
            contactDetails: {
              addressLine1: 'Somewhere',
            },
          },
        },
      },
    ];

    const rows = buildStandardApplicantRows(input);

    expect(rows).toHaveLength(1);
    expect(rows[0].useFrom).toBe('1 May 2025');
    expect(rows[0].useTo).toBe('—');
  });
});
