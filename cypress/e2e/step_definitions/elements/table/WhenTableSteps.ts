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
