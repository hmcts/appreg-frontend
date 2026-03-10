import { FormControl } from '@angular/forms';

import type {
  ApplicationCodeGetSummaryDtoFeeAmount,
  FeeStatus,
} from '@openapi';
import {
  ApplicationCodeGetSummaryDtoFeeAmountCurrencyEnum,
  PaymentStatus,
} from '@openapi';
import {
  AddFeeDetailsPayload,
  CivilFeeMeta,
  PaymentRefReturnState,
} from '@shared-types/civil-fee/civil-fee';
import {
  addOrReplaceFeeStatus,
  applyPaymentReferenceUpdateToFeeStatuses,
  buildCivilFeeHeading,
  feeStatusRowId,
  readPaymentRefReturnState,
  toFeeStatus,
  updateFeeStatusesControl,
  updatePaymentReferenceInFeeStatusesControl,
} from '@util/civil-fee-utils';

const money = (value: number): ApplicationCodeGetSummaryDtoFeeAmount => ({
  value,
  currency: ApplicationCodeGetSummaryDtoFeeAmountCurrencyEnum.GBP,
});

const mkFeeStatus = (overrides: Partial<FeeStatus> = {}): FeeStatus => ({
  paymentStatus: PaymentStatus.DUE,
  statusDate: '2026-01-19',
  paymentReference: undefined,
  ...overrides,
});

const mkMeta = (overrides: Partial<CivilFeeMeta> = {}): CivilFeeMeta => ({
  feeReference: 'CO7.2',
  feeAmount: money(2500),
  offsiteFeeAmount: money(3000),
  ...overrides,
});

describe('toFeeStatus', () => {
  it('maps fields and converts null paymentReference to undefined', () => {
    const result = toFeeStatus({
      feeStatus: PaymentStatus.PAID,
      statusDate: '2026-01-19',
      paymentReference: null,
    });

    expect(result).toEqual({
      paymentStatus: PaymentStatus.PAID,
      statusDate: '2026-01-19',
      paymentReference: undefined,
    });
  });

  it('keeps non-null paymentReference', () => {
    const result = toFeeStatus({
      feeStatus: PaymentStatus.DUE,
      statusDate: '2026-01-19',
      paymentReference: 'ABC123',
    });

    expect(result.paymentReference).toBe('ABC123');
  });
});

describe('feeStatusRowId', () => {
  it('builds paymentStatus|statusDate', () => {
    const rowId = feeStatusRowId({
      paymentStatus: PaymentStatus.REMITTED,
      statusDate: '2026-01-01',
    });

    expect(rowId).toBe(`${PaymentStatus.REMITTED}|2026-01-01`);
  });
});

