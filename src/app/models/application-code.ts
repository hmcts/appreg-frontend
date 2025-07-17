export interface ApplicationCode {
  id: number;
  applicationCode: string;
  title: string;
  wording: string;
  mainFeeAmount: number;
  mainFeeDescription: string;
  offsetFeeAmount: number;
  offsetFeeDescription: string;
  feeDue: boolean;
  feeReference: string;
  legislation: string;
  destinationEmail1: string | null;
  destinationEmail2: string | null;
  startDate: string; // ISO date
  endDate: string | null; // ISO date
  bulkRespondentAllowed: boolean;
  requiresRespondent: boolean;
}
