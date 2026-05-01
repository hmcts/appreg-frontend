/// <reference types="cypress" />
import { TableElement } from '../../pageobjects/generic/table/TableElement';
import { DateTimeUtil } from '../../utils/DateTimeUtil';
import { TestDataGenerator } from '../../utils/TestDataGenerator';

import { TableNavigation } from './TableNavigation';
import { TableSearch } from './TableSearch';

/**
 * Handles table verification and assertion logic
 */
export class TableVerification {
  /**
   * Checks rows on current page match expected value
   */
  private static verifyRowsOnCurrentPage(
    tableCaption: string,
    columnIndex: number,
    expectedValue: string,
  ): Cypress.Chainable<void> {
    return TableElement.getTableRows(tableCaption).then(($rows) => {
      $rows.each((_rowIndex: number, row: HTMLElement) => {
        const cellText = Cypress.$(row)
          .find('td, th')
          .eq(columnIndex)
          .text()
          .trim();
        expect(cellText.toLowerCase()).to.equal(expectedValue.toLowerCase());
      });
    }) as unknown as Cypress.Chainable<void>;
  }

  /**
   * Verifies all rows in a column have a specific value on the first page only
   */
  static verifyFirstPageRowsHaveValue(
    tableCaption: string,
    columnName: string,
    expectedValue: string,
  ): Cypress.Chainable<void> {
    const parsedExpectedValue = TestDataGenerator.parseValue(expectedValue);

    cy.log(
      `Verifying all rows on first page in column "${columnName}" have value: "${parsedExpectedValue}"`,
    );

    return TableElement.getTableHeaders(tableCaption).then(($headers) => {
      const columnIndexMap = TableSearch.buildColumnIndexMap($headers);
      const columnIndex = columnIndexMap[columnName];
      if (columnIndex === undefined) {
        throw new Error(
          `Column "${columnName}" not found in table "${tableCaption}"`,
        );
      }
      return TableVerification.verifyRowsOnCurrentPage(
        tableCaption,
        columnIndex,
        parsedExpectedValue,
      );
    });
  }

  /**
   * Verifies all rows in a column have a specific value on first and last pages only
   */
  static verifyFirstAndLastPageRowsHaveValue(
    tableCaption: string,
    columnName: string,
    expectedValue: string,
  ): Cypress.Chainable<void> {
    const parsedExpectedValue = TestDataGenerator.parseValue(expectedValue);

    cy.log(
      `Verifying rows on first and last pages in column "${columnName}" have value: "${parsedExpectedValue}"`,
    );

    return TableElement.getTableHeaders(tableCaption).then(($headers) => {
      const columnIndexMap = TableSearch.buildColumnIndexMap($headers);
      const columnIndex = columnIndexMap[columnName];
      if (columnIndex === undefined) {
        throw new Error(
          `Column "${columnName}" not found in table "${tableCaption}"`,
        );
      }
      cy.log('Checking first page...');
      return TableVerification.verifyRowsOnCurrentPage(
        tableCaption,
        columnIndex,
        parsedExpectedValue,
      )
        .then(() => TableNavigation.navigateToLastPage())
        .then((hasMultiplePages) => {
          if (hasMultiplePages) {
            cy.log('Checking last page...');
            return TableVerification.verifyRowsOnCurrentPage(
              tableCaption,
              columnIndex,
              parsedExpectedValue,
            );
          }
          cy.log('Single page table - first page check is sufficient');
        });
    }) as unknown as Cypress.Chainable<void>;
  }

  /**
   * Verifies all rows in a column have a specific value across all pages
   */
  static verifyAllRowsHaveValue(
    tableCaption: string,
    columnName: string,
    expectedValue: string,
  ): Cypress.Chainable<void> {
    const parsedExpectedValue = TestDataGenerator.parseValue(expectedValue);

    cy.log(
      `Verifying all rows in column "${columnName}" have value: "${parsedExpectedValue}"`,
    );

    function checkPage(columnIndex: number): Cypress.Chainable<void> {
      return TableVerification.verifyRowsOnCurrentPage(
        tableCaption,
        columnIndex,
        parsedExpectedValue,
      )
        .then(() => TableNavigation.goToNextPageIfExists())
        .then((hasNext) => {
          if (hasNext) {
            return checkPage(columnIndex);
          }
        }) as unknown as Cypress.Chainable<void>;
    }

    return TableElement.getTableHeaders(tableCaption).then(($headers) => {
      const columnIndexMap = TableSearch.buildColumnIndexMap($headers);
      const columnIndex = columnIndexMap[columnName];
      if (columnIndex === undefined) {
        throw new Error(
          `Column "${columnName}" not found in table "${tableCaption}"`,
        );
      }
      return checkPage(columnIndex);
    });
  }

