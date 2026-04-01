import { FormControl, FormGroup } from '@angular/forms';

import { Duration } from '@components/duration-input/duration-input.component';
import { ApplicationListStatus, ApplicationListUpdateDto } from '@openapi';
import { CloseNotPermittedError } from '@shared-types/applications-list-close/applications-list-close.type';

export type DetailForm = FormGroup<{
  date: FormControl<string | null>;
  time: FormControl<Duration | null>;
  description: FormControl<string | null>;
  status: FormControl<string | null>;
  court: FormControl<string>;
  location: FormControl<string>;
  cja: FormControl<string>;
  duration: FormControl<Duration | null>;
}>;

export type Handoff = {
  id: string;
  date: string | null;
  time: string | null;
  description: string | null;
  status: ApplicationListStatus;
  location: string;
  etag: string | null;
  version: number;
  entriesCount: number;
};

export type selectedRow = {
  id: string;
  sequenceNumber: number;
  accountNumber: string | null;
  applicant: string | null;
  respondent: string | null;
  postCode: string | null;
  title: string;
  feeReq: 'Yes' | 'No';
  resulted: string | null;
};

export type CourtLocCjaConflictError = { message: string };
export type DetailFormGroupErrors = {
  courtLocCjaConflict?: CourtLocCjaConflictError;
  closeNotPermitted?: CloseNotPermittedError;
};

export type tableDataReq = {
  id: string;
  pageNumber: number;
  pageSize: number;
  filter?: { field: string; value: string }[];
  sort?: { field: string; direction: 'asc' | 'desc' }[];
};
export type UpdateReq = {
  id: string;
  payload: ApplicationListUpdateDto;
  etag: string | null;
};
export type listDetailsReq = {
  id: string;
  pageNumber: number;
  pageSize: number;
};