describe('addOrReplaceFeeStatus', () => {
  it("appends when row id doesn't exist", () => {
    const current: FeeStatus[] = [
      mkFeeStatus({
        paymentStatus: PaymentStatus.PAID,
        statusDate: '2026-01-10',
        paymentReference: 'REF1',
      }),
    ];

    const nextItem = mkFeeStatus({
      paymentStatus: PaymentStatus.DUE,
      statusDate: '2026-01-11',
      paymentReference: 'NEW',
    });

    const { next, changed } = addOrReplaceFeeStatus(current, nextItem);

    expect(changed).toBe(true);
    expect(next).toEqual([...current, nextItem]);
    expect(next).not.toBe(current);
  });

  it('returns unchanged when same row exists and values are identical', () => {
    const current: FeeStatus[] = [
      mkFeeStatus({
        paymentStatus: PaymentStatus.PAID,
        statusDate: '2026-01-10',
        paymentReference: undefined,
      }),
    ];

    const nextItem = mkFeeStatus({
      paymentStatus: PaymentStatus.PAID,
      statusDate: '2026-01-10',
      paymentReference: undefined,
    });

    const res = addOrReplaceFeeStatus(current, nextItem);

    expect(res.changed).toBe(false);
    expect(res.next).toBe(current); // same reference when unchanged
  });

  it('replaces when same row exists but paymentReference differs', () => {
    const current: FeeStatus[] = [
      mkFeeStatus({
        paymentStatus: PaymentStatus.PAID,
        statusDate: '2026-01-10',
        paymentReference: 'REF1',
      }),
    ];

    const nextItem = mkFeeStatus({
      paymentStatus: PaymentStatus.PAID,
      statusDate: '2026-01-10',
      paymentReference: 'REF2',
    });

    const { next, changed } = addOrReplaceFeeStatus(current, nextItem);

    expect(changed).toBe(true);
    expect(next).not.toBe(current);
    expect(next).toEqual([nextItem]);
  });

  it('treats undefined and empty string paymentReference as equivalent for equality check', () => {
    const current: FeeStatus[] = [
      mkFeeStatus({
        paymentStatus: PaymentStatus.PAID,
        statusDate: '2026-01-10',
        paymentReference: undefined,
      }),
    ];

    const nextItem = mkFeeStatus({
      paymentStatus: PaymentStatus.PAID,
      statusDate: '2026-01-10',
      paymentReference: '',
    });

    const res = addOrReplaceFeeStatus(current, nextItem);

    expect(res.changed).toBe(false);
    expect(res.next).toBe(current);
  });
});

describe('buildCivilFeeHeading', () => {
  it('builds heading without offsite fee', () => {
    const heading = buildCivilFeeHeading(mkMeta(), false);

    expect(heading).toContain('Fee Reference: CO7.2');
    expect(heading).toContain('Amount: £25.00');
    expect(heading).not.toContain('Off Site Fee Amount:');
    expect(heading).not.toContain('Total Fee Amount:');
  });

  it('builds heading with offsite fee and total', () => {
    const heading = buildCivilFeeHeading(mkMeta(), true);

    expect(heading).toContain('Fee Reference: CO7.2');
    expect(heading).toContain('Amount: £25.00');
    expect(heading).toContain('Off Site Fee Amount: £30.00');
    expect(heading).toContain('Total Fee Amount: £55.00');
  });

  it('uses em spaces between parts', () => {
    const heading = buildCivilFeeHeading(mkMeta(), true);
    expect(heading).toContain(' \u2003 ');
  });

  it('uses dashes when feeReference is empty/whitespace', () => {
    const heading = buildCivilFeeHeading(
      mkMeta({ feeReference: '   ' }),
      false,
    );
    expect(heading).toContain('Fee Reference: —');
  });

  it('uses dash for offsite amount when offsiteFeeAmount is null', () => {
    const heading = buildCivilFeeHeading(
      mkMeta({ offsiteFeeAmount: null }),
      true,
    );
    expect(heading).toContain('Off Site Fee Amount: —');
  });

  it('uses dash for total when either fee amount value is null', () => {
    const feeAmountWithNullValue: ApplicationCodeGetSummaryDtoFeeAmount = {
      ...money(0),
      value: null as unknown as number,
    };

    const heading = buildCivilFeeHeading(
      mkMeta({
        feeAmount: feeAmountWithNullValue,
        offsiteFeeAmount: money(3000),
      }),
      true,
    );

    expect(heading).toContain('Total Fee Amount: —');
  });
});

