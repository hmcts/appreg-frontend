import { TableElement } from '../../pageobjects/generic/table/TableElement';
import { TestDataGenerator } from '../../utils/TestDataGenerator';

export class SummaryTableHelper {
  static verifySummaryTableContains(
    tableCaption: string,
    expectedRows: Record<string, string>,
  ): void {
    const normalise = (value: string) => value.replaceAll('\u00a0', ' ').trim();

    TableElement.findTable(tableCaption)
      .should('be.visible')
      .within(() => {
        Object.entries(expectedRows).forEach(([label, expectedValue]) => {
          const resolvedExpectedValue =
            TestDataGenerator.parseValue(expectedValue);

          cy.contains('tr', label)
            .find('td')
            .should(($cell) => {
              expect(normalise($cell.text())).to.contain(
                normalise(resolvedExpectedValue),
              );
            });
        });
      });
  }
}
