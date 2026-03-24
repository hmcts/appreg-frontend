import { buildResultApplicantContext } from '@components/applications-list-entry-detail/util/result-context.util';
import { EntryGetDetailDto } from '@openapi';

function makeEntry(
  overrides: Partial<EntryGetDetailDto> = {},
): EntryGetDetailDto {
  return {
    id: 'entry-1',
    listId: 'list-1',
    applicationCode: 'AD99007',
    numberOfRespondents: 1,
    lodgementDate: '2026-03-10',
    ...overrides,
  };
}

describe('buildResultApplicantContext', () => {
  it('formats applicant person as surname, firstForename', () => {
    const entry = makeEntry({
      applicant: {
        person: {
          name: {
            title: 'Mr',
            surname: 'Blooer',
            firstForename: 'Simon',
            secondForename: null,
            thirdForename: null,
          },
          contactDetails: {
            addressLine1: '1 High Street',
          },
        },
      },
    });

    expect(buildResultApplicantContext(entry, 'Application title')).toEqual({
      applicant: 'Blooer, Simon',
      respondent: '',
      title: 'Application title',
    });
  });

  it('uses applicant organisation name when present', () => {
    const entry = makeEntry({
      applicant: {
        organisation: {
          name: 'Acme Ltd',
          contactDetails: {
            addressLine1: '1 High Street',
          },
        },
      },
    });

    expect(buildResultApplicantContext(entry, 'Application title')).toEqual({
      applicant: 'Acme Ltd',
      respondent: '',
      title: 'Application title',
    });
  });

  it('formats respondent person as surname, firstForename', () => {
    const entry = makeEntry({
      respondent: {
        person: {
          name: {
            surname: 'Smith',
            firstForename: 'John',
            secondForename: null,
            thirdForename: null,
          },
          contactDetails: {
            addressLine1: '2 High Street',
          },
        },
      },
    });

    expect(buildResultApplicantContext(entry, 'Application title')).toEqual({
      applicant: '',
      respondent: 'Smith, John',
      title: 'Application title',
    });
  });

  it('falls back to standard applicant code when applicant details are absent', () => {
    const entry = makeEntry({
      standardApplicantCode: 'APP001',
    });

    expect(buildResultApplicantContext(entry, 'Application title')).toEqual({
      applicant: 'APP001',
      respondent: '',
      title: 'Application title',
    });
  });

  it('prefers applicant details over standard applicant code when both are present', () => {
    const entry = makeEntry({
      standardApplicantCode: 'APP001',
      applicant: {
        person: {
          name: {
            title: 'Mr',
            surname: 'Smith',
            firstForename: 'John',
            secondForename: null,
            thirdForename: null,
          },
          contactDetails: {
            addressLine1: '123 High Street',
          },
        },
        organisation: undefined,
      },
    });

    expect(buildResultApplicantContext(entry, 'Application title')).toEqual({
      applicant: 'Smith, John',
      respondent: '',
      title: 'Application title',
    });
  });

  it('trims the title', () => {
    const entry = makeEntry();

    expect(buildResultApplicantContext(entry, '  Application title  ')).toEqual(
      {
        applicant: '',
        respondent: '',
        title: 'Application title',
      },
    );
  });
});
