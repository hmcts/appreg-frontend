import {
  NonNullableFormBuilder,
  ValidatorFn,
  Validators,
} from '@angular/forms';

import { PERSON_TITLE_OPTIONS } from './entry-detail.constants';

import { buildEntryCreateDto } from '@components/applications-list-entry-create/util/entry-create-mapper';
import { ApplicationNotesForm } from '@components/notes-section/notes-section.component';
import { ALPHANUMERIC_REGEX } from '@constants/regex';
import {
  Applicant,
  ContactDetails,
  EntryGetDetailDto,
  EntryUpdateDto,
  FeeStatus,
  FullName,
  Official,
  Organisation,
  Person,
  Respondent,
} from '@openapi';
import {
  ApplicantType,
  ApplicationsListEntryForm,
  ApplicationsListEntryFormValue,
  OrganisationForm,
  OrganisationFormValue,
  PersonForm,
  PersonFormValue,
  RespondentEntryType,
} from '@shared-types/applications-list-entry-create/application-list-entry-form';
import {
  mapOptionValueToTitle,
  mapTitleToOptionValue,
  trimToString,
  trimToUndefined,
} from '@util/string-helpers';
import {
  ContactFormRaw,
  OrganisationFormRaw,
  PersonFormRaw,
} from '@util/types/applications-list-entry/types';
import { optional } from '@validators/optional-validator';
import { standardApplicantCodeConditionalRequired } from '@validators/standard-applicant-code.validator';
import { ukMobile, ukPhone, ukPostcode } from '@validators/uk-format-validator';

//Assuming 60 max char length for names/addresses
const MAX_60 = Validators.maxLength(60);
const REQUIRED: ValidatorFn = (c) => Validators.required(c);
const EMAIL: ValidatorFn = (c) => Validators.email(c);

export function buildStandardApplicationForm(
  fb: NonNullableFormBuilder,
): ApplicationsListEntryForm {
  return fb.group({
    applicationTitle: fb.control<string | null>(null),
    applicantType: fb.control<ApplicantType>('org'),
    applicant: fb.control<Applicant | null>(null),
    standardApplicantCode: fb.control<string | null>(null, [
      standardApplicantCodeConditionalRequired,
    ]),
    applicationCode: fb.control<string | null>(null, []),
    respondentEntryType: fb.control<RespondentEntryType | null>('organisation'),
    respondent: fb.control<Respondent | null>(null),
    numberOfRespondents: fb.control<number | null>(null),
    wordingFields: fb.control<string[] | null>(null),
    feeStatuses: fb.control<FeeStatus[] | null>(null),
    hasOffsiteFee: fb.control<boolean | null>(null),

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

    lodgementDate: fb.control<string | null>(null),
    courtName: fb.control<string | null>(null),
    organisationName: fb.control<string | null>(null),
    feeStatus: fb.control<string | null>(null),
    feeStatusDate: fb.control<string | null>(null),
    paymentRef: fb.control<string | null>(null),
    accountReference: fb.control<string | null>(null),
    applicationDetails: fb.control<string | null>(null),
    resultCode: fb.control<string | null>(null),

    mags1Title: fb.control<string | null>(null),
    mags1FirstName: fb.control<string | null>(null),
    mags1Surname: fb.control<string | null>(null),
    mags2Title: fb.control<string | null>(null),
    mags2FirstName: fb.control<string | null>(null),
    mags2Surname: fb.control<string | null>(null),
    mags3Title: fb.control<string | null>(null),
    mags3FirstName: fb.control<string | null>(null),
    mags3Surname: fb.control<string | null>(null),
    officialTitle: fb.control<string | null>(null),
    officialFirstName: fb.control<string | null>(null),
    officialSurname: fb.control<string | null>(null),
  }) as ApplicationsListEntryForm;
}

export function buildPersonForm(fb: NonNullableFormBuilder): PersonForm {
  return fb.group({
    title: fb.control<string | null>(null),
    firstName: fb.control<string>('', {
      validators: [REQUIRED, MAX_60],
    }),
    middleNames: fb.control<string>('', { validators: [MAX_60] }),
    surname: fb.control<string | null>(null, {
      validators: [REQUIRED, MAX_60],
    }),
    addressLine1: fb.control<string>('', { validators: [REQUIRED, MAX_60] }),
    addressLine2: fb.control<string>('', { validators: [MAX_60] }),
    addressLine3: fb.control<string>('', { validators: [MAX_60] }),
    addressLine4: fb.control<string>('', { validators: [MAX_60] }),
    addressLine5: fb.control<string>('', { validators: [MAX_60] }),
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
  }) as PersonForm;
}

export function buildOrganisationForm(
  fb: NonNullableFormBuilder,
): OrganisationForm {
  return fb.group({
    name: fb.control<string>('', { validators: [REQUIRED, MAX_60] }),
    addressLine1: fb.control<string>('', { validators: [REQUIRED, MAX_60] }),
    addressLine2: fb.control<string>('', { validators: [MAX_60] }),
    addressLine3: fb.control<string>('', { validators: [MAX_60] }),
    addressLine4: fb.control<string>('', { validators: [MAX_60] }),
    addressLine5: fb.control<string>('', { validators: [MAX_60] }),
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
  }) as OrganisationForm;
}

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
    wordingFields: detail.wordingFields,
    feeStatuses: detail.feeStatuses,
    hasOffsiteFee: detail.hasOffsiteFee,
    caseReference: detail.caseReference,
    accountNumber: detail.accountNumber,
    notes: detail.notes,
    lodgementDate: detail.lodgementDate,
    ...(detail as { officials?: Official[] }),
  };

  // Reuse existing mapper to build a “patch”
  const patch = buildEntryCreateDto(
    formValue,
    applicantPersonValue,
    applicantOrgValue,
    respondentPersonValue,
    respondentOrgValue,
  ) as unknown as Partial<EntryUpdateDto>;

  // Merge server snapshot with patch from form
  return {
    ...base,
    ...patch,
  };
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
    wordingFields: detail.wordingFields,
    feeStatuses: detail.feeStatuses,
    hasOffsiteFee: detail.hasOffsiteFee,
    caseReference: detail.caseReference,
    accountNumber: detail.accountNumber,
    notes: detail.notes,
    lodgementDate: detail.lodgementDate,
    ...(detail as { officials?: Official[] }),
  };

  return {
    ...base,
    [key]: value,
  };
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

  // Prefer explicit type if it's valid AND matches the payload
  const t =
    r.type === 'person' || r.type === 'organisation'
      ? (r.type as RespondentEntryType)
      : null;

  if (t === 'person') {
    return r.person ? 'person' : r.organisation ? 'organisation' : 'person';
  }
  if (t === 'organisation') {
    return r.organisation
      ? 'organisation'
      : r.person
        ? 'person'
        : 'organisation';
  }

  // Fallback: infer from presence
  if (r.person) {
    return 'person';
  }
  if (r.organisation) {
    return 'organisation';
  }

  return null;
}
