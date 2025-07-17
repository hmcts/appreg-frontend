// export interface Application {
//   id: number;
//   date: string;
//   time: string;
//   location: string;
//   description: string;
//   entries: number;
//   status: string;
// }

import { IdentityDetails } from './identity-details';
import { StandardApplicant } from './standard-applicant';
import { ApplicationCode } from './application-code';

export interface Application {
  id: number;
  standardApplicant: StandardApplicant;
  applicationCode: ApplicationCode;
  feeStatus: 'DUE' | 'PAID' | 'REMITTED' | 'UNDERTAKING';
  paymentRef: string | null;
  applicant: IdentityDetails;
  respondent: IdentityDetails;
  numberOfBulkRespondents: number | null;
  applicationWording: string | null;
  caseReference: string | null;
  accountNumber: string | null;
  applicationRescheduled: string | null;
  notes: string | null;
  bulkUpload: string | null;
  resultId: number | null;
  changedBy: string | null;
  changedDate: string | null; // ISO date string
  version: number;
}
