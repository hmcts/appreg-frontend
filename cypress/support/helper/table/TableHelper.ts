/// <reference types="cypress" />
import { TableElement } from '../../pageobjects/generic/table/TableElement';

import { TableNavigation } from './TableNavigation';
import { TableSearch } from './TableSearch';

/**
 * Core table helper for reading table data
 * For other operations, use specialized classes:
 * - TableVerification: verify rows, headers, sort order
 * - TableNavigation: pagination operations
 * - TableSearch: find rows, search with pagination
 * - TableInteraction: click buttons, menu operations
 */
export class TableHelper {
  /**
   * Recursively collects all cell values for a given column across all paginated pages
   * @param tableCaption The caption text of the table
   * @param columnName The name of the column to collect values from
   * @returns Array of all cell values from the column across all pages
   */
  static getAllColumnValuesAcrossPages(
    tableCaption: string,
    columnName: string,
  ): Cypress.Chainable<string[]> {
    let allValues: string[] = [];

    function collectPage(): Cypress.Chainable<string[]> {
      return TableElement.findTable(tableCaption)
        .should('be.visible')
        .then(() => {
          return TableHelper.getColumnValues(tableCaption, columnName);
        })
        .then((values) => {
          allValues = allValues.concat(values);
          return TableNavigation.goToNextPageIfExists().then((hasNext) => {
            if (hasNext) {
              return collectPage();
            }
            return cy.wrap(allValues);
          });
        });
    }

    return collectPage();
  }

  /**
   * Returns all cell values for a given column in a table
   * @param tableCaption The caption text of the table
   * @param columnName The name of the column to get values from
   * @returns Array of cell values from the current page
   */
  static getColumnValues(
    tableCaption: string,
    columnName: string,
  ): Cypress.Chainable<string[]> {
    return TableElement.getTableHeaders(tableCaption).then(($headers) => {
      const columnIndexMap = TableSearch.buildColumnIndexMap($headers);
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
        return cy.wrap(values);
      });
    });
  }

  /**
   * Verifies that a table is visible
   * @param caption The caption text of the table
   */
  static isTableVisible(caption: string): void {
    TableElement.findTable(caption).should('be.visible');
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
}
