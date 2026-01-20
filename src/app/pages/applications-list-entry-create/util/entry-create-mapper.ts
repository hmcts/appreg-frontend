import {
  hasRequiredOrg,
  hasRequiredPerson,
  makeContactDetails,
  pruneNullish,
  toOptionalTrimmed,
} from './helpers';

import {
  Applicant,
  EntryCreateDto,
  FeeStatus,
  Respondent,
  TemplateSubstitution,
} from '@openapi';
import {
  ApplicationsListEntryFormValue,
  OrganisationFormValue,
  PersonFormValue,
  RespondentEntryType,
} from '@shared-types/applications-list-entry-create/application-list-entry-form';

/**
 * Top-level builder: turns form values into an EntryCreateDto.
 */
export function buildEntryCreateDto(
  formValue: ApplicationsListEntryFormValue,
  applicantPersonForm: PersonFormValue,
  applicantOrganisationForm: OrganisationFormValue,
  respondentPersonForm: PersonFormValue,
  respondentOrganisationForm: OrganisationFormValue,
): EntryCreateDto {
  const dto: Partial<EntryCreateDto> = {
    applicationCode: toOptionalTrimmed(formValue.applicationCode)!,
    respondent: buildRespondent(
      formValue,
      respondentPersonForm,
      respondentOrganisationForm,
    ),
    numberOfRespondents: formValue.numberOfRespondents ?? undefined,
    wordingFields: buildWordingFields(formValue),
    feeStatuses: buildFeeStatuses(formValue),
    hasOffsiteFee: formValue.hasOffsiteFee ?? undefined,
    lodgementDate: toOptionalTrimmed(formValue.lodgementDate),
    ...buildNotesFields(formValue),
  };

  if (formValue.applicantType === 'standard') {
    dto.standardApplicantCode = toOptionalTrimmed(
      formValue.standardApplicantCode,
    );
  } else {
    dto.applicant = buildApplicant(
      formValue,
      applicantPersonForm,
      applicantOrganisationForm,
    );
  }

  pruneNullish(dto);
  return dto as EntryCreateDto;
}

function buildApplicant(
  formValue: ApplicationsListEntryFormValue,
  personForm: PersonFormValue,
  organisationForm: OrganisationFormValue,
): Applicant | undefined {
  const type = formValue.applicantType;

  if (type === 'person') {
    const pf = personForm;
    if (!hasRequiredPerson(pf)) {
      return undefined;
    }

    const first = pf.firstName.trim();
    const sur = pf.surname?.trim() || '';

    return {
      person: {
        name: {
          title: toOptionalTrimmed(pf.title),
          firstForename: first,
          secondForename: toOptionalTrimmed(pf.middleNames),
          surname: sur,
        },
        contactDetails: makeContactDetails(pf),
      },
    };
  }

  if (type === 'org') {
    const of = organisationForm;

    if (!hasRequiredOrg(of)) {
      return undefined;
    }

    return {
      organisation: {
        name: of.name.trim(),
        contactDetails: makeContactDetails(of),
      },
    };
  }

  return undefined;
}

function buildRespondent(
  formValue: ApplicationsListEntryFormValue,
  personForm: PersonFormValue,
  organisationForm: OrganisationFormValue,
): Respondent | undefined {
  const inferredType: RespondentEntryType | null = hasRequiredPerson(personForm)
    ? 'person'
    : hasRequiredOrg(organisationForm)
      ? 'organisation'
      : null;

  const t = formValue.respondentEntryType ?? inferredType;

  if (!t) {
    return undefined;
  }

  if (t === 'person') {
    const pf = personForm;
    if (!hasRequiredPerson(pf)) {
      return undefined;
    }

    const first = pf.firstName.trim();
    const sur = pf.surname?.trim() || '';

    return {
      person: {
        name: {
          title: toOptionalTrimmed(pf.title),
          firstForename: first,
          secondForename: toOptionalTrimmed(pf.middleNames),
          surname: sur,
        },
        contactDetails: makeContactDetails(pf),
      },
    };
  }

  if (t === 'organisation') {
    const of = organisationForm;
    if (!hasRequiredOrg(of)) {
      return undefined;
    }

    return {
      organisation: {
        name: of.name.trim(),
        contactDetails: makeContactDetails(of),
      },
    };
  }

  return undefined;
}

function buildFeeStatuses(
  formValue: ApplicationsListEntryFormValue,
): FeeStatus[] | undefined {
  const paymentStatus = toOptionalTrimmed(formValue.feeStatus);
  const statusDate = toOptionalTrimmed(formValue.feeStatusDate);
  const paymentRef = toOptionalTrimmed(formValue.paymentRef);

  if (!paymentStatus && !statusDate && !paymentRef) {
    return undefined;
  }

  const item = {
    paymentStatus,
    statusDate,
    paymentReference: paymentRef,
  } as FeeStatus;

  return [item];
}

function buildWordingFields(
  formValue: ApplicationsListEntryFormValue,
): TemplateSubstitution[] | undefined {
  const courtName = toOptionalTrimmed(formValue.courtName);
  const orgName = toOptionalTrimmed(formValue.organisationName);

  const fields: TemplateSubstitution[] = [];
  // The key's are not set but hardcoding it for what we have right now
  if (courtName !== null && typeof courtName === 'string') {
    fields.push({ key: 'courtName', value: courtName });
  }
  if (orgName !== null && typeof orgName === 'string') {
    fields.push({ key: 'organisationName', value: orgName });
  }

  return fields.length ? fields : undefined;
}

function buildNotesFields(formValue: ApplicationsListEntryFormValue) {
  const notes = {
    caseReference: toOptionalTrimmed(formValue.applicationNotes.caseReference),
    accountNumber: toOptionalTrimmed(
      formValue.applicationNotes.accountReference,
    ),
    notes: toOptionalTrimmed(formValue.applicationNotes.notes),
  };

  const allEmpty = !notes.caseReference && !notes.accountNumber && !notes.notes;

  return allEmpty ? {} : notes;
}
