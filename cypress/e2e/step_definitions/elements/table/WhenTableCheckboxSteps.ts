import { When } from '@badeball/cypress-cucumber-preprocessor';

import { TableInteraction } from '../../../../support/helper/table/TableInteraction';

/**
 * Table Checkbox Action Steps
 * Handles checkbox interactions in tables (row checkboxes and select-all)
 */

/**
 * Checks individual row checkboxes based on matching column values
 * Can check multiple rows if multiple data rows provided
 */
When(
  'User Checks The Checkbox In Row Of Table {string} With:',
  (
    tableName: string,
    dataTable: { hashes: () => { [key: string]: string }[] },
  ) => {
    const rows = dataTable.hashes();
    if (rows.length === 0) {
      throw new Error('DataTable must have at least one row of data');
    }

    // Loop through all rows to check multiple checkboxes
    rows.forEach((rowData, index) => {
      TableInteraction.checkCheckboxInTableRow(tableName, rowData);
      cy.screenshot(`checked-checkbox-in-row-${index + 1}`);
    });
  },
);

/**
 * Checks the "Select all" checkbox in the table header to select all rows
 */
When('User Checks The Select All Checkbox In Table {string}', () => {
  TableInteraction.checkSelectAllCheckbox();
  cy.screenshot('checked-select-all-checkbox');
});
