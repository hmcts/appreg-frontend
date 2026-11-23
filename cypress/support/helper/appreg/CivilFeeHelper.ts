import { AccordionHelper } from '../forms/accordion/accordion/AccordionHelper';
import { SummaryListHelper } from '../forms/summarylist/SummaryListHelper';

import type { ApplicationCodeGetDetailDto } from '@openapi';

export class CivilFeeHelper {
  static captureApplicationCodeFees(code: string): void {
    // Observe the real response, including the date selected by the application.
    cy.intercept({
      method: 'GET',
      pathname: `/application-codes/${encodeURIComponent(code)}`,
    }).as('civilFeeApplicationCode');
  }

  static verifyAmounts(): void {
    // Reuse the last response so the same check also works after reopening the entry.
    cy.get('@civilFeeApplicationCode')
      .its('response')
      .then(
        (response: {
          statusCode: number;
          body: ApplicationCodeGetDetailDto;
        }) => {
          if (response.statusCode !== 200) {
            throw new Error('Application-code fee lookup did not succeed');
          }
          const code = response.body;
          const base = code.feeAmount?.value ?? 0;
          const offsite = code.offsiteFeeAmount?.value;
          if (
            offsite === undefined ||
            ![base, offsite, base + offsite].every(
              (value) => Number.isSafeInteger(value) && value >= 0,
            )
          ) {
            throw new Error('Expected valid fee amounts in integer pence');
          }

          const gbp = new Intl.NumberFormat('en-GB', {
            style: 'currency',
            currency: 'GBP',
          });
          const expected = [
            ['Fee reference', code.feeReference?.trim() || '—'],
            ['Amount', gbp.format(base / 100)],
            ['Off site fee reference', code.offsiteFeeReference?.trim() || '—'],
            ['Off site fee amount', gbp.format(offsite / 100)],
            ['Total fee amount', gbp.format((base + offsite) / 100)],
          ];

          AccordionHelper.within('Civil fee', () => {
            expected.forEach(([key, value]) => {
              SummaryListHelper.verifySummaryListRow(key, value);
            });
          });
        },
      );
  }
}
