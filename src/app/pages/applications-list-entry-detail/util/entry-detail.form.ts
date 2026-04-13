import {
  NonNullableFormBuilder,
  ValidatorFn,
  Validators,
} from '@angular/forms';

import { PERSON_TITLE_OPTIONS } from './entry-detail.constants';

import { toOptionalTrimmed } from '@components/applications-list-entry-create/util';
import { buildEntryCreateDto } from '@components/applications-list-entry-create/util/entry-create-mapper';
import { ApplicationNotesForm } from '@components/notes-section/notes-section.component';
import {
  ADDRESS_REGEX,
  ALPHANUMERIC_REGEX,
  APPLICATION_CODE_REGEX,
  NAME_REGEX,
  STANDARD_APPLICANT_CODE_REGEX,
} from '@constants/regex';
import {
  Applicant,
  ContactDetails,
  EntryGetDetailDto,
  EntryUpdateDto,
  FeeStatus,
  FullName,
  Official,
  OfficialType,
  Organisation,
  Person,
  Respondent,
  TemplateSubstitution,
} from '@openapi';
import {
  ApplicantType,
  ApplicationsListEntryForm,
  ApplicationsListEntryFormValue,
  OrganisationForm,
  OrganisationFormValue,
  PersonForm,
  PersonFormValue,
  PersonOrgSharedControls,
  RespondentEntryType,
} from '@shared-types/applications-list-entry-create/application-list-entry-form';
import {
  mapOptionValueToTitle,
  mapTitleToOptionValue,
  trimToString,
  trimToUndefined,
} from '@util/string-helpers';
import {
  getEntryWordingFields,
  toTemplateSubstitutions,
} from '@util/template-substitution-utils';
import {
  ContactFormRaw,
  OrganisationFormRaw,
  PersonFormRaw,
} from '@util/types/applications-list-entry/types';
import { crossFormValidation } from '@validators/cross-form.validator';
import { optional } from '@validators/optional.validator';
import { standardApplicantCodeConditionalRequired } from '@validators/standard-applicant-code.validator';
import { ukMobile, ukPhone, ukPostcode } from '@validators/uk-format.validator';

type MagSlot = {
  titleKey: keyof ApplicationsListEntryFormValue;
  firstKey: keyof ApplicationsListEntryFormValue;
  surKey: keyof ApplicationsListEntryFormValue;
};

const hasText = (v: unknown): v is string =>
  typeof v === 'string' && v.trim().length > 0;

const MAG_SLOTS: readonly MagSlot[] = [
  {
    titleKey: 'mags1Title',
    firstKey: 'mags1FirstName',
    surKey: 'mags1Surname',
  },
  {
    titleKey: 'mags2Title',
    firstKey: 'mags2FirstName',
    surKey: 'mags2Surname',
  },
  {
    titleKey: 'mags3Title',
    firstKey: 'mags3FirstName',
    surKey: 'mags3Surname',
  },
] as const;

//Assuming 60 max char length for names/addresses
const MAX_60 = Validators.maxLength(60);
const REQUIRED: ValidatorFn = (c) => Validators.required(c);
const EMAIL: ValidatorFn = (c) => Validators.email(c);

// Bulk respondent
const MAX_4 = Validators.maxLength(4);
const MIN_RESPONDENT_INTEGER = Validators.min(1);
const MAX_RESPONDENT_INTEGER = Validators.max(9999);
const WHOLE_NUMBER: ValidatorFn = optional((c) =>
  Validators.pattern(/^\d+$/)(c),
);

