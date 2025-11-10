import { TableElement } from '../../pageobjects/generic/table/TableElement';

/**
 * Helper class for table interactions and verifications
 */
export class TableHelper {
  /**
   * Verifies that a table is visible
   * @param caption The caption text of the table
   */
  static isTableVisible(caption: string): void {
    TableElement.findTableByCaption(caption).should('be.visible');
  }

  /**
   * Verifies that the table has rows
   * @param caption The caption text of the table
   */
  static hasTableRows(caption: string): void {
    TableElement.getTableRows(caption)
      .should('exist')
      .and('have.length.greaterThan', 0);
  }

  /**
   * Finds a row in the table that matches the given column values (searches across pagination)
   * @param caption The caption text of the table
   * @param columnValues Object with column names and expected values
   * @param searchAllPages Whether to search across pagination (default: true)
   * @returns True if row is found, false otherwise
   */
  static findRowWithValues(
    caption: string,
    columnValues: Record<string, string>,
    searchAllPages: boolean = true,
  ): Cypress.Chainable<boolean> {
    return cy.then(() => {
      const searchInCurrentPage = (): Cypress.Chainable<boolean> => {
        return TableElement.getTableHeaders(caption).then(($headers) => {
          // Build column index map
          const columnIndexMap: Record<string, number> = {};
          $headers.each((index: number, header: HTMLElement) => {
            const headerText = Cypress.$(header).text().trim();
            columnIndexMap[headerText] = index;
          });

          // Search for matching row
          return TableElement.getTableRows(caption).then(($rows) => {
            let found = false;

            $rows.each((_rowIndex: number, row: HTMLElement) => {
              const $row = Cypress.$(row);
              let rowMatches = true;
              const rowData: Record<string, string> = {};

              // Check if all specified columns match
              Object.entries(columnValues).forEach(
                ([columnName, expectedValue]) => {
                  const columnIndex = columnIndexMap[columnName];
                  if (columnIndex === undefined) {
                    throw new Error(
                      `Column "${columnName}" not found in table "${caption}"`,
                    );
                  }

                  const cellText = $row
                    .find('td, th')
                    .eq(columnIndex)
                    .text()
                    .trim();
                  rowData[columnName] = cellText;

                  // Try exact match first
                  let isMatch = cellText === expectedValue;

                  if (isMatch) {
                    cy.log(
                      `✓ Exact match in column "${columnName}": "${cellText}"`,
                    );
                  } else {
                    // Try case-insensitive match as fallback
                    const caseInsensitiveMatch =
                      cellText.toLowerCase() === expectedValue.toLowerCase();
                    if (caseInsensitiveMatch) {
                      cy.log(
                        `⚠ Case-insensitive match in column "${columnName}": expected "${expectedValue}", found "${cellText}"`,
                      );
                      isMatch = true;
                    } else {
                      cy.log(
                        `✗ Mismatch in column "${columnName}": expected "${expectedValue}", found "${cellText}"`,
                      );
                      rowMatches = false;
                    }
                  }
                },
              );

              if (rowMatches) {
                found = true;
                return false; // break the loop
              }
            });

            return cy.wrap(found);
          });
        });
      };

      const searchWithPagination = (): Cypress.Chainable<boolean> => {
        return searchInCurrentPage().then((found) => {
          if (found) {
            return cy.wrap(true);
          }

          // Check if next page button exists (try multiple common selectors)
          return cy.get('body').then(($body) => {
            let $nextButton = $body.find('a[rel="next"]');

            if ($nextButton.length === 0) {
              $nextButton = $body.find('a:contains("Next")');
            }

            if ($nextButton.length === 0) {
              $nextButton = $body.find('button:contains("Next")');
            }

            if ($nextButton.length > 0 && searchAllPages) {
              cy.log('Row not found on current page, checking next page...');
              cy.wrap($nextButton.first()).click();
              cy.wait(500); // Wait for page to load
              return searchWithPagination(); // Recursive search
            } else {
              return cy.wrap(false);
            }
          });
        });
      };

      return searchWithPagination();
    });
  }

  /**
   * Verifies that a row exists in the table with the given column values
   * @param caption The caption text of the table
   * @param columnValues Object with column names and expected values
   */
  static verifyRowExists(
    caption: string,
    columnValues: Record<string, string>,
  ): void {
    const searchCriteria = Object.entries(columnValues)
      .map(([col, val]) => `${col}="${val}"`)
      .join(', ');

    cy.log(`Searching for row in table "${caption}" with: ${searchCriteria}`);

    this.findRowWithValues(caption, columnValues, true).then((found) => {
      expect(
        found,
        `Row should exist in table "${caption}" with values: ${searchCriteria}`,
      ).to.be.true;

      if (found) {
        cy.log(`✓ Row found with: ${searchCriteria}`);
      }
    });
  }

  /**
   * Verifies that a specific header is NOT sortable
   * @param caption The caption text of the table
   * @param headerText The header text to check
   */
  static verifyHeaderIsNotSortable(caption: string, headerText: string): void {
    TableElement.findTableByCaption(caption)
      .find('thead th')
      .contains(headerText)
      .closest('th')
      .should('not.have.attr', 'aria-sort')
      .then(() => {
        cy.log(`✓ Header "${headerText}" is NOT sortable`);
      });
  }

  /**
   * Verifies that specific headers are sortable (comma-separated list)
   * @param caption The caption text of the table
   * @param headers Comma-separated string of sortable headers
   */
  static verifySortableHeaders(caption: string, headers: string): void {
    const sortableHeaders = headers.split(',').map((h) => h.trim());

    cy.log(
      `Verifying ${sortableHeaders.length} headers are sortable: ${sortableHeaders.join(', ')}`,
    );

    sortableHeaders.forEach((headerText) => {
      TableElement.findTableByCaption(caption)
        .find('thead th')
        .contains(headerText)
        .closest('th')
        .should('have.attr', 'aria-sort')
        .then(($th) => {
          const ariaSort = Cypress.$($th).attr('aria-sort');
          cy.log(`✓ "${headerText}" is sortable (aria-sort="${ariaSort}")`);
        });
    });
  }

  /**
   * Clicks on a table header to trigger sorting
   * @param caption The caption text of the table
   * @param headerText The header text to click
   */
  static clickTableHeader(caption: string, headerText: string): void {
    cy.log(`Clicking on table header "${headerText}" in table "${caption}"`);

    TableElement.findTableByCaption(caption)
      .find('thead th')
      .contains(headerText)
      .closest('th')
      .find('button')
      .click();

    cy.wait(500); // Wait for sort to apply
  }

  /**
   * Verifies the sort order of a table header
   * @param caption The caption text of the table
   * @param headerText The header text to check
   * @param expectedSortOrder Expected sort order: 'none', 'ascending', or 'descending'
   */
  static verifyHeaderSortOrder(
    caption: string,
    headerText: string,
    expectedSortOrder: 'none' | 'ascending' | 'descending',
  ): void {
    TableElement.findTableByCaption(caption)
      .find('thead th')
      .contains(headerText)
      .closest('th')
      .should('have.attr', 'aria-sort', expectedSortOrder)
      .then(() => {
        cy.log(
          `✓ Header "${headerText}" has sort order: "${expectedSortOrder}"`,
        );
      });
  }
}
