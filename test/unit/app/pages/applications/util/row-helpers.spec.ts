import { mapEntrySummaryDtoToApplicationRow } from '../../../../../../src/app/pages/applications/util/row-helpers';

import type { EntryGetSummaryDto } from '@openapi';
import { asIsoDate } from '@util/date-helpers';
import { trimToString } from '@util/string-helpers';

jest.mock('@util/date-helpers', () => ({
  asIsoDate: jest.fn((v: unknown) => {
    if (typeof v !== 'string') {
      return '';
    }
    const s = v.trim();
    if (!s) {
      return '';
    }
    return /^\d{4}-\d{2}-\d{2}/.test(s) ? s : '';
  }),
}));

jest.mock('@util/string-helpers', () => ({
  trimToString: jest.fn((v: unknown) => {
    if (typeof v === 'string') {
      return v.trim();
    }
    if (typeof v === 'number') {
      return String(v);
    }
    return '';
  }),
}));

describe('row-helpers: mapEntrySummaryDtoToApplicationRow', () => {
  const asIsoDateMock = asIsoDate as jest.MockedFunction<typeof asIsoDate>;
  const trimToStringMock = trimToString as jest.MockedFunction<
    typeof trimToString
  >;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('maps id/title/status and uses date when present (does not call lodgementDate)', () => {
    const dtoObj: Record<string, unknown> = {
      id: ' 123 ',
      date: ' 2025-01-02 ',
      lodgementDate: '2025-01-03',
      applicationTitle: '  My Title ',
      status: ' OPEN ',
      applicant: null,
      respondent: null,
      isFeeRequired: false,
      isResulted: true,
    };

    const row = mapEntrySummaryDtoToApplicationRow(
      dtoObj as unknown as EntryGetSummaryDto,
    );

    expect(row).toEqual({
      id: '123',
      date: '2025-01-02',
      applicant: '',
      respondent: '',
      title: 'My Title',
      fee: 'No',
      resulted: 'Yes',
      status: 'OPEN',
      actions: '',
    });

    // date short-circuits, lodgementDate should not be evaluated
    expect(asIsoDateMock).toHaveBeenCalledTimes(1);
    expect(asIsoDateMock).toHaveBeenCalledWith(' 2025-01-02 ');

    expect(trimToStringMock).toHaveBeenCalledWith(' 123 ');
    expect(trimToStringMock).toHaveBeenCalledWith('  My Title ');
    expect(trimToStringMock).toHaveBeenCalledWith(' OPEN ');
  });

  it('falls back to lodgementDate when date is empty/invalid', () => {
    const dtoObj: Record<string, unknown> = {
      id: 'x',
      date: '   ',
      lodgementDate: '2025-02-01',
      title: 'Fallback title',
      status: 'CLOSED',
      applicant: null,
      respondent: null,
      isFeeRequired: true,
      isResulted: false,
    };

    const row = mapEntrySummaryDtoToApplicationRow(
      dtoObj as unknown as EntryGetSummaryDto,
    );

    expect(row.date).toBe('2025-02-01');

    expect(asIsoDateMock).toHaveBeenCalledTimes(2);
    expect(asIsoDateMock).toHaveBeenNthCalledWith(1, '   ');
    expect(asIsoDateMock).toHaveBeenNthCalledWith(2, '2025-02-01');
  });

  it('formats applicant/respondent using direct computed name when provided', () => {
    const dtoObj: Record<string, unknown> = {
      id: 'id-1',
      date: '2025-03-01',
      applicant: { applicantName: 'Applicant Co' },
      respondent: { respondentName: 'John Smith' },
      applicationTitle: 'T',
      status: 'OPEN',
      isFeeRequired: false,
      isResulted: false,
    };

    const row = mapEntrySummaryDtoToApplicationRow(
      dtoObj as unknown as EntryGetSummaryDto,
    );

    expect(row.applicant).toBe('Applicant Co');
    expect(row.respondent).toBe('John Smith');
  });

  it('formats party using organisation name when present', () => {
    const dtoObj: Record<string, unknown> = {
      id: 'id-2',
      date: '2025-03-02',
      applicant: { organisation: { name: 'Legal Aid Board' } },
      respondent: { organisation: { name: 'Crown Prosecution Service' } },
      title: 'T',
      status: 'OPEN',
      isFeeRequired: false,
      isResulted: false,
    };

    const row = mapEntrySummaryDtoToApplicationRow(
      dtoObj as unknown as EntryGetSummaryDto,
    );

    expect(row.applicant).toBe('Legal Aid Board');
    expect(row.respondent).toBe('Crown Prosecution Service');
  });

  it('formats party using person name (forename/firstForename + surname)', () => {
    const dtoObj: Record<string, unknown> = {
      id: 'id-3',
      date: '2025-03-03',
      applicant: {
        person: {
          name: {
            forename: '  Sarah ',
            surname: ' Johnson ',
          },
        },
      },
      respondent: {
        person: {
          name: {
            firstForename: ' William ',
            surname: ' Scott ',
          },
        },
      },
      title: 'T',
      status: 'OPEN',
      isFeeRequired: false,
      isResulted: false,
    };

    const row = mapEntrySummaryDtoToApplicationRow(
      dtoObj as unknown as EntryGetSummaryDto,
    );

    expect(row.applicant).toBe('Sarah Johnson');
    expect(row.respondent).toBe('William Scott');
  });

  it('prefers applicationTitle over title and trims both via trimToString', () => {
    const dtoObj: Record<string, unknown> = {
      id: 'id-4',
      date: '2025-03-04',
      applicationTitle: '  Preferred ',
      title: '  Secondary ',
      status: ' OPEN ',
      applicant: null,
      respondent: null,
      isFeeRequired: false,
      isResulted: false,
    };

    const row = mapEntrySummaryDtoToApplicationRow(
      dtoObj as unknown as EntryGetSummaryDto,
    );

    expect(row.title).toBe('Preferred');
  });

  it('returns blank fee/resulted when values are not boolean', () => {
    const dtoObj: Record<string, unknown> = {
      id: 'id-5',
      date: '2025-03-05',
      applicant: null,
      respondent: null,
      title: 'T',
      status: 'OPEN',
      // non-boolean values
      isFeeRequired: 'true',
      isResulted: 1,
    };

    const row = mapEntrySummaryDtoToApplicationRow(
      dtoObj as unknown as EntryGetSummaryDto,
    );

    expect(row.fee).toBe('');
    expect(row.resulted).toBe('');
  });
});
