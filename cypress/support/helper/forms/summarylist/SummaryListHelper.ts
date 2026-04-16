import { SummaryListElement } from '../../../pageobjects/generic/summarylist/SummaryListElement';

export class SummaryListHelper {
  static verifySummaryListRow(key: string, value: string): void {
    SummaryListElement.findSummaryListRows()
      .contains('.govuk-summary-list__key', key)
      .parent()
      .find('.govuk-summary-list__value')
      .should('contain.text', value);
  }
}
