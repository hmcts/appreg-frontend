import { FormControl } from '@angular/forms';

import {
  ApplicationCodeGetSummaryDtoFeeAmount,
  ApplicationCodeGetSummaryDtoFeeAmountCurrencyEnum,
  FeeStatus,
  PaymentStatus,
} from '@openapi';
import {
  AddFeeDetailsPayload,
  CivilFeeMeta,
  PaymentRefReturnState,
} from '@shared-types/civil-fee/civil-fee';

function formatGbpOrDash(
  amount: ApplicationCodeGetSummaryDtoFeeAmount | null | undefined,
): string {
  if (!amount || typeof amount.value !== 'number') {
    return '—';
  }
  return formatGbp(amount);
}

function formatGbp(
  amount: ApplicationCodeGetSummaryDtoFeeAmount | null | undefined,
): string {
  const pence = amount?.value;
  if (typeof pence !== 'number' || Number.isNaN(pence)) {
    return '£0.00';
  }

  const pounds = pence / 100;
  // Intl keeps it robust and consistent
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  }).format(pounds);
}

function addMoney(
  a: ApplicationCodeGetSummaryDtoFeeAmount | null | undefined,
  b: ApplicationCodeGetSummaryDtoFeeAmount | null | undefined,
): ApplicationCodeGetSummaryDtoFeeAmount {
  const av = typeof a?.value === 'number' ? a.value : 0;
  const bv = typeof b?.value === 'number' ? b.value : 0;

  return {
    value: av + bv,
    currency: ApplicationCodeGetSummaryDtoFeeAmountCurrencyEnum.GBP,
  };
}

export function toFeeStatus(payload: {
  feeStatus: PaymentStatus;
  statusDate: string;
  paymentReference: string | null;
}): FeeStatus {
  return {
    paymentStatus: payload.feeStatus,
    statusDate: payload.statusDate,
    paymentReference: payload.paymentReference ?? undefined,
  };
}

/**
 * Legacy behavior appends every fee status entry, even when the
 * paymentStatus and statusDate match an existing row.
 */
export function addFeeStatus(
  current: FeeStatus[],
  nextItem: FeeStatus,
): { next: FeeStatus[]; changed: boolean } {
  return { next: [...current, nextItem], changed: true };
}

/**
 * Builds:
 *  - no offsite: "Fee Reference: CO7.2  Amount: £25.00"
 *  - offsite: "Fee Reference: CO7.2  Amount: £25.00  CO1.1  Off Site Fee Amount: £30.00  Total Fee Amount: £55.00"
 */
export function buildCivilFeeHeading(
  meta: CivilFeeMeta,
  hasOffsiteFee: boolean,
): string {
  const feeRef = (meta.feeReference ?? '').trim();
  const feeAmount = formatGbp(meta.feeAmount);

  const parts: string[] = [];
  parts.push(`Fee Reference: ${feeRef || '—'}`, `Amount: ${feeAmount}`);

  if (hasOffsiteFee) {
    const offsiteAmount = formatGbpOrDash(meta.offsiteFeeAmount);
    const total =
      meta.feeAmount?.value !== null && meta.offsiteFeeAmount?.value !== null
        ? formatGbpOrDash(addMoney(meta.feeAmount, meta.offsiteFeeAmount))
        : '—';

    parts.push(
      `Off Site Fee Amount: ${offsiteAmount}`,
      `Total Fee Amount: ${total}`,
    );
  }

  return parts.join(' \u2003 '); // em space
}

export function feeStatusRowId(
  fs: Pick<FeeStatus, 'paymentStatus' | 'statusDate'>,
  index?: number,
): string {
  const baseId = `${fs.paymentStatus}|${fs.statusDate}`;
  return typeof index === 'number' ? `${baseId}|${index}` : baseId;
}

export function readPaymentRefReturnState(state: unknown): {
  updatedRowId: string;
  newPaymentReference: string;
} | null {
  if (state === null || typeof state !== 'object') {
    return null;
  }

  const s = state as PaymentRefReturnState;

  const updatedRowId =
    typeof s.updatedRowId === 'string' ? s.updatedRowId : null;
  const newPaymentReference =
    typeof s.newPaymentReference === 'string'
      ? s.newPaymentReference.trim()
      : null;

  if (!updatedRowId || newPaymentReference === null) {
    return null;
  }

  return { updatedRowId, newPaymentReference };
}

/**
 * Applies a payment reference update to feeStatuses in the given form.
 * Returns true if it actually changed anything.
 */
export function applyPaymentReferenceUpdateToFeeStatuses(
  current: FeeStatus[],
  updatedRowId: string,
  newPaymentReference: string,
): { next: FeeStatus[]; changed: boolean } {
  let changed = false;

  const next = current.map((fs, index) => {
    if (feeStatusRowId(fs, index) !== updatedRowId) {
      return fs;
    }

    const prev = fs.paymentReference ?? '';
    if (prev === newPaymentReference) {
      return fs;
    }

    changed = true;
    return { ...fs, paymentReference: newPaymentReference };
  });

  return { next, changed };
}

// Helper functions used in civil fee sections in
// src/app/pages/applications-list-entry-detail/applications-list-entry-detail.component.ts
// src/app/pages/applications-list-entry-create/applications-list-entry-create.component.ts
export function updateFeeStatusesControl(
  feeStatusesCtrl: FormControl<FeeStatus[] | null>,
  payload: AddFeeDetailsPayload,
): { next: FeeStatus[]; changed: boolean } {
  const current = feeStatusesCtrl.value ?? [];
  const nextItem = toFeeStatus(payload);

  const { next, changed } = addFeeStatus(current, nextItem);

  feeStatusesCtrl.setValue(next);
  feeStatusesCtrl.markAsDirty();

  return { next, changed };
}

export function updatePaymentReferenceInFeeStatusesControl(
  feeStatusesCtrl: FormControl<FeeStatus[] | null>,
  updatedRowId: string,
  newPaymentReference: string,
): { next: FeeStatus[]; changed: boolean } {
  const current = feeStatusesCtrl.value ?? [];
  const { next, changed } = applyPaymentReferenceUpdateToFeeStatuses(
    current,
    updatedRowId,
    newPaymentReference.trim(),
  );

  if (!changed) {
    return { next, changed };
  }

  feeStatusesCtrl.setValue(next);
  feeStatusesCtrl.markAsDirty();

  return { next, changed };
}
