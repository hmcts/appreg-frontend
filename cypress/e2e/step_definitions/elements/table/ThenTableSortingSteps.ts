import { Then } from '@badeball/cypress-cucumber-preprocessor';

import { TableHelper } from '../../../../support/helper/table/TableHelper';
import { TableVerification } from '../../../../support/helper/table/TableVerification';

/**
 * Table Sorting Verification Steps
 * Handles verifications related to table sorting functionality
 */

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
 * Handles both string and date column sorting with pagination support
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
        TableVerification.verifyColumnIsSorted(
          tableCaption,
          columnName,
          sortOrder,
          values,
        );
      },
    );
  },
);
