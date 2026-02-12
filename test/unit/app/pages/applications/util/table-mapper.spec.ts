import { mapToRow } from '@components/applications/util/table-mapper';
import {
  Applicant,
  ApplicationListStatus,
  ContactDetails,
  EntryGetSummaryDto,
  Organisation,
  Person,
} from '@openapi';

const contactDetailsStub: ContactDetails = {
  addressLine1: '',
} as ContactDetails;

function makePerson(
  overrides?: {
    name?: Partial<Person['name']>;
    contactDetails?: Partial<ContactDetails>;
  } & Partial<Omit<Person, 'name' | 'contactDetails'>>,
): Person {
  const { name, contactDetails, ...rest } = overrides ?? {};

  return {
    ...rest,
    name: {
      title: 'Ms',
      firstForename: 'Jane',
      surname: 'Doe',
      ...name,
    },
    contactDetails: {
      ...contactDetailsStub,
      ...contactDetails,
    },
  } as Person;
}

function makeOrg(
  overrides?: {
    contactDetails?: Partial<ContactDetails>;
  } & Partial<Omit<Organisation, 'contactDetails'>>,
): Organisation {
  const { contactDetails, ...rest } = overrides ?? {};

  return {
    name: 'Acme Ltd',
    ...rest,
    contactDetails: {
      ...contactDetailsStub,
      ...contactDetails,
    },
  } as Organisation;
}

function makeApplicant(overrides?: Partial<Applicant>): Applicant {
  return {
    person: undefined,
    organisation: undefined,
    ...overrides,
  } as Applicant;
}

function makeDto(overrides?: Partial<EntryGetSummaryDto>): EntryGetSummaryDto {
  return {
    id: 'id-123',
    applicationTitle: 'Some title',
    isFeeRequired: true,
    isResulted: false,
    status: 'OPEN' as ApplicationListStatus,
    ...overrides,
  } as EntryGetSummaryDto;
}

describe('mapToRow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('maps core fields and preserves date when present', () => {
    const dto = makeDto({
      date: '2025-04-24',
      applicant: makeApplicant({
        person: makePerson(),
      }),
      respondent: makeApplicant({
        person: makePerson({
          name: { firstForename: 'Bob', surname: 'Smith' },
        }),
      }),
      applicationTitle: 'Request for something',
      isFeeRequired: true,
      isResulted: false,
      status: 'OPEN' as ApplicationListStatus,
    });

    const row = mapToRow(dto);

    expect(row).toEqual({
      id: 'id-123',
      date: '2025-04-24',
      dateDisplay: '2025-04-24',
      applicant: 'Ms Jane Doe',
      respondent: 'Ms Bob Smith',
      title: 'Request for something',
      fee: 'Yes',
      resulted: 'No',
      status: 'OPEN',
      actions: 'id-123',
    });
  });

  it('returns empty date when dto.date is missing', () => {
    const dto = makeDto({
      date: undefined,
      applicant: makeApplicant({ person: makePerson() }),
      respondent: makeApplicant({ person: makePerson() }),
    });

    const row = mapToRow(dto);

    expect(row.date).toBe('');
    expect(row.dateDisplay).toBe('');
  });

  it('prefers organisation name over person name', () => {
    const dto = makeDto({
      applicant: makeApplicant({
        organisation: makeOrg({ name: 'Widgets Inc' }),
        person: makePerson({
          name: { title: 'Dr', firstForename: 'Alice', surname: 'Jones' },
        }),
      }),
      respondent: makeApplicant({
        organisation: makeOrg({ name: 'Respondent Org' }),
      }),
    });

    const row = mapToRow(dto);

    expect(row.applicant).toBe('Widgets Inc');
    expect(row.respondent).toBe('Respondent Org');
  });

  it('returns empty applicant/respondent when missing or empty container', () => {
    const dto = makeDto({
      applicant: undefined,
      respondent: makeApplicant({ person: undefined, organisation: undefined }),
    });

    const row = mapToRow(dto);

    expect(row.applicant).toBe('');
    expect(row.respondent).toBe('');
  });

  it('handles missing title gracefully (no extra spaces)', () => {
    const dto = makeDto({
      applicant: makeApplicant({
        person: makePerson({
          name: {
            title: undefined,
            firstForename: 'Henry',
            surname: 'Rodriguez',
          },
        }),
      }),
      respondent: makeApplicant({
        person: makePerson({
          name: { title: ' ', firstForename: 'Olivia', surname: 'Harris' },
        }),
      }),
    });

    const row = mapToRow(dto);

    expect(row.applicant).toBe('Henry Rodriguez');
    expect(row.respondent).toBe('Olivia Harris');
  });

  it('maps fee/resulted booleans to Yes/No', () => {
    const dto = makeDto({
      isFeeRequired: false,
      isResulted: true,
    });

    const row = mapToRow(dto);

    expect(row.fee).toBe('No');
    expect(row.resulted).toBe('Yes');
  });
});