export function buildStandardApplicationForm(
  fb: NonNullableFormBuilder,
): ApplicationsListEntryForm {
  // Surname is required if first name is filled
  const officialNamePairValidators = [
    crossFormValidation('mags1FirstName', 'mags1Surname'),
    crossFormValidation('mags2FirstName', 'mags2Surname'),
    crossFormValidation('mags3FirstName', 'mags3Surname'),
    crossFormValidation('officialFirstName', 'officialSurname'),
  ];

  return fb.group(
    {
      applicationTitle: fb.control<string | null>(null),
      applicantType: fb.control<ApplicantType>('person'),
      applicant: fb.control<Applicant | null>(null),
      standardApplicantCode: fb.control<string | null>(null, [
        Validators.pattern(STANDARD_APPLICANT_CODE_REGEX),
        standardApplicantCodeConditionalRequired,
      ]),
      applicationCode: fb.control<string | null>(null, {
        validators: [REQUIRED, Validators.pattern(APPLICATION_CODE_REGEX)],
      }),
      respondentEntryType: fb.control<RespondentEntryType | null>('person'),
      respondent: fb.control<Respondent | null>(null),
      numberOfRespondents: fb.control<number | null>(null, {
        validators: [
          MAX_4,
          WHOLE_NUMBER,
          MIN_RESPONDENT_INTEGER,
          MAX_RESPONDENT_INTEGER,
        ],
      }),
      wordingFields: fb.control<TemplateSubstitution[] | null>(null),
      feeStatuses: fb.control<FeeStatus[] | null>(null),
      hasOffsiteFee: fb.control<boolean | null>(null),
      feeStatus: fb.control<string | null>(null, {
        validators: [],
      }),
      feeStatusDate: fb.control<string | null>(null, {
        validators: [],
      }),
      paymentRef: fb.control<string | null>(null, {
        validators: [],
      }),
      applicationNotes: fb.group({
        notes: fb.control<string | null>(null, {
          validators: [Validators.maxLength(4000)],
        }),
        caseReference: fb.control<string | null>(null, {
          validators: [
            Validators.maxLength(15),
            Validators.pattern(ALPHANUMERIC_REGEX),
          ],
        }),
        accountReference: fb.control<string | null>(null, {
          validators: [
            Validators.maxLength(20),
            Validators.pattern(ALPHANUMERIC_REGEX),
          ],
        }),
      }) as ApplicationNotesForm,

      lodgementDate: fb.control<string | null>(null, {
        validators: [REQUIRED],
      }),
      courtName: fb.control<string | null>(null),
      organisationName: fb.control<string | null>(null),
      accountReference: fb.control<string | null>(null),
      applicationDetails: fb.control<string | null>(null),
      resultCode: fb.control<string | null>(null),

      mags1Title: fb.control<string | null>('mr'),
      mags1FirstName: fb.control<string | null>(null, {
        validators: [MAX_60, Validators.pattern(NAME_REGEX)],
      }),
      mags1Surname: fb.control<string | null>(null, {
        validators: [MAX_60, Validators.pattern(NAME_REGEX)],
      }),
      mags2Title: fb.control<string | null>('mr'),
      mags2FirstName: fb.control<string | null>(null, {
        validators: [MAX_60, Validators.pattern(NAME_REGEX)],
      }),
      mags2Surname: fb.control<string | null>(null, {
        validators: [MAX_60, Validators.pattern(NAME_REGEX)],
      }),
      mags3Title: fb.control<string | null>('mr'),
      mags3FirstName: fb.control<string | null>(null, {
        validators: [MAX_60, Validators.pattern(NAME_REGEX)],
      }),
      mags3Surname: fb.control<string | null>(null, {
        validators: [MAX_60, Validators.pattern(NAME_REGEX)],
      }),
      officialTitle: fb.control<string | null>('mr'),
      officialFirstName: fb.control<string | null>(null, {
        validators: [MAX_60, Validators.pattern(NAME_REGEX)],
      }),
      officialSurname: fb.control<string | null>(null, {
        validators: [MAX_60, Validators.pattern(NAME_REGEX)],
      }),
    },
    { validators: officialNamePairValidators },
  ) as ApplicationsListEntryForm;
}

export function buildPersonOrgSharedControls(
  fb: NonNullableFormBuilder,
): PersonOrgSharedControls {
  return {
    addressLine1: fb.control<string>('', {
      validators: [REQUIRED, MAX_60, Validators.pattern(ADDRESS_REGEX)],
    }),
    addressLine2: fb.control<string>('', {
      validators: [MAX_60, Validators.pattern(ADDRESS_REGEX)],
    }),
    addressLine3: fb.control<string>('', {
      validators: [MAX_60, Validators.pattern(ADDRESS_REGEX)],
    }),
    addressLine4: fb.control<string>('', {
      validators: [MAX_60, Validators.pattern(ADDRESS_REGEX)],
    }),
    addressLine5: fb.control<string>('', {
      validators: [MAX_60, Validators.pattern(ADDRESS_REGEX)],
    }),
    postcode: fb.control<string | null>(null, {
      validators: [optional(ukPostcode), MAX_60],
    }),
    phoneNumber: fb.control<string | null>(null, {
      validators: [optional(ukPhone), MAX_60],
    }),
    mobileNumber: fb.control<string | null>(null, {
      validators: [optional(ukMobile), MAX_60],
    }),
    emailAddress: fb.control<string | null>(null, {
      validators: [EMAIL, MAX_60],
    }),
  };
}