describe('readPaymentRefReturnState', () => {
  it('returns null when state is not an object with expected string fields', () => {
    expect(readPaymentRefReturnState(null)).toBeNull();
    expect(readPaymentRefReturnState({})).toBeNull();
    expect(readPaymentRefReturnState({ updatedRowId: 'ROW' })).toBeNull();
    expect(
      readPaymentRefReturnState({ newPaymentReference: 'REF' }),
    ).toBeNull();
    expect(
      readPaymentRefReturnState({
        updatedRowId: 123,
        newPaymentReference: 'REF',
      }),
    ).toBeNull();
    expect(
      readPaymentRefReturnState({
        updatedRowId: 'ROW',
        newPaymentReference: 123,
      }),
    ).toBeNull();
  });

  it('trims newPaymentReference and returns payload when valid', () => {
    const state: PaymentRefReturnState = {
      updatedRowId: `${PaymentStatus.PAID}|2026-01-10`,
      newPaymentReference: '  REF123  ',
    };

    expect(readPaymentRefReturnState(state)).toEqual({
      updatedRowId: `${PaymentStatus.PAID}|2026-01-10`,
      newPaymentReference: 'REF123',
    });
  });

  it('returns null when updatedRowId is empty string', () => {
    const state: PaymentRefReturnState = {
      updatedRowId: '',
      newPaymentReference: 'REF123',
    };

    expect(readPaymentRefReturnState(state)).toBeNull();
  });

  it('allows blank payment reference (whitespace trims to empty string)', () => {
    const state: PaymentRefReturnState = {
      updatedRowId: 'ROW',
      newPaymentReference: '   ',
    };

    expect(readPaymentRefReturnState(state)).toEqual({
      updatedRowId: 'ROW',
      newPaymentReference: '',
    });
  });
});

describe('applyPaymentReferenceUpdateToFeeStatuses', () => {
  it('returns unchanged when no row matches', () => {
    const current: FeeStatus[] = [
      mkFeeStatus({
        paymentStatus: PaymentStatus.PAID,
        statusDate: '2026-01-10',
        paymentReference: 'REF1',
      }),
    ];

    const { next, changed } = applyPaymentReferenceUpdateToFeeStatuses(
      current,
      `${PaymentStatus.PAID}|2099-01-01`,
      'NEW',
    );

    expect(changed).toBe(false);
    expect(next).toEqual(current);
  });

  it('returns unchanged when matching row already has the same reference', () => {
    const current: FeeStatus[] = [
      mkFeeStatus({
        paymentStatus: PaymentStatus.PAID,
        statusDate: '2026-01-10',
        paymentReference: 'REF1',
      }),
    ];

    const { next, changed } = applyPaymentReferenceUpdateToFeeStatuses(
      current,
      `${PaymentStatus.PAID}|2026-01-10`,
      'REF1',
    );

    expect(changed).toBe(false);
    expect(next).toEqual(current);
  });

  it('updates paymentReference for the matching row and sets changed=true', () => {
    const current: FeeStatus[] = [
      mkFeeStatus({
        paymentStatus: PaymentStatus.PAID,
        statusDate: '2026-01-10',
        paymentReference: 'OLD',
      }),
      mkFeeStatus({
        paymentStatus: PaymentStatus.DUE,
        statusDate: '2026-01-11',
        paymentReference: undefined,
      }),
    ];

    const { next, changed } = applyPaymentReferenceUpdateToFeeStatuses(
      current,
      `${PaymentStatus.PAID}|2026-01-10`,
      'NEW',
    );

    expect(changed).toBe(true);
    expect(next[0].paymentReference).toBe('NEW');
    expect(next[1]).toEqual(current[1]);
  });

  it('treats undefined paymentReference as empty string when comparing', () => {
    const current: FeeStatus[] = [
      mkFeeStatus({
        paymentStatus: PaymentStatus.PAID,
        statusDate: '2026-01-10',
        paymentReference: undefined,
      }),
    ];

    const { changed } = applyPaymentReferenceUpdateToFeeStatuses(
      current,
      `${PaymentStatus.PAID}|2026-01-10`,
      '',
    );

    expect(changed).toBe(false);
  });
});