  /**
   * Verifies that a specific header is NOT sortable
   */
  static verifyHeaderIsNotSortable(caption: string, headerText: string): void {
    cy.log(`Verifying header "${headerText}" is NOT sortable`);
    TableElement.findTable(caption)
      .find('thead th')
      .contains(headerText)
      .closest('th')
      .should('not.have.attr', 'aria-sort');
  }

  /**
   * Verifies that specific headers are sortable (comma-separated list)
   */
  static verifySortableHeaders(caption: string, headers: string): void {
    const sortableHeaders = headers.split(',').map((h) => h.trim());

    cy.log(
      `Verifying ${sortableHeaders.length} headers are sortable: ${sortableHeaders.join(', ')}`,
    );

    for (const headerText of sortableHeaders) {
      TableElement.findTable(caption)
        .find('thead th')
        .contains(headerText)
        .closest('th')
        .should('have.attr', 'aria-sort');
    }
  }

  /**
   * Verifies the sort order of a table header
   */
  static verifyHeaderSortOrder(
    caption: string,
    headerText: string,
    expectedSortOrder: 'none' | 'ascending' | 'descending',
  ): void {
    cy.log(
      `Verifying header "${headerText}" has sort order: "${expectedSortOrder}"`,
    );
    TableElement.findTable(caption)
      .find('thead th')
      .contains(headerText)
      .closest('th')
      .should('have.attr', 'aria-sort', expectedSortOrder);
  }

  /**
   * Verifies that a table column is sorted in the specified order
   * Handles both string and date column sorting with pagination support
   */
  static verifyColumnIsSorted(
    tableCaption: string,
    columnName: string,
    sortOrder: 'ascending' | 'descending',
    columnValues: string[],
  ): void {
    cy.log(
      `Verifying column "${columnName}" is sorted ${sortOrder} (${columnValues.length} values)`,
    );

    const nonEmptyValues = columnValues.filter((v) => v && v.trim() !== '');

    const isDateColumn =
      columnName.toLowerCase() === 'date' ||
      nonEmptyValues.some((v) => /^\d{1,2}\s+\w{3}\s+\d{4}$/.test(v));

    let sorted: string[];
    if (isDateColumn) {
      sorted = [...nonEmptyValues].sort((a, b) => {
        const dateA = DateTimeUtil.parseDate(a);
        const dateB = DateTimeUtil.parseDate(b);
        return dateA.getTime() - dateB.getTime();
      });
    } else {
      sorted = [...nonEmptyValues].sort((a, b) => a.localeCompare(b));
    }

    if (sortOrder === 'descending') {
      sorted.reverse();
    }

    for (let idx = 0; idx < Math.min(nonEmptyValues.length, 5); idx++) {
      if (nonEmptyValues[idx] !== sorted[idx]) {
        cy.log(
          `Mismatch at index ${idx}: actual="${nonEmptyValues[idx]}", expected="${sorted[idx]}"`,
        );
      }
    }

    expect(
      nonEmptyValues,
      `Column "${columnName}" should be sorted ${sortOrder}`,
    ).to.deep.equal(sorted);
  }

  /**
   * Verifies that a checkbox in the first column is checked for a specific row
   */
  static verifyCheckboxInRowIsChecked(
    tableCaption: string,
    rowData: { [key: string]: string },
  ): void {
    cy.log(
      `Verifying checkbox in first column is checked for row with data: ${JSON.stringify(
        rowData,
      )}`,
    );

    TableSearch.searchWithPagination(
      rowData,
      undefined,
      true,
      (row) => {
        return cy.wrap(row)
          .find('td')
          .first()
          .find('input[type="checkbox"]')
          .should('be.checked') as unknown as Cypress.Chainable<void>;
      },
    );
  }
}
