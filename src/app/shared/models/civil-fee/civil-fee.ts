import { PaymentStatus } from '@openapi';

export type CivilFeeAmount = {
  value: number;
  currency?: string;
};

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
  feeDescription?: string | null;
  feeAmount?: CivilFeeAmount | null;
  offsiteFeeReference?: string | null;
  offsiteFeeDescription?: string | null;
  offsiteFeeAmount?: CivilFeeAmount | null;
};

export type AddFeeDetailsPayload = {
  feeStatus: PaymentStatus;
  statusDate: string;
  paymentReference: string | null;
};
