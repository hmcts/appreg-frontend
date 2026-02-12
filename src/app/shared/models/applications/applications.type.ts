import { Row } from '@core-types/table/row.types';

export type ApplicationsSearchFormValue = {
  date: string | null;
  applicantOrg: string;
  respondentOrg: string;
  applicantSurname: string;
  respondentSurname: string;
  location: string;
  standardApplicantCode: string;
  respondentPostcode: string;
  accountReference: string;
  court: string;
  cja: string;
  status: string | null;
};

export type ApplicationRow = Row & {
  id: string;
  date: string;
  applicant: string;
  respondent: string;
  title: string;
  fee: string;
  resulted: string;
  status: string;
  actions: string;
};