export function buildPersonForm(fb: NonNullableFormBuilder): PersonForm {
  return fb.group({
    title: fb.control<string | null>(null),
    firstName: fb.control<string>('', {
      validators: [REQUIRED, MAX_60, Validators.pattern(NAME_REGEX)],
    }),
    middleNames: fb.control<string>('', {
      validators: [MAX_60, Validators.pattern(NAME_REGEX)],
    }),
    surname: fb.control<string | null>(null, {
      validators: [REQUIRED, MAX_60, Validators.pattern(NAME_REGEX)],
    }),
    ...buildPersonOrgSharedControls(fb),
  }) as PersonForm;
}

export function buildOrganisationForm(
  fb: NonNullableFormBuilder,
): OrganisationForm {
  return fb.group({
    name: fb.control<string>('', {
      validators: [REQUIRED, MAX_60, Validators.pattern(NAME_REGEX)],
    }),
    ...buildPersonOrgSharedControls(fb),
  }) as OrganisationForm;
}

// Preserve stable fallback keys for wording values that may arrive without keys.
const LEGACY_WORDING_KEYS = ['courtName', 'organisationName'] as const;

export function buildEntryUpdateDtoFromForm(
  detail: EntryGetDetailDto,
  formValue: ApplicationsListEntryFormValue,
  applicantPersonValue: PersonFormValue,
  applicantOrgValue: OrganisationFormValue,
  respondentPersonValue: PersonFormValue,
  respondentOrgValue: OrganisationFormValue,
): EntryUpdateDto {
  // Full snapshot of current server state
  const base: EntryUpdateDto = {
    standardApplicantCode: detail.standardApplicantCode,
    applicationCode: detail.applicationCode,
    applicant: detail.applicant,
    respondent: detail.respondent,
    numberOfRespondents: detail.numberOfRespondents,
    wordingFields: toTemplateSubstitutions(
      getEntryWordingFields(detail),
      LEGACY_WORDING_KEYS,
    ),
    feeStatuses: detail.feeStatuses,
    hasOffsiteFee: detail.hasOffsiteFee,
    caseReference: detail.caseReference,
    accountNumber: detail.accountNumber,
    notes: detail.notes,
  };

  // Reuse existing mapper to build a “patch”
  const patch: Partial<EntryUpdateDto> = {
    ...buildEntryCreateDto(
      formValue,
      applicantPersonValue,
      applicantOrgValue,
      respondentPersonValue,
      respondentOrgValue,
    ),
    ...buildOfficialsFromFormValue(formValue),
  };

  const dto: EntryUpdateDto = {
    ...base,
    ...patch,
  };

  if (formValue.applicantType === 'standard') {
    dto.standardApplicantCode = (formValue.standardApplicantCode ?? '').trim();
    normalizeApplicantSelection(dto, 'standard');
    return dto;
  }

  normalizeApplicantSelection(dto, 'applicant');
  return dto;
}

export function buildContactDetailsFromRaw(v: ContactFormRaw): ContactDetails {
  return {
    addressLine1: trimToString(v.addressLine1),
    addressLine2: trimToUndefined(v.addressLine2),
    addressLine3: trimToUndefined(v.addressLine3),
    addressLine4: trimToUndefined(v.addressLine4),
    addressLine5: trimToUndefined(v.addressLine5),
    postcode: trimToUndefined(v.postcode),
    phone: trimToUndefined(v.phoneNumber),
    mobile: trimToUndefined(v.mobileNumber),
    email: trimToUndefined(v.emailAddress),
  };
}

