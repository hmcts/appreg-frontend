import { parseCreateNavState } from '@components/applications-list-entry-create/util/navigation-state';

describe('parseCreateNavState', () => {
  it('returns empty object for null', () => {
    expect(parseCreateNavState(null)).toEqual({});
  });

  it('returns empty object for primitive values', () => {
    expect(parseCreateNavState('value')).toEqual({});
    expect(parseCreateNavState(42)).toEqual({});
    expect(parseCreateNavState(true)).toEqual({});
  });

  it('returns only entryCreateSnapshot when present', () => {
    const snapshot = { form: { applicationCode: 'APP-1' } };

    expect(
      parseCreateNavState({
        entryCreateSnapshot: snapshot,
      }),
    ).toEqual({
      entryCreateSnapshot: snapshot,
    });
  });

  it('returns only paymentRefReturn when present', () => {
    const paymentRefReturn = {
      updatedRowId: 'Paid|2026-01-10',
      newPaymentReference: 'NEW',
    };

    expect(
      parseCreateNavState({
        paymentRefReturn,
      }),
    ).toEqual({
      paymentRefReturn,
    });
  });

  it('returns both whitelisted keys when both are present', () => {
    const snapshot = { form: { applicationCode: 'APP-1' } };
    const paymentRefReturn = {
      updatedRowId: 'Paid|2026-01-10',
      newPaymentReference: 'NEW',
    };

    expect(
      parseCreateNavState({
        entryCreateSnapshot: snapshot,
        paymentRefReturn,
      }),
    ).toEqual({
      entryCreateSnapshot: snapshot,
      paymentRefReturn,
    });
  });

  it('ignores unrelated keys', () => {
    expect(
      parseCreateNavState({
        keep: 'value',
        row: { id: 'ROW-1' },
      }),
    ).toEqual({});
  });
});
