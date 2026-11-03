import {
  afterAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

jest.mock(
  '../../../cypress/support/helper/forms/accordion/accordion/AccordionHelper',
  () => ({
    AccordionHelper: {
      within: jest.fn((_title: string, run: () => void) => run()),
    },
  }),
);

// Runtime loading keeps Cypress's global types out of the Jest TypeScript project.
const { CivilFeeHelper } = jest.requireActual<{
  CivilFeeHelper: {
    captureApplicationCodeFees(code: string): void;
    verifyAmounts(): void;
  };
}>('../../../cypress/support/helper/appreg/CivilFeeHelper');

describe('CivilFeeHelper', () => {
  const originalCy = Object.getOwnPropertyDescriptor(globalThis, 'cy');
  const alias = jest.fn();
  let response: {
    statusCode: number;
    body: {
      feeReference?: string | null;
      feeAmount?: { value: number } | null;
      offsiteFeeReference?: string | null;
      offsiteFeeAmount?: { value: number } | null;
    };
  };
  let heading: string;
  const chain = {
    invoke: jest.fn(
      (method: string, pattern?: RegExp, replacement?: string) => {
        if (method === 'replace') {
          heading = heading.replace(pattern!, replacement!);
        } else if (method === 'trim') {
          heading = heading.trim();
        }
        return chain;
      },
    ),
    should: jest.fn((_matcher: string, expected: string) => {
      expect(heading).toBe(expected);
    }),
  };
  const cyMock = {
    intercept: jest.fn(() => ({ as: alias })),
    get: jest.fn(() => ({
      its: jest.fn(() => ({
        then: (run: (value: typeof response) => void) => run(response),
      })),
    })),
    contains: jest.fn(() => chain),
  };

  beforeEach(() => {
    Object.defineProperty(globalThis, 'cy', {
      value: cyMock,
      configurable: true,
    });
    response = {
      statusCode: 200,
      body: {
        feeReference: 'CO8.1',
        feeAmount: { value: 29200 },
        offsiteFeeReference: 'CO1.1',
        offsiteFeeAmount: { value: 2550 },
      },
    };
    heading =
      ' Fee Reference: CO8.1 \u2003 Amount: £292.00 \u2003 Off Site Fee Reference: CO1.1 \u2003 Off Site Fee Amount: £25.50 \u2003 Total Fee Amount: £317.50 ';
  });

  afterAll(() => {
    if (originalCy) {
      Object.defineProperty(globalThis, 'cy', originalCy);
    } else {
      Reflect.deleteProperty(globalThis, 'cy');
    }
  });

  it('observes the real selected-code request without fixing its date or response', () => {
    CivilFeeHelper.captureApplicationCodeFees('MX99006');
    expect(cyMock.intercept).toHaveBeenCalledWith({
      method: 'GET',
      pathname: '/application-codes/MX99006',
    });
    expect(alias).toHaveBeenCalledWith('civilFeeApplicationCode');
  });

  it('checks the CI fee amounts and permits rechecking after reopening', () => {
    CivilFeeHelper.verifyAmounts();
    CivilFeeHelper.verifyAmounts();
    expect(cyMock.get).toHaveBeenCalledWith('@civilFeeApplicationCode');
    expect(cyMock.contains).toHaveBeenCalledWith('h2', 'Fee Reference:');
  });

  it('also checks the different local reference-data amounts', () => {
    response.body.offsiteFeeAmount = { value: 3000 };
    heading = heading.replace('£25.50', '£30.00').replace('£317.50', '£322.00');
    CivilFeeHelper.verifyAmounts();
  });

  it('checks an offsite-only application with no base fee', () => {
    response.body.feeAmount = null;
    response.body.feeReference = null;
    heading = heading
      .replace('CO8.1', '—')
      .replace('£292.00', '£0.00')
      .replace('£317.50', '£25.50');
    CivilFeeHelper.verifyAmounts();
  });

  it.each(['£292.00', '£25.50', '£317.50'])(
    'rejects an incorrect displayed amount: %s',
    (amount) => {
      heading = heading.replace(amount, '£1.00');
      expect(() => CivilFeeHelper.verifyAmounts()).toThrow();
    },
  );

  it.each([
    undefined,
    null,
    { value: -1 },
    { value: 25.5 },
    { value: Number.NaN },
  ])('rejects invalid offsite metadata: %j', (amount) => {
    response.body.offsiteFeeAmount = amount;
    expect(() => CivilFeeHelper.verifyAmounts()).toThrow(
      'Expected valid fee amounts in integer pence',
    );
  });

  it('rejects failed application-code requests', () => {
    response.statusCode = 500;
    expect(() => CivilFeeHelper.verifyAmounts()).toThrow(
      'Application-code fee lookup did not succeed',
    );
  });
});