export function contactDetailsToFormPatch(cd: ContactDetails): ContactFormRaw {
  return {
    addressLine1: cd.addressLine1 ?? '',
    addressLine2: cd.addressLine2 ?? '',
    addressLine3: cd.addressLine3 ?? '',
    addressLine4: cd.addressLine4 ?? '',
    addressLine5: cd.addressLine5 ?? '',
    postcode: cd.postcode ?? '',
    phoneNumber: cd.phone ?? '',
    mobileNumber: cd.mobile ?? '',
    emailAddress: cd.email ?? '',
  };
}

export function buildPersonApplicantFromRaw(raw: PersonFormRaw): Applicant {
  const name: FullName = {
    title: mapOptionValueToTitle(raw.title, PERSON_TITLE_OPTIONS),
    firstForename: trimToString(raw.firstName),
    secondForename: trimToUndefined(raw.middleNames),
    surname: trimToString(raw.surname),
  };

  const person: Person = {
    name,
    contactDetails: buildContactDetailsFromRaw(raw),
  };

  return { person };
}

export function buildOrganisationApplicantFromRaw(
  raw: OrganisationFormRaw,
): Applicant {
  const organisation: Organisation = {
    name: trimToString(raw.name),
    contactDetails: buildContactDetailsFromRaw(raw),
  };

  return { organisation };
}

export function personToFormPatch(
  person: Person | null | undefined,
): Record<string, unknown> {
  if (!person) {
    return {};
  }

  const name = person.name;
  const contactDetails = person.contactDetails;

  const middleNamesParts: string[] = [];

  if (name?.secondForename) {
    middleNamesParts.push(name.secondForename);
  }

  if (name?.thirdForename) {
    middleNamesParts.push(name.thirdForename);
  }

  const middleNames = middleNamesParts.join(' ');

  return {
    title: mapTitleToOptionValue(name?.title, PERSON_TITLE_OPTIONS),
    firstName: name?.firstForename ?? '',
    middleNames,
    surname: name?.surname ?? '',
    ...contactDetailsToFormPatch(contactDetails),
  };
}

export function organisationToFormPatch(
  organisation: Organisation | null | undefined,
): Record<string, unknown> {
  if (!organisation) {
    return {};
  }

  const contactDetails = organisation.contactDetails;

  return {
    name: organisation.name ?? '',
    ...contactDetailsToFormPatch(contactDetails),
  };
}

export function officialsToFormPatch(
  officials: Official[] | null | undefined,
): Partial<ApplicationsListEntryFormValue> {
  if (!officials?.length) {
    return {};
  }

  const magistrates = officials.filter(
    (o) => o.type === OfficialType.MAGISTRATE,
  );
  const clerk = officials.find((o) => o.type === OfficialType.CLERK);

  const patch: Partial<ApplicationsListEntryFormValue> = {};

  const magSlots = [
    { title: 'mags1Title', first: 'mags1FirstName', sur: 'mags1Surname' },
    { title: 'mags2Title', first: 'mags2FirstName', sur: 'mags2Surname' },
    { title: 'mags3Title', first: 'mags3FirstName', sur: 'mags3Surname' },
  ] as const;

  magistrates.slice(0, magSlots.length).forEach((m, i) => {
    const slot = magSlots[i];

    patch[slot.title] = mapTitleToOptionValue(m.title, PERSON_TITLE_OPTIONS);
    patch[slot.first] = m.forename ?? null;
    patch[slot.sur] = m.surname ?? null;
  });

  if (clerk) {
    patch.officialTitle = mapTitleToOptionValue(
      clerk.title,
      PERSON_TITLE_OPTIONS,
    );
    patch.officialFirstName = clerk.forename ?? null;
    patch.officialSurname = clerk.surname ?? null;
  }

  return patch;
}

export function buildEntryUpdateDtoWithChange<K extends keyof EntryUpdateDto>(
  detail: EntryGetDetailDto | null | undefined,
  key: K,
  value: EntryUpdateDto[K],
): EntryUpdateDto {
  if (!detail) {
    throw new Error('entryDetail is not loaded');
  }

  const base: EntryUpdateDto = {
    // full copy of current server state
    standardApplicantCode: detail.standardApplicantCode,
    applicationCode: detail.applicationCode,
    applicant: detail.applicant,
    respondent: detail.respondent,
    numberOfRespondents: detail.numberOfRespondents,
    wordingFields: toTemplateSubstitutions(
      getEntryWordingFields(detail),
      LEGACY_WORDING_KEYS,
    ),
    feeStatuses: detail.feeStatuses,
    hasOffsiteFee: detail.hasOffsiteFee,
    caseReference: detail.caseReference,
    accountNumber: detail.accountNumber,
    notes: detail.notes,
    ...(detail as { officials?: Official[] }),
  };

  const dto: EntryUpdateDto = {
    ...base,
    [key]: value,
  };

  const hasStandardApplicantCode =
    typeof dto.standardApplicantCode === 'string' &&
    dto.standardApplicantCode.trim().length > 0;

  normalizeApplicantSelection(
    dto,
    hasStandardApplicantCode ? 'standard' : 'applicant',
  );

  return dto;
}

