import { SelectedStandardApplicantSummary } from '@components/standard-applicant-select/standard-applicant-select.component';
import { ApplicationCodeGetDetailDto } from '@openapi';
import {
  ApplicationsListEntryFormValue,
  OrganisationFormValue,
  PersonFormValue,
} from '@shared-types/applications-list-entry-create/application-list-entry-form';
import { CivilFeeMeta } from '@shared-types/civil-fee/civil-fee';

export type EntryCreateSnapshot = {
  form: ApplicationsListEntryFormValue;
  personForm: PersonFormValue;
  organisationForm: OrganisationFormValue;
  respondentPersonForm: PersonFormValue;
  respondentOrganisationForm: OrganisationFormValue;
  appCodeDetail: ApplicationCodeGetDetailDto | null;
  feeMeta: CivilFeeMeta | null;
  isFeeRequired: boolean;
  bulkApplicationsAllowed: boolean;
  wordingAppliedBannerVisible: boolean;
  currentStandardApplicantSummary: SelectedStandardApplicantSummary | null;
};

export type ApplicantStep = 'select' | 'person' | 'org' | 'standard';
export type ChildErrorSource =
  | 'codes'
  | 'notes'
  | 'fee'
  | 'respondent'
  | 'applicant'
  | 'wording'
  | 'civilFee';