describe('updateFeeStatusesControl', () => {
  it('does not mutate the control when changed=false (no setValue / no markAsDirty)', () => {
    const existing: FeeStatus = mkFeeStatus({
      paymentStatus: PaymentStatus.PAID,
      statusDate: '2026-01-10',
      paymentReference: 'REF1',
    });

    const ctrl = new FormControl<FeeStatus[] | null>([existing]);

    const setValueSpy = jest.spyOn(ctrl, 'setValue');
    const markAsDirtySpy = jest.spyOn(ctrl, 'markAsDirty');

    const payload: AddFeeDetailsPayload = {
      feeStatus: PaymentStatus.PAID,
      statusDate: '2026-01-10',
      paymentReference: 'REF1',
    };

    const { next, changed } = updateFeeStatusesControl(ctrl, payload);

    expect(changed).toBe(false);
    expect(next).toBe(ctrl.value);
    expect(ctrl.dirty).toBe(false);

    expect(setValueSpy).not.toHaveBeenCalled();
    expect(markAsDirtySpy).not.toHaveBeenCalled();
  });

  it('mutates the control when changed=true (setValue + markAsDirty)', () => {
    const existing: FeeStatus = mkFeeStatus({
      paymentStatus: PaymentStatus.PAID,
      statusDate: '2026-01-10',
      paymentReference: 'REF1',
    });

    const ctrl = new FormControl<FeeStatus[] | null>([existing]);

    const setValueSpy = jest.spyOn(ctrl, 'setValue');
    const markAsDirtySpy = jest.spyOn(ctrl, 'markAsDirty');

    const payload: AddFeeDetailsPayload = {
      feeStatus: PaymentStatus.DUE,
      statusDate: '2026-01-11',
      paymentReference: null,
    };

    const { next, changed } = updateFeeStatusesControl(ctrl, payload);

    expect(changed).toBe(true);
    expect(ctrl.value).toEqual(next);
    expect(ctrl.value).toHaveLength(2);
    expect(ctrl.dirty).toBe(true);

    expect(setValueSpy).toHaveBeenCalledTimes(1);
    expect(markAsDirtySpy).toHaveBeenCalledTimes(1);
  });
});

describe('updatePaymentReferenceInFeeStatusesControl', () => {
  it('does not mutate the control when changed=false (trims and matches existing)', () => {
    const existing: FeeStatus = mkFeeStatus({
      paymentStatus: PaymentStatus.PAID,
      statusDate: '2026-01-10',
      paymentReference: 'REF1',
    });

    const ctrl = new FormControl<FeeStatus[] | null>([existing]);

    const setValueSpy = jest.spyOn(ctrl, 'setValue');
    const markAsDirtySpy = jest.spyOn(ctrl, 'markAsDirty');

    const rowId = feeStatusRowId(existing);

    const { next, changed } = updatePaymentReferenceInFeeStatusesControl(
      ctrl,
      rowId,
      '  REF1  ',
    );

    expect(changed).toBe(false);
    expect(next).toEqual([existing]);
    expect(ctrl.dirty).toBe(false);

    expect(setValueSpy).not.toHaveBeenCalled();
    expect(markAsDirtySpy).not.toHaveBeenCalled();
  });

  it('mutates the control when changed=true (trims payment ref, setValue + markAsDirty)', () => {
    const existing: FeeStatus = mkFeeStatus({
      paymentStatus: PaymentStatus.PAID,
      statusDate: '2026-01-10',
      paymentReference: 'OLD',
    });

    const ctrl = new FormControl<FeeStatus[] | null>([existing]);

    const setValueSpy = jest.spyOn(ctrl, 'setValue');
    const markAsDirtySpy = jest.spyOn(ctrl, 'markAsDirty');

    const rowId = feeStatusRowId(existing);

    const { next, changed } = updatePaymentReferenceInFeeStatusesControl(
      ctrl,
      rowId,
      '  NEW  ',
    );

    expect(changed).toBe(true);
    expect(ctrl.value).toEqual(next);
    expect(ctrl.value?.[0].paymentReference).toBe('NEW');
    expect(ctrl.dirty).toBe(true);

    expect(setValueSpy).toHaveBeenCalledTimes(1);
    expect(markAsDirtySpy).toHaveBeenCalledTimes(1);
  });
});
