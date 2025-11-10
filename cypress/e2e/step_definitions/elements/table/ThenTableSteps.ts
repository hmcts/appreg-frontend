import { Then } from '@badeball/cypress-cucumber-preprocessor';
import { TableHelper } from '../../../../support/helper/table/TableHelper';

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
  (tableCaption: string, dataTable: any) => {
    const rows = dataTable.hashes();

    if (rows.length === 0) {
      throw new Error('DataTable must have at least one row of data');
    }

    // Verify each row in the data table
    rows.forEach((row: Record<string, string>) => {
      TableHelper.verifyRowExists(tableCaption, row);
    });
  },
);

/**
 * Verifies that a specific header is NOT sortable
 */
Then(
  'User Should See Table {string} Header {string} Is Not Sortable',
  (tableCaption: string, headerText: string) => {
    TableHelper.verifyHeaderIsNotSortable(tableCaption, headerText);
  },
);

/**
 * Verifies that multiple headers are sortable (comma-separated list)
 */
Then(
  'User Should See Table {string} Has Sortable Headers {string}',
  (tableCaption: string, headers: string) => {
    TableHelper.verifySortableHeaders(tableCaption, headers);
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
    TableHelper.verifyHeaderSortOrder(tableCaption, headerText, sortOrder);
  },
);