export function buildEntryUpdateDtoForFeeChange<K extends keyof EntryUpdateDto>(
  detail: EntryGetDetailDto | null | undefined,
  formValue: ApplicationsListEntryFormValue,
  key: K,
  value: EntryUpdateDto[K],
): EntryUpdateDto {
  const dto = buildEntryUpdateDtoWithChange(detail, key, value);

  const applicationCode = toOptionalTrimmed(formValue.applicationCode);
  if (applicationCode) {
    dto.applicationCode = applicationCode;
  }

  return dto;
}

function normalizeApplicantSelection(
  dto: EntryUpdateDto,
  mode: 'standard' | 'applicant',
): void {
  if (mode === 'standard') {
    delete dto.applicant;
    return;
  }

  delete dto.standardApplicantCode;
}

//  TODO: temp backend/mock shape whilst type is not finalised
type RespondentWithType = Respondent & {
  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
  type?: RespondentEntryType | string | null;
};

export function getRespondentEntryType(
  r: RespondentWithType | null | undefined,
): RespondentEntryType | null {
  if (!r) {
    return null;
  }

  const hasPerson = !!r.person;
  const hasOrg = !!r.organisation;

  const isExplicitPerson = r.type === 'person';
  const isExplicitOrg = r.type === 'organisation';

  // If explicit type is present, prefer it when it matches payload.
  // If it doesn't match, return the other if present, otherwise fall back to explicit.
  if (isExplicitPerson) {
    if (hasPerson) {
      return 'person';
    }
    if (hasOrg) {
      return 'organisation';
    }
    return 'person';
  }

  if (isExplicitOrg) {
    if (hasOrg) {
      return 'organisation';
    }
    if (hasPerson) {
      return 'person';
    }
    return 'organisation';
  }

  // No explicit type: infer from presence
  if (hasPerson) {
    return 'person';
  }
  if (hasOrg) {
    return 'organisation';
  }

  return null;
}

const isOfficialFilled = (forename?: unknown, surname?: unknown): boolean =>
  hasText(forename) || hasText(surname);

const buildMagistrateOfficials = (
  formValue: ApplicationsListEntryFormValue,
): Official[] =>
  MAG_SLOTS.flatMap(({ titleKey, firstKey, surKey }) => {
    const title = formValue[titleKey];
    const forename = formValue[firstKey];
    const surname = formValue[surKey];

    if (!isOfficialFilled(forename, surname)) {
      return [];
    }

    return [
      {
        type: OfficialType.MAGISTRATE,
        title: hasText(title) ? title.trim() : undefined,
        forename: hasText(forename) ? forename.trim() : undefined,
        surname: hasText(surname) ? surname.trim() : undefined,
      },
    ];
  });

const buildClerkOfficials = (
  formValue: ApplicationsListEntryFormValue,
): Official[] => {
  const title = formValue.officialTitle;
  const forename = formValue.officialFirstName;
  const surname = formValue.officialSurname;

  if (!isOfficialFilled(forename, surname)) {
    return [];
  }

  return [
    {
      type: OfficialType.CLERK,
      title: hasText(title) ? title.trim() : undefined,
      forename: hasText(forename) ? forename.trim() : undefined,
      surname: hasText(surname) ? surname.trim() : undefined,
    },
  ];
};

export function buildOfficialsFromFormValue(
  formValue: ApplicationsListEntryFormValue,
): Partial<Pick<EntryUpdateDto, 'officials'>> {
  const officials = [
    ...buildMagistrateOfficials(formValue),
    ...buildClerkOfficials(formValue),
  ];

  return officials.length ? { officials } : {};
}
