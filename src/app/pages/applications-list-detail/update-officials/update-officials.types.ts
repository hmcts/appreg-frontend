import { Row } from '@core-types/table/row.types';
import { Official } from '@openapi';
import { ApplicationsListEntryFormValue } from '@shared-types/applications-list-entry-create/application-list-entry-form';

export type UpdateOfficialsApplication = Row & {
  id: string;
  sequenceNumber?: number | string;
  applicant?: string | null;
  respondent?: string | null;
  title?: string | null;
};

export type UpdateOfficialsNavState = {
  updateOfficialsApplications?: UpdateOfficialsApplication[];
  officials?: Official[];
  officialFormValue?: ApplicationsListEntryFormValue;
};
