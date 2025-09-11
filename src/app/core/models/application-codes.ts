export interface ApplicationCode {
  id: number;
  applicationCode: string;
  title: string;
  wording: string;
  legislation: string | null;
  feeDue: boolean;
  requiresRespondent: boolean;
  bulkRespondentAllowed: boolean;
  destinationEmail1: string | null;
  destinationEmail2: string | null;
  startDate: string;
  endDate: string | null;
  feeReference: string | null;
  mainFeeDescription: string | null;
  mainFeeAmount: number | null;
  offsetFeeDescription: string | null;
  offsetFeeAmount: number | null;
}