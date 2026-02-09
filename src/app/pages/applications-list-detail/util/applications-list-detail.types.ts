import { FormControl, FormGroup } from '@angular/forms';

import { Duration } from '@components/duration-input/duration-input.component';
import { ApplicationListStatus, ApplicationListUpdateDto } from '@openapi';

export type DetailForm = FormGroup<{
  date: FormControl<string | null>;
  time: FormControl<Duration | null>;
  description: FormControl<string>;
  status: FormControl<string | null>;
  court: FormControl<string | null>;
  location: FormControl<string | null>;
  cja: FormControl<string | null>;
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
  resulted: 'Yes' | 'No';
};

export type CourtLocCjaConflictError = { message: string };
export type DetailFormGroupErrors = {
  courtLocCjaConflict?: CourtLocCjaConflictError;
};

export type LoadDetailReq = { id: string; page: number; size: number };
export type UpdateReq = {
  id: string;
  payload: ApplicationListUpdateDto;
  etag: string | null;
};
