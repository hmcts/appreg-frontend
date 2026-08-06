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
   * Retries a boolean condition until it passes or times out.
   * Used for table states that can lag briefly behind the triggering action.
   */
  static retryUntil(
    check: () => Cypress.Chainable<boolean>,
    failureMessage: string,
    timeoutMs: number = 5000,
    intervalMs: number = 250,
  ): Cypress.Chainable<void> {
    const startedAt = Date.now();

    const attempt = (): Cypress.Chainable<void> => {
      return check()
        .then((passed) => {
          if (passed) {
            return false;
          }

          if (Date.now() - startedAt >= timeoutMs) {
            throw new Error(failureMessage);
          }

          return true;
        })
        .then((shouldRetry) => {
          if (!shouldRetry) {
            return undefined;
          }

          return cy
            .wait(intervalMs, { log: false })
            .then(() => attempt())
            .then(() => undefined);
        });
    };

    return attempt();
  }

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
   * @param caption Optional table caption. If not provided, searches first table.
   */
  static findRowWithValues(
    columnValues: Record<string, string>,
    caption?: string,
    searchAllPages: boolean = true,
  ): Cypress.Chainable<boolean> {
    return TableSearch.searchWithPagination(
      columnValues,
      caption,
      searchAllPages,
    );
  }

  /**
   * Searches through pages recursively
   */
  static searchWithPagination(
    columnValues: Record<string, string>,
    caption?: string,
    searchAllPages: boolean = true,
    onMatch?: (row: JQuery<HTMLElement>) => Cypress.Chainable<void>,
  ): Cypress.Chainable<boolean> {
    return TableSearch.searchInCurrentPage(columnValues, caption, onMatch).then(
      (found) => {
        if (found) {
          return cy.wrap(true);
        }
        if (!searchAllPages) {
          return cy.wrap(false);
        }
        cy.screenshot(`table-page-${caption || 'table'}`);
        return TableNavigation.goToNextPageIfExists().then((hasNext) => {
          if (hasNext) {
            cy.log('Row not found on current page, checking next page...');
            return TableSearch.searchWithPagination(
              columnValues,
              caption,
              searchAllPages,
              onMatch,
            );
          }
          return cy.wrap(false);
        });
      },
    );
  }

  static findRowElementWithPagination(
    columnValues: Record<string, string>,
    caption?: string,
    searchAllPages: boolean = true,
  ): Cypress.Chainable<JQuery<HTMLElement> | null> {
    return TableSearch.findRowElementInCurrentPage(columnValues, caption).then(
      (matchedRow) => {
        if (matchedRow) {
          return cy.wrap(matchedRow, { log: false });
        }

        if (!searchAllPages) {
          return cy.wrap(null, { log: false });
        }

        return TableNavigation.goToNextPageIfExists().then((hasNext) => {
          if (!hasNext) {
            return cy.wrap(null, { log: false });
          }

          cy.log('Row not found on current page, checking next page...');
          return TableSearch.findRowElementWithPagination(
            columnValues,
            caption,
            searchAllPages,
          );
        });
      },
    );
  }

  /**
   * Searches for matching row in current page
   */
  private static searchInCurrentPage(
    columnValues: Record<string, string>,
    caption?: string,
    onMatch?: (row: JQuery<HTMLElement>) => Cypress.Chainable<void>,
  ): Cypress.Chainable<boolean> {
    return TableElement.getTableHeaders(caption).then(($headers) => {
      const columnIndexMap = TableSearch.buildColumnIndexMap($headers);
      return TableSearch.searchRowsInTable(
        columnValues,
        caption,
        columnIndexMap,
        onMatch,
      );
    });
  }

  private static findRowElementInCurrentPage(
    columnValues: Record<string, string>,
    caption?: string,
  ): Cypress.Chainable<JQuery<HTMLElement> | null> {
    return TableElement.getTableHeaders(caption).then(($headers) => {
      const columnIndexMap = TableSearch.buildColumnIndexMap($headers);

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
            return false;
          }

          return undefined;
        });

        return cy.wrap(matchedRow, { log: false });
      });
    });
  }

  /**
   * Searches through table rows for a match
   */
  private static searchRowsInTable(
    columnValues: Record<string, string>,
    caption: string | undefined,
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

        return undefined;
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
    caption?: string,
  ): boolean {
    let rowMatches = true;

    for (const [columnName, expectedValue] of Object.entries(columnValues)) {
      const columnIndex = columnIndexMap[columnName];
      if (columnIndex === undefined) {
        const tableRef = caption ? `table "${caption}"` : 'table';
        throw new Error(`Column "${columnName}" not found in ${tableRef}`);
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
   * @param columnValues The column values to search for
   * @param caption Optional table caption. If not provided, searches first table.
   */
  static verifyRowExists(
    columnValues: Record<string, string>,
    caption?: string,
  ): Cypress.Chainable<boolean> {
    const searchCriteria = Object.entries(columnValues)
      .map(([col, val]) => `${col}="${val}"`)
      .join(', ');

    const tableRef = caption ? `table "${caption}"` : 'table';
    cy.log(`Searching for row in ${tableRef} with: ${searchCriteria}`);

    return TableSearch.findRowWithValues(columnValues, caption, true).then(
      (found) => {
        if (found) {
          cy.log(`✓ Row found with: ${searchCriteria}`);
        }
        return cy
          .wrap(found)
          .should(
            'be.true',
            `Row should exist in ${tableRef} with values: ${searchCriteria}`,
          );
      },
    );
  }

  /**
   * Verifies that no row exists in the table with the specified values
   * @param columnValues The column values to check
   * @param caption Optional table caption. If not provided, searches first table.
   */
  static hasNoRowWithValues(
    columnValues: Record<string, string>,
    caption?: string,
  ): Cypress.Chainable<void> {
    const searchCriteria = Object.entries(columnValues)
      .map(([col, val]) => `${col}="${val}"`)
      .join(', ');

    const tableRef = caption ? `table "${caption}"` : 'table';
    cy.log(`Verifying NO row exists in ${tableRef} with: ${searchCriteria}`);

    // Search results can briefly show stale rows after actions like delete.
    // Poll until the row disappears, then do one final check for a clear error.
    return TableSearch.retryUntil(
      () =>
        TableSearch.findRowWithValues(columnValues, caption, true).then(
          (found) => !found,
        ),
      `✗ Unexpected row found in ${tableRef} with values: ${searchCriteria}`,
    ).then(() => {
      cy.log(`✓ No row found with: ${searchCriteria}`);
      return TableSearch.findRowWithValues(columnValues, caption, true).then(
        (found) => {
          if (!found) {
            return;
          }
          throw new Error(
            `✗ Unexpected row found in ${tableRef} with values: ${searchCriteria}`,
          );
        },
      );
    }) as unknown as Cypress.Chainable<void>;
  }
}
