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
      TableSearch.verifyRowExists(row, tableCaption);
      cy.screenshot(
        `table-row-${tableCaption}-${Object.values(row).join('-')}`,
      );
    }
  },
);

/**
 * Verifies that a row exists in any table (without caption) with the specified column values
 */
Then('User Should See Row In Table With Values:', (dataTable: DataTable) => {
  const rows = dataTable.hashes();

  if (rows.length === 0) {
    throw new Error('DataTable must have at least one row of data');
  }

  // Verify each row in the data table
  for (const row of rows) {
    TableSearch.verifyRowExists(row);
    cy.screenshot(`table-row-${Object.values(row).join('-')}`);
  }
});

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
      TableSearch.hasNoRowWithValues(row, tableCaption);
    }
  },
);
