import {
  compactStrings,
  hasRequiredOrg,
  hasRequiredPerson,
  makeContactDetails,
  pruneNullish,
  toOptionalTrimmed,
} from './helpers';

import { Applicant, EntryCreateDto, FeeStatus, Respondent } from '@openapi';
import {
  ApplicationsListEntryCreateFormValue,
  OrganisationFormValue,
  PersonFormValue,
} from '@shared-types/applications-list-entry-create/application-list-entry-create-form';

/**
 * Top-level builder: turns form values into an EntryCreateDto.
 */
export function buildEntryCreateDto(
  formValue: ApplicationsListEntryCreateFormValue,
  personForm: PersonFormValue,
  organisationForm: OrganisationFormValue,
): EntryCreateDto {
  const dto: Partial<EntryCreateDto> = {
    applicationCode: toOptionalTrimmed(formValue.applicationCode)!,
    respondent: buildRespondent(formValue, personForm, organisationForm),
    numberOfRespondents: formValue.numberOfRespondents ?? undefined,
    wordingFields: buildWordingFields(formValue),
    feeStatuses: buildFeeStatuses(formValue),
    hasOffsiteFee: formValue.hasOffsiteFee ?? undefined,
    caseReference: toOptionalTrimmed(formValue.applicationNotes.caseReference),
    accountNumber: toOptionalTrimmed(
      formValue.applicationNotes.accountReference,
    ),
    notes: toOptionalTrimmed(formValue.applicationNotes.notes),
    lodgementDate: toOptionalTrimmed(formValue.lodgementDate),
  };

  if (formValue.applicantType === 'standard') {
    dto.standardApplicantCode = toOptionalTrimmed(
      formValue.standardApplicantCode,
    );
  } else {
    dto.applicant = buildApplicant(formValue, personForm, organisationForm);
  }

  pruneNullish(dto);
  return dto as EntryCreateDto;
}

function buildApplicant(
  formValue: ApplicationsListEntryCreateFormValue,
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
  formValue: ApplicationsListEntryCreateFormValue,
  personForm: PersonFormValue,
  organisationForm: OrganisationFormValue,
): Respondent | undefined {
  const t = formValue.respondentEntryType;
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
  formValue: ApplicationsListEntryCreateFormValue,
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
  formValue: ApplicationsListEntryCreateFormValue,
): string[] | undefined {
  const courtName = toOptionalTrimmed(formValue.courtName);
  const orgName = toOptionalTrimmed(formValue.organisationName);
  return compactStrings([courtName, orgName]);
}
