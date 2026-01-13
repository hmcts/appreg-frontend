import { DataTable, Then } from '@badeball/cypress-cucumber-preprocessor';

import { TableHelper } from '../../../../support/helper/table/TableHelper';
import { TableSearch } from '../../../../support/helper/table/TableSearch';
import { TableVerification } from '../../../../support/helper/table/TableVerification';

/**
 * Verifies that a table with the given caption is visible
 */
Then('User Should See The Table {string}', (tableCaption: string) => {
  TableHelper.isTableVisible(tableCaption);
});

/**
 * Verifies that the table has at least one row
 */
Then('User Should See Table {string} Has Rows', (tableCaption: string) => {
  TableHelper.hasTableRows(tableCaption);
});

/**
 * Verifies that a row exists in the table with the specified column values
 * Searches across all pages if pagination exists
 */
Then(
  'User Should See Row In Table {string} With Values:',
  (tableCaption: string, dataTable: DataTable) => {
    const rows = dataTable.hashes();

    if (rows.length === 0) {
      throw new Error('DataTable must have at least one row of data');
    }

    // Verify each row in the data table
    for (const row of rows) {
      TableSearch.verifyRowExists(tableCaption, row);
    }
  },
);

/**
 * Verifies that a specific header is NOT sortable
 */
Then(
  'User Should See Table {string} Header {string} Is Not Sortable',
  (tableCaption: string, headerText: string) => {
    TableVerification.verifyHeaderIsNotSortable(tableCaption, headerText);
  },
);

/**
 * Verifies that multiple headers are sortable (comma-separated list)
 */
Then(
  'User Should See Table {string} Has Sortable Headers {string}',
  (tableCaption: string, headers: string) => {
    TableVerification.verifySortableHeaders(tableCaption, headers);
  },
);

/**
 * Verifies the sort order of a table header
 */
Then(
  'User Should See Table {string} Header {string} Has Sort Order {string}',
  (
    tableCaption: string,
    headerText: string,
    sortOrder: 'none' | 'ascending' | 'descending',
  ) => {
    TableVerification.verifyHeaderSortOrder(
      tableCaption,
      headerText,
      sortOrder,
    );
  },
);

/**
 * Verifies that the table is sorted by the specified column in the given order
 */
Then(
  'User Should See Table {string} Column {string} Is Sorted {string}',
  (
    tableCaption: string,
    columnName: string,
    sortOrder: 'ascending' | 'descending',
  ) => {
    TableHelper.getAllColumnValuesAcrossPages(tableCaption, columnName).then(
      (values) => {
        const sorted = [...values].sort((a, b) => a.localeCompare(b));
        if (sortOrder === 'descending') {
          sorted.reverse();
        }
        cy.log(`Actual values: ${JSON.stringify(values)}`);
        cy.log(`Expected sorted: ${JSON.stringify(sorted)}`);
        let mismatchFound = false;
        for (let idx = 0; idx < values.length; idx++) {
          if (values[idx] !== sorted[idx]) {
            cy.log(
              `Mismatch at index ${idx}: actual="${values[idx]}", expected="${sorted[idx]}"`,
            );
            mismatchFound = true;
          }
        }
        if (!mismatchFound) {
          cy.log('No mismatches found, arrays are equal.');
        }
        expect(values).to.deep.equal(sorted);
      },
    );
  },
);

/**
 * Verifies that the table has columns with the specified values (checks all pages)
 */
Then(
  'User Should See Table {string} Column {string} Has Value {string}',
  (tableCaption: string, columnName: string, expectedValue: string) => {
    TableVerification.verifyAllRowsHaveValue(
      tableCaption,
      columnName,
      expectedValue,
    );
  },
);

/**
 * Verifies that the table has columns with the specified values on first page only
 */
Then(
  'User Should See Table {string} Column {string} First Page Has Value {string}',
  (tableCaption: string, columnName: string, expectedValue: string) => {
    TableVerification.verifyFirstPageRowsHaveValue(
      tableCaption,
      columnName,
      expectedValue,
    );
  },
);

/**
 * Verifies that the table has columns with the specified values on first and last pages
 */
Then(
  'User Should See Table {string} Column {string} First And Last Page Has Value {string}',
  (tableCaption: string, columnName: string, expectedValue: string) => {
    TableVerification.verifyFirstAndLastPageRowsHaveValue(
      tableCaption,
      columnName,
      expectedValue,
    );
  },
);

/**
 * Verifies that the table doesnt have columns with any of the specified values
 */
Then(
  'User Should Not See Row In Table {string} With Values:',
  (tableCaption: string, dataTable: DataTable) => {
    const rows = dataTable.hashes();

    if (rows.length === 0) {
      throw new Error('DataTable must have at least one row of data');
    }

    // Verify each row in the data table
    for (const row of rows) {
      TableSearch.hasNoRowWithValues(tableCaption, row);
    }
  },
);
