import { ApplicantContext } from './routing-state-util';

import { Applicant, EntryGetDetailDto, FullName, Respondent } from '@openapi';

export function buildResultApplicantContext(
  entry: EntryGetDetailDto,
  title: string | null | undefined,
): ApplicantContext {
  return {
    applicant: formatApplicantForResultContext(entry),
    respondent: formatRespondentForResultContext(entry),
    title: title?.trim() ?? '',
  };
}

function formatApplicantForResultContext(entry: EntryGetDetailDto): string {
  const applicantDisplay = formatApplicantLike(entry.applicant);
  if (applicantDisplay) {
    return applicantDisplay;
  }

  return entry.standardApplicantCode?.trim() ?? '';
}

function formatRespondentForResultContext(entry: EntryGetDetailDto): string {
  return formatRespondentLike(entry.respondent);
}

function formatApplicantLike(applicant: Applicant | undefined): string {
  if (applicant?.organisation?.name?.trim()) {
    return applicant.organisation.name.trim();
  }

  return formatPersonNameSurnameFirst(applicant?.person?.name);
}

function formatRespondentLike(respondent: Respondent | undefined): string {
  if (respondent?.organisation?.name?.trim()) {
    return respondent.organisation.name.trim();
  }

  return formatPersonNameSurnameFirst(respondent?.person?.name);
}

function formatPersonNameSurnameFirst(
  name: FullName | null | undefined,
): string {
  if (!name) {
    return '';
  }

  const surname = name.surname?.trim() ?? '';
  const firstForename = name.firstForename?.trim() ?? '';

  if (surname && firstForename) {
    return `${surname}, ${firstForename}`;
  }

  return surname || firstForename;
}
