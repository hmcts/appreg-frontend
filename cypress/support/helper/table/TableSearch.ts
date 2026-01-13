/// <reference types="cypress" />
import { TableElement } from '../../pageobjects/generic/table/TableElement';
import { ComparisonUtils } from '../../utils/ComparisonUtils';
import { TestDataGenerator } from '../../utils/TestDataGenerator';

import { TableNavigation } from './TableNavigation';

/**
 * Handles table search and row finding operations
 */
export class TableSearch {
  /**
   * Builds a map of column names to their indices
   */
  static buildColumnIndexMap(
    $headers: JQuery<HTMLElement>,
  ): Record<string, number> {
    const columnIndexMap: Record<string, number> = {};
    $headers.each((index: number, header: HTMLElement) => {
      const headerText = Cypress.$(header).text().trim();
      columnIndexMap[headerText] = index;
    });
    return columnIndexMap;
  }

  /**
   * Finds a row in the table that matches the given column values
   */
  static findRowWithValues(
    caption: string,
    columnValues: Record<string, string>,
    searchAllPages: boolean = true,
  ): Cypress.Chainable<boolean> {
    return TableSearch.searchWithPagination(caption, columnValues, searchAllPages);
  }

  /**
   * Searches through pages recursively
   */
  static searchWithPagination(
    caption: string,
    columnValues: Record<string, string>,
    searchAllPages: boolean,
    onMatch?: (row: JQuery<HTMLElement>) => Cypress.Chainable<void>,
  ): Cypress.Chainable<boolean> {
    return TableSearch.searchInCurrentPage(caption, columnValues, onMatch).then(
      (found) => {
        if (found) {
          return cy.wrap(true);
        }
        if (!searchAllPages) {
          return cy.wrap(false);
        }
        cy.screenshot(`table-page-${caption}`);
        return TableNavigation.goToNextPageIfExists().then((hasNext) => {
          if (hasNext) {
            cy.log('Row not found on current page, checking next page...');
            return TableSearch.searchWithPagination(
              caption,
              columnValues,
              searchAllPages,
              onMatch,
            );
          }
          return cy.wrap(false);
        });
      },
    );
  }

  /**
   * Searches for matching row in current page
   */
  private static searchInCurrentPage(
    caption: string,
    columnValues: Record<string, string>,
    onMatch?: (row: JQuery<HTMLElement>) => Cypress.Chainable<void>,
  ): Cypress.Chainable<boolean> {
    return TableElement.getTableHeaders(caption).then(($headers) => {
      const columnIndexMap = TableSearch.buildColumnIndexMap($headers);
      return TableSearch.searchRowsInTable(
        caption,
        columnValues,
        columnIndexMap,
        onMatch,
      );
    });
  }

  /**
   * Searches through table rows for a match
   */
  private static searchRowsInTable(
    caption: string,
    columnValues: Record<string, string>,
    columnIndexMap: Record<string, number>,
    onMatch?: (row: JQuery<HTMLElement>) => Cypress.Chainable<void>,
  ): Cypress.Chainable<boolean> {
    return TableElement.getTableRows(caption).then(($rows) => {
      let matchedRow: JQuery<HTMLElement> | null = null;

      $rows.each((_rowIndex: number, row: HTMLElement) => {
        if (
          TableSearch.rowMatchesValues(
            Cypress.$(row),
            columnValues,
            columnIndexMap,
            caption,
          )
        ) {
          matchedRow = Cypress.$(row);
          return false; // break the loop
        }
      });

      if (matchedRow && onMatch) {
        return cy
          .wrap(undefined)
          .then(() => onMatch(matchedRow as JQuery<HTMLElement>))
          .then(() => true);
      }

      return cy.wrap(Boolean(matchedRow));
    });
  }

  /**
   * Checks if a row matches the expected column values
   */
  private static rowMatchesValues(
    $row: JQuery<HTMLElement>,
    columnValues: Record<string, string>,
    columnIndexMap: Record<string, number>,
    caption: string,
  ): boolean {
    let rowMatches = true;

    for (const [columnName, expectedValue] of Object.entries(columnValues)) {
      const columnIndex = columnIndexMap[columnName];
      if (columnIndex === undefined) {
        throw new Error(
          `Column "${columnName}" not found in table "${caption}"`,
        );
      }

      const parsedExpectedValue = TestDataGenerator.parseValue(expectedValue);
      const cellText = $row.find('td, th').eq(columnIndex).text().trim();

      const matchResult = ComparisonUtils.matchesWithTolerance(
        cellText,
        parsedExpectedValue,
        2,
      );

      if (matchResult.matches) {
        switch (matchResult.matchType) {
          case 'exact':
            cy.log(`✓ Exact match in column "${columnName}": "${cellText}"`);
            break;
          case 'time-tolerance':
            cy.log(
              `✓ Time match within tolerance in column "${columnName}": expected "${parsedExpectedValue}", found "${cellText}"`,
            );
            break;
          case 'case-insensitive':
            cy.log(
              `⚠ Case-insensitive match in column "${columnName}": expected "${parsedExpectedValue}", found "${cellText}"`,
            );
            break;
        }
      } else {
        cy.log(
          `✗ Mismatch in column "${columnName}": expected "${parsedExpectedValue}" (from "${expectedValue}"), found "${cellText}"`,
        );
        rowMatches = false;
      }
    }

    return rowMatches;
  }

  /**
   * Verifies that a row exists in the table with the given column values
   */
  static verifyRowExists(
    caption: string,
    columnValues: Record<string, string>,
  ): Cypress.Chainable<boolean> {
    const searchCriteria = Object.entries(columnValues)
      .map(([col, val]) => `${col}="${val}"`)
      .join(', ');

    cy.log(`Searching for row in table "${caption}" with: ${searchCriteria}`);

    return TableSearch.findRowWithValues(caption, columnValues, true).then(
      (found) => {
        if (found) {
          cy.log(`✓ Row found with: ${searchCriteria}`);
        }
        return cy
          .wrap(found)
          .should(
            'be.true',
            `Row should exist in table "${caption}" with values: ${searchCriteria}`,
          );
      },
    );
  }

  /**
   * Verifies that no row exists in the table with the specified values
   */
  static hasNoRowWithValues(
    caption: string,
    columnValues: Record<string, string>,
  ): Cypress.Chainable<void> {
    const searchCriteria = Object.entries(columnValues)
      .map(([col, val]) => `${col}="${val}"`)
      .join(', ');

    cy.log(
      `Verifying NO row exists in table "${caption}" with: ${searchCriteria}`,
    );

    return (TableSearch.findRowWithValues(caption, columnValues, true).then(
      (found) => {
        if (!found) {
          cy.log(`✓ No row found with: ${searchCriteria}`);
          return;
        }
        throw new Error(
          `✗ Unexpected row found in table "${caption}" with values: ${searchCriteria}`,
        );
      },
    )) as unknown as Cypress.Chainable<void>;
  }
}
