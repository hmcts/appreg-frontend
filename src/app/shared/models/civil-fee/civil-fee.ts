import { ApplicationCodeGetSummaryDtoFeeAmount } from '@openapi';

/**
 * Route-return state shape from /change-payment-reference.
 */
export type PaymentRefReturnState = {
  updatedRowId?: unknown;
  newPaymentReference?: unknown;
};

export type PaymentRefReturn = {
  updatedRowId: string;
  newPaymentReference: string;
};

export type CivilFeeMeta = {
  feeReference?: string | null;
  feeAmount?: ApplicationCodeGetSummaryDtoFeeAmount | null;
  offsiteFeeAmount?: ApplicationCodeGetSummaryDtoFeeAmount | null;
};

export type AddFeeDetailsPayload = {
  feeStatus: string;
  statusDate: string;
  paymentReference: string | null;
};
