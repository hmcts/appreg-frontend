import { SummaryListElement } from '../../../pageobjects/generic/summarylist/SummaryListElement';
import { ComparisonUtils } from '../../../utils/ComparisonUtils';

export class SummaryListHelper {
  static verifySummaryListRow(
    key: string,
    value: string,
    resolvedTimeValue?: string,
  ): void {
    const summaryValue = SummaryListElement.findSummaryListRows()
      .contains('.govuk-summary-list__key', key)
      .parent()
      .find('.govuk-summary-list__value');

    if (resolvedTimeValue) {
      summaryValue.should(($summaryValue) => {
        const actualValue = $summaryValue.text().trim();

        expect(
          ComparisonUtils.textContainsTimeWithTolerance(
            actualValue,
            resolvedTimeValue,
            2,
          ),
        ).to.equal(
          true,
          `expected "${actualValue}" to contain a time within 2 minutes of "${resolvedTimeValue}"`,
        );
      });
      return;
    }

    summaryValue.should('contain.text', value);
  }
}
