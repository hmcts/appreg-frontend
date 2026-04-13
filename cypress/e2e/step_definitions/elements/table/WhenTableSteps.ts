import { When } from '@badeball/cypress-cucumber-preprocessor';

import { TableInteraction } from '../../../../support/helper/table/TableInteraction';

/**
 * Table Interaction Steps (Sorting & Row Actions)
 * Handles clicking table headers for sorting and row menu actions
 */

/**
 * Clicks on a table header to trigger sorting
 */
When(
  'User Clicks On Table Header {string} In Table {string}',
  (headerText: string, tableCaption: string) => {
    TableInteraction.clickTableHeader(tableCaption, headerText);
    cy.screenshot(`clicked-header-${headerText}`);
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
    TableInteraction.clickMenuButtonInTableRow(
      tableCaption,
      rowData,
      menuButtonText,
      selectButtonText,
    );
    cy.screenshot(`clicked-menu-${selectButtonText}-in-row`);
  },
);

When(
  'User Clicks {string} Then {string} From Caption Menu In Table {string}',
  (toggleButtonText: string, menuItemText: string, tableCaption: string) => {
    TableInteraction.clickCaptionMenuButton(
      tableCaption,
      toggleButtonText,
      menuItemText,
    );
    cy.screenshot(`clicked-caption-menu-${menuItemText}-in-${tableCaption}`);
  },
);

When(
  'User Clicks {string} In Row Of Table {string} And Verify Menu Options {string}',
  (
    selectButtonText: string,
    tableCaption: string,
    menuOptions: string,
    dataTable: { hashes: () => { [key: string]: string }[] },
  ) => {
    const rows = dataTable.hashes();
    if (rows.length === 0) {
      throw new Error('DataTable must have at least one row of data');
    }
    const rowData = rows[0];
    cy.log(`rowData: ${JSON.stringify(rowData)}`);
    const expectedMenuOptions = menuOptions
      ? menuOptions.split(',').map((opt: string) => opt.trim())
      : [];
    cy.log(`Expected Menu Options (step): ${expectedMenuOptions.join(', ')}`);
    TableInteraction.verifyButtonsInTableRow(
      tableCaption,
      rowData,
      selectButtonText,
      expectedMenuOptions,
    );
    cy.screenshot(`verify-menu-options-${selectButtonText}-in-row`);
  },
);
