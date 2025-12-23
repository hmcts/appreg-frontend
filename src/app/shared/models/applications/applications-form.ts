import { RowLike } from '@components/sortable-table/sortable-table.component';

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

export type ApplicationRow = RowLike & {
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
