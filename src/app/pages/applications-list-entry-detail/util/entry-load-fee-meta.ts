import { ApplicationCodeGetDetailDto, EntryGetDetailDto } from '@openapi';
import { CivilFeeMeta } from '@shared-types/civil-fee/civil-fee';

export function codeFeeMeta(code: ApplicationCodeGetDetailDto): CivilFeeMeta {
  return {
    feeReference: code.feeReference ?? null,
    feeDescription: code.feeDescription ?? null,
    feeAmount: code.feeAmount ?? null,
    offsiteFeeReference: code.offsiteFeeReference ?? null,
    offsiteFeeDescription: code.offsiteFeeDescription ?? null,
    offsiteFeeAmount: code.offsiteFeeAmount ?? null,
  };
}

export function savedFeeMeta(
  entry: EntryGetDetailDto,
  code: ApplicationCodeGetDetailDto,
): CivilFeeMeta {
  if (!entry.fees?.length) {
    return codeFeeMeta(code);
  }

  const mainFee = entry.fees.find((fee) => fee.offsite !== true);
  const offsiteFee = entry.fees.find((fee) => fee.offsite === true);
  const amount = (value?: number) =>
    value === null || value === undefined
      ? null
      : { value: value * 100, currency: 'GBP' };

  return {
    feeReference: mainFee?.reference ?? null,
    feeDescription: mainFee?.description ?? null,
    feeAmount: amount(mainFee?.value),
    offsiteFeeReference: offsiteFee?.reference ?? null,
    offsiteFeeDescription: offsiteFee?.description ?? null,
    offsiteFeeAmount: amount(offsiteFee?.value),
  };
}
