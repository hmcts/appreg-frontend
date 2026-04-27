import { ApplicantContext } from './routing-state-util';

import { EntryGetDetailDto } from '@openapi';
import { formatPartyName } from '@util/string-helpers';

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
  const applicantDisplay = formatPartyName(entry.applicant) ?? '';
  if (applicantDisplay) {
    return applicantDisplay;
  }

  return entry.standardApplicantCode?.trim() ?? '';
}

function formatRespondentForResultContext(entry: EntryGetDetailDto): string {
  return formatPartyName(entry.respondent) ?? '';
}
