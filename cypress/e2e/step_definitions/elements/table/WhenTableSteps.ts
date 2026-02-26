import { When } from '@badeball/cypress-cucumber-preprocessor';

import { TableInteraction } from '../../../../support/helper/table/TableInteraction';
import { TableNavigation } from '../../../../support/helper/table/TableNavigation';

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

/**
 * Navigates to the first page of a paginated table
 */
When('User Goes To First Page', () => {
  TableNavigation.navigateToFirstPage();
});

/**
 * Navigates to the last page of a paginated table
 */
When('User Goes To Last Page', () => {
  TableNavigation.navigateToLastPage();
});

/**
 * Navigates to the next page if it exists
 */
When('User Goes To Next Page', () => {
  TableNavigation.goToNextPageIfExists();
});

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
