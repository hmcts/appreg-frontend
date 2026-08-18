import { ErrorItem } from '@components/error-summary/error-summary.component';

export type ApplicationListEntryErrorSections = {
  applicant: boolean;
  applicationCode: boolean;
  wording: boolean;
  respondent: boolean;
  civilFee: boolean;
  notes: boolean;
};

export function getApplicationListEntryErrorSections(
  childErrors: Record<string, ErrorItem[]>,
  parentErrors: ErrorItem[],
): ApplicationListEntryErrorSections {
  const sectionsWithErrors: ApplicationListEntryErrorSections = {
    applicant: childErrors['applicant'].length > 0,
    applicationCode: childErrors['codes'].length > 0,
    wording: childErrors['wording'].length > 0,
    respondent: childErrors['respondent'].length > 0,
    civilFee: childErrors['civilFee'].length > 0,
    notes: childErrors['notes'].length > 0,
  };

  for (const error of parentErrors) {
    if (error.id === 'applicationCode' || error.id === 'lodgementDate') {
      sectionsWithErrors.applicationCode = true;
    } else if (error.id?.startsWith('applicationNotes.')) {
      sectionsWithErrors.notes = true;
    } else if (error.id === 'standardApplicantCode') {
      sectionsWithErrors.applicant = true;
    } else if (
      error.id === 'feeStatus' ||
      error.id === 'feeStatusDate' ||
      error.id === 'paymentRef'
    ) {
      sectionsWithErrors.civilFee = true;
    } else if (error.id === 'numberOfRespondents') {
      sectionsWithErrors.respondent = true;
    }
  }

  return sectionsWithErrors;
}
