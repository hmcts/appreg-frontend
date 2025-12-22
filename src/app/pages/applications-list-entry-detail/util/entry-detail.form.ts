import { NonNullableFormBuilder, Validators } from '@angular/forms';

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
import { trimToString, trimToUndefined } from '@util/string-helpers';
import {
  ContactFormRaw,
  OrganisationFormRaw,
  PersonFormRaw,
} from '@util/types/applications-list-entry/types';
import { standardApplicantCodeConditionalRequired } from '@validators/standard-applicant-code.validator';

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
    respondentEntryType: fb.control<RespondentEntryType | null>('organisation'),

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
    firstName: fb.control<string>('', { validators: [] }),
    middleNames: fb.control<string>('', { validators: [] }),
    surname: fb.control<string | null>(null),
    addressLine1: fb.control<string>('', { validators: [] }),
    addressLine2: fb.control<string>('', { validators: [] }),
    addressLine3: fb.control<string>('', { validators: [] }),
    addressLine4: fb.control<string>('', { validators: [] }),
    addressLine5: fb.control<string>('', { validators: [] }),
    postcode: fb.control<string | null>(null),
    phoneNumber: fb.control<string | null>(null),
    mobileNumber: fb.control<string | null>(null),
    emailAddress: fb.control<string | null>(null),
  }) as PersonForm;
}

export function buildOrganisationForm(
  fb: NonNullableFormBuilder,
): OrganisationForm {
  return fb.group({
    name: fb.control<string>('', { validators: [] }),
    addressLine1: fb.control<string>('', { validators: [] }),
    addressLine2: fb.control<string>('', { validators: [] }),
    addressLine3: fb.control<string>('', { validators: [] }),
    addressLine4: fb.control<string>('', { validators: [] }),
    addressLine5: fb.control<string>('', { validators: [] }),
    postcode: fb.control<string | null>(null),
    phoneNumber: fb.control<string | null>(null),
    mobileNumber: fb.control<string | null>(null),
    emailAddress: fb.control<string | null>(null),
  }) as OrganisationForm;
}

export function buildEntryUpdateDtoFromForm(
  detail: EntryGetDetailDto,
  formValue: ApplicationsListEntryFormValue,
  personForm: PersonFormValue,
  organisationForm: OrganisationFormValue,
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
    personForm,
    organisationForm,
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
    title: trimToUndefined(raw.title),
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
    title: name?.title ?? '',
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
