import { When } from '@badeball/cypress-cucumber-preprocessor';

import { TableHelper } from '../../../../support/helper/table/TableHelper';

/**
 * Clicks on a table header to trigger sorting
 */
When(
  'User Clicks On Table Header {string} In Table {string}',
  (headerText: string, tableCaption: string) => {
    TableHelper.clickTableHeader(tableCaption, headerText);
  },
);

When(
  'User Clicks {string} Then {string} From Menu In Row Of Table {string} With:',
  (
    selectButtonText: string,
    menuButtonText: string,
    tableCaption: string,
    dataTable: { hashes: () => { [key: string]: string }[] },
  ) => {
    const rows = dataTable.hashes();
    if (rows.length === 0) {
      throw new Error('DataTable must have at least one row of data');
    }
    const rowData = rows[0];
  TableHelper.clickMenuButtonInTableRow(tableCaption, rowData, menuButtonText, selectButtonText);
  }
);