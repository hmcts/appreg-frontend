import {
  ApplicationCodeGetSummaryDtoFeeAmount,
  ApplicationCodeGetSummaryDtoFeeAmountCurrencyEnum,
  FeeStatus,
} from '@openapi';
import {
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
  parts.push(`Fee Reference: ${feeRef || '—'}`);
  parts.push(`Amount: ${feeAmount}`);

  if (hasOffsiteFee) {
    const offsiteAmount = formatGbpOrDash(meta.offsiteFeeAmount);
    const total =
      meta.feeAmount?.value !== null && meta.offsiteFeeAmount?.value !== null
        ? formatGbpOrDash(addMoney(meta.feeAmount, meta.offsiteFeeAmount))
        : '—';

    parts.push(`Off Site Fee Amount: ${offsiteAmount}`);
    parts.push(`Total Fee Amount: ${total}`);
  }

  return parts.join(' \u2003 '); // em space
}

export function feeStatusRowId(
  fs: Pick<FeeStatus, 'paymentStatus' | 'statusDate'>,
): string {
  return `${fs.paymentStatus}|${fs.statusDate}`;
}

export function readPaymentRefReturnState(state: unknown): {
  updatedRowId: string;
  newPaymentReference: string;
} | null {
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

  const next = current.map((fs) => {
    if (feeStatusRowId(fs) !== updatedRowId) {
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
