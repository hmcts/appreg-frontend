/// <reference types="cypress" />
import { TableElement } from '../../pageobjects/generic/table/TableElement';

/**
 * Helper class for table interactions and verifications
 */
export class TableHelper {
  /**
   * Recursively collects all cell values for a given column across all paginated pages
   * @param tableCaption The caption text of the table
   * @param columnName The column name to extract values from
   */
  /**
   * Navigates to the next page if available (for value collection)
   * @private
   */
  private static goToNextPageIfExists(): Cypress.Chainable<boolean> {
    return cy.get('body').then(($body) => {
      const $nextButton = TableHelper.findNextPageButton($body);
      if ($nextButton.length > 0) {
        return cy
          .wrap($nextButton.first())
          .click()
          .then(() => cy.wait(500))
          .then(() => true);
      }
      // Always return Cypress.Chainable<boolean>
      return cy.wrap(false);
    });
  }

  /**
   * Recursively collects all cell values for a given column across all paginated pages
   * @param tableCaption The caption text of the table
   * @param columnName The column name to extract values from
   */
  static getAllColumnValuesAcrossPages(
    tableCaption: string,
    columnName: string,
  ): Cypress.Chainable<string[]> {
    let allValues: string[] = [];

    function collectPage(): Cypress.Chainable<string[]> {
      return TableHelper.getColumnValues(tableCaption, columnName).then(
        (values) => {
          allValues = allValues.concat(values);
          return TableHelper.goToNextPageIfExists().then((hasNext) => {
            if (hasNext) {
              return collectPage();
            }
            return cy.wrap(allValues);
          });
        },
      );
    }

    return collectPage();
  }
  /**
   * Returns all cell values for a given column in a table
   * @param tableCaption The caption text of the table
   * @param columnName The column name to extract values from
   */
  static getColumnValues(
    tableCaption: string,
    columnName: string,
  ): Cypress.Chainable<string[]> {
    return TableElement.getTableHeaders(tableCaption).then(($headers) => {
      const columnIndexMap = TableHelper.buildColumnIndexMap($headers);
      const columnIndex = columnIndexMap[columnName];
      if (columnIndex === undefined) {
        throw new Error(
          `Column "${columnName}" not found in table "${tableCaption}"`,
        );
      }
      return TableElement.getTableRows(tableCaption).then(($rows) => {
        const values: string[] = [];
        $rows.each((_rowIndex: number, row: HTMLElement) => {
          const cellText = Cypress.$(row)
            .find('td, th')
            .eq(columnIndex)
            .text()
            .trim();
          values.push(cellText);
        });
        return values;
      });
    });
  }
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
    return cy.then(() =>
      this.searchWithPagination(caption, columnValues, searchAllPages),
    );
  }

  /**
   * Searches through pages recursively
   * @private
   */
  private static searchWithPagination(
    caption: string,
    columnValues: Record<string, string>,
    searchAllPages: boolean,
    onMatch?: (row: JQuery<HTMLElement>) => Cypress.Chainable<void>,
  ): Cypress.Chainable<boolean> {
    return this.searchInCurrentPage(caption, columnValues, onMatch).then(
      (found) => {
        if (found) {
          return cy.wrap(true);
        }
        return this.navigateToNextPage(
          caption,
          columnValues,
          searchAllPages,
          onMatch,
        );
      },
    );
  }

  /**
   * Searches for matching row in current page
   * @private
   */
  private static searchInCurrentPage(
    caption: string,
    columnValues: Record<string, string>,
    onMatch?: (row: JQuery<HTMLElement>) => Cypress.Chainable<void>,
  ): Cypress.Chainable<boolean> {
    return TableElement.getTableHeaders(caption).then(($headers) => {
      const columnIndexMap = this.buildColumnIndexMap($headers);
      return this.searchRowsInTable(
        caption,
        columnValues,
        columnIndexMap,
        onMatch,
      );
    });
  }

  /**
   * Builds a map of column names to their indices
   * @private
   */
  private static buildColumnIndexMap(
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
   * Searches through table rows for a match
   * @private
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
          this.rowMatchesValues(
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
          .wrap(null)
          .then(() => onMatch(matchedRow as JQuery<HTMLElement>))
          .then(() => true);
      }

      return cy.wrap(Boolean(matchedRow));
    });
  }

  /**
   * Checks if a row matches the expected column values
   * @private
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

      const cellText = $row.find('td, th').eq(columnIndex).text().trim();
      const isExactMatch = cellText === expectedValue;

      if (isExactMatch) {
        cy.log(`✓ Exact match in column "${columnName}": "${cellText}"`);
      } else {
        const caseInsensitiveMatch =
          cellText.toLowerCase() === expectedValue.toLowerCase();
        if (caseInsensitiveMatch) {
          cy.log(
            `⚠ Case-insensitive match in column "${columnName}": expected "${expectedValue}", found "${cellText}"`,
          );
        } else {
          cy.log(
            `✗ Mismatch in column "${columnName}": expected "${expectedValue}", found "${cellText}"`,
          );
          rowMatches = false;
        }
      }
    }

    return rowMatches;
  }

  /**
   * Navigates to the next page if available
   * @private
   */
  private static navigateToNextPage(
    caption: string,
    columnValues: Record<string, string>,
    searchAllPages: boolean,
    onMatch?: (row: JQuery<HTMLElement>) => Cypress.Chainable<void>,
  ): Cypress.Chainable<boolean> {
    return cy.get('body').then(($body) => {
      const $nextButton = this.findNextPageButton($body);

      cy.screenshot(`table-page-${caption}`);

      if ($nextButton.length > 0 && searchAllPages) {
        cy.log('Row not found on current page, checking next page...');
        cy.wrap($nextButton.first()).click();
        cy.wait(500); // Wait for page to load
        return this.searchWithPagination(
          caption,
          columnValues,
          searchAllPages,
          onMatch,
        );
      }
      return cy.wrap(false);
    });
  }

  /**
   * Finds the next page button using multiple selectors
   * @private
   */
  private static findNextPageButton(
    $body: JQuery<HTMLElement>,
  ): JQuery<HTMLElement> {
    let $nextButton = $body.find('a[rel="next"]');
    if ($nextButton.length === 0) {
      $nextButton = $body.find('a:contains("Next")');
    }
    if ($nextButton.length === 0) {
      $nextButton = $body.find('button:contains("Next")');
    }
    return $nextButton;
  }

  /**
   * Verifies that a row exists in the table with the given column values
   * @param caption The caption text of the table
   * @param columnValues Object with column names and expected values
   */
  static verifyRowExists(
    caption: string,
    columnValues: Record<string, string>,
  ): Cypress.Chainable<boolean> {
    const searchCriteria = Object.entries(columnValues)
      .map(([col, val]) => `${col}="${val}"`)
      .join(', ');

    cy.log(`Searching for row in table "${caption}" with: ${searchCriteria}`);

    return this.findRowWithValues(caption, columnValues, true).then((found) => {
      return cy
        .wrap(found)
        .should(
          'be.true',
          `Row should exist in table "${caption}" with values: ${searchCriteria}`,
        )
        .then(() => {
          if (found) {
            return cy
              .log(`✓ Row found with: ${searchCriteria}`)
              .then(() => found);
          }
          return found;
        });
    });
  }

  /**
   * Verifies that a specific header is NOT sortable
   * @param caption The caption text of the table
   * @param headerText The header text to check
   */
  static verifyHeaderIsNotSortable(caption: string, headerText: string): void {
    cy.log(`Verifying header "${headerText}" is NOT sortable`);
    TableElement.findTableByCaption(caption)
      .find('thead th')
      .contains(headerText)
      .closest('th')
      .should('not.have.attr', 'aria-sort');
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

    for (const headerText of sortableHeaders) {
      TableElement.findTableByCaption(caption)
        .find('thead th')
        .contains(headerText)
        .closest('th')
        .should('have.attr', 'aria-sort');
    }
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
    cy.log(
      `Verifying header "${headerText}" has sort order: "${expectedSortOrder}"`,
    );
    TableElement.findTableByCaption(caption)
      .find('thead th')
      .contains(headerText)
      .closest('th')
      .should('have.attr', 'aria-sort', expectedSortOrder);
  }
  /**
   * Verify all rows have a specific value in a given column
   */
  static verifyAllRowsHaveValue(
    tableCaption: string,
    columnName: string,
    expectedValue: string,
  ): Cypress.Chainable<void> {
    function checkRows(columnIndex: number): Cypress.Chainable<void> {
      return TableElement.getTableRows(tableCaption).then(($rows) => {
        $rows.each((_rowIndex: number, row: HTMLElement) => {
          const cellText = Cypress.$(row)
            .find('td, th')
            .eq(columnIndex)
            .text()
            .trim();
          expect(cellText.toLowerCase()).to.equal(expectedValue.toLowerCase());
        });
      });
    }

    function checkPage(): Cypress.Chainable<void> {
      // @ts-expect-error Compile-time suppression
      return TableElement.getTableHeaders(tableCaption)
        .then(($headers) => {
          const columnIndexMap = TableHelper.buildColumnIndexMap($headers);
          const columnIndex = columnIndexMap[columnName];
          if (columnIndex === undefined) {
            throw new Error(
              `Column "${columnName}" not found in table "${tableCaption}"`,
            );
          }
          return checkRows(columnIndex);
        })
        .then(() => TableHelper.goToNextPageIfExists())
        .then((hasNext) => {
          if (hasNext) {
            return checkPage();
          }
          return cy.then(() => { });
        });
    }
    return checkPage();
  }

  /**
   * Clicks a button element (Cypress-wrapped)
   */
  static clickButton(button: JQuery<HTMLElement>): void {
    cy.wrap(button).click();
  }

  /**
   * Selects an option from a menu button within a specific table row identified by column values
   * @param tableCaption The caption text of the table
   * @param columnValues Object with column names and expected values to identify the row
   * @param menuButtonText The menu button text to click
   */
  static clickMenuButtonInTableRow(
    tableCaption: string,
    columnValues: Record<string, string>,
    menuButtonText: string,
    selectButtonText: string,
  ): Cypress.Chainable<void> {
    let clicked = false;
    return TableHelper.searchWithPagination(
      tableCaption,
      columnValues,
      true,
      (row) => {
        clicked = true;
        TableElement.getButtonInRow(row, selectButtonText).then((button) => {
          TableHelper.clickButton(button);
        });
        TableElement.getMenuButtonInRow(row, menuButtonText).then(
          (menuButton) => {
            TableHelper.clickButton(menuButton);
          },
        );
        return cy.then(() => { }) as Cypress.Chainable<void>;
      },
    ).then((found) => {
      if (found && clicked) {
        return;
      }
      throw new Error(
        `Row with specified values not found in table "${tableCaption}" to select menu button "${menuButtonText}"`,
      );
    }) as unknown as Cypress.Chainable<void>;
  }
  /**
   * Finds a row by values (with pagination), clicks a button, and asserts menu options
   */
  static verifyButtonsInTableRow(
    tableCaption: string,
    columnValues: Record<string, string>,
    selectButtonText: string,
    expectedMenuOptions: string[],
  ): Cypress.Chainable<void> {
    let verified = false;
    return TableHelper.searchWithPagination(
      tableCaption,
      columnValues,
      true,
      (row) => {
        TableElement.getButtonInRow(row, selectButtonText).then((button) => {
          TableHelper.clickButton(button);
        });
        cy.log(
          `Expected Menu Options (helper): ${expectedMenuOptions.join(', ')}`,
        );
        expectedMenuOptions.forEach((btnText) => {
          cy.log(`Verifying menu button: ${btnText}`);
          TableElement.getMenuButtonInRow(row, btnText).should('be.visible');
        });
        cy.screenshot('menu-buttons-verified');
        verified = true;
        return cy.then(() => { }) as Cypress.Chainable<void>;
      },
    ).then((found) => {
      if (found && verified) {
        return;
      }
      throw new Error(
        `Row with specified values not found in table "${tableCaption}" to verify menu options: ${expectedMenuOptions.join(', ')}`,
      );
    }) as unknown as Cypress.Chainable<void>;
  }
}
