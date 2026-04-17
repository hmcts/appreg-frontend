import { Then } from '@badeball/cypress-cucumber-preprocessor';

import { AccordionHelper } from '../../../../../support/helper/forms/accordion/accordion/AccordionHelper';
import { TableHelper } from '../../../../../support/helper/table/TableHelper';
import { TableSearch } from '../../../../../support/helper/table/TableSearch';
import { TableVerification } from '../../../../../support/helper/table/TableVerification';

Then(
  'User Verifies {string} Link Is Not Visible In Row Of Table In The Accordion {string} With:',
  (
    linkText: string,
    accordionTitle: string,
    dataTable: { hashes: () => { [key: string]: string }[] },
  ) => {
    const rows = dataTable.hashes();
    if (rows.length === 0) {
      throw new Error('DataTable must have at least one row of data');
    }
    for (const rowData of rows) {
      AccordionHelper.within(accordionTitle, () => {
        TableSearch.searchWithPagination(rowData, undefined, true, (row) => {
          cy.wrap(row).find(`a:contains("${linkText}")`).should('not.exist');
          return cy.wrap(undefined) as unknown as Cypress.Chainable<void>;
        });
      });
    }
  },
);

Then(
  'User Should See Row In Table {string} In The Accordion {string} With Values:',
  (
    tableCaption: string,
    accordionTitle: string,
    dataTable: { hashes: () => { [key: string]: string }[] },
  ) => {
    const rows = dataTable.hashes();
    if (rows.length === 0) {
      throw new Error('DataTable must have at least one row of data');
    }
    const caption = tableCaption.trim() || undefined;
    for (const row of rows) {
      AccordionHelper.within(accordionTitle, () => {
        TableSearch.verifyRowExists(row, caption);
      });
    }
  },
);

Then(
  'User Verifies Table {string} In The Accordion {string} Has Sortable Headers {string}',
  (tableCaption: string, accordionTitle: string, headers: string) => {
    AccordionHelper.within(accordionTitle, () => {
      TableVerification.verifySortableHeaders(tableCaption, headers);
    });
  },
);

Then(
  'User Clicks {string} Button In Row Of Table {string} Within The Accordion {string}',
  (
    selectButtonText: string,
    tableCaption: string,
    accordionTitle: string,
    dataTable: { hashes: () => { [key: string]: string }[] },
  ) => {
    const rows = dataTable.hashes();
    if (rows.length === 0) {
      throw new Error('DataTable must have at least one row of data');
    }
    const rowData = rows[0];
    cy.log(`rowData: ${JSON.stringify(rowData)}`);
    AccordionHelper.within(accordionTitle, () => {
      TableHelper.clickButtonInRowOfTable(tableCaption, selectButtonText);
    });
    cy.screenshot(`clicked-button-${selectButtonText}-in-row`);
  },
);

Then(
  'User Clicks {string} Link In Row Of Table {string} Within The Accordion {string}',
  (
    linkName: string,
    tableName: string,
    accordionName: string,
    dataTable: { hashes: () => { [key: string]: string }[] },
  ) => {
    const rows = dataTable.hashes();
    if (rows.length === 0) {
      throw new Error('DataTable must have at least one row of data');
    }
    const rowData = rows[0];
    cy.log(`rowData: ${JSON.stringify(rowData)}`);
    AccordionHelper.within(accordionName, () => {
      TableHelper.clickLinkInRowOfTable(linkName, tableName, rowData);
    });
    cy.screenshot(`clicked-link-${linkName}-in-row-${tableName}`);
  },
);

Then(
  'User Clicks {string} In Row Of Table {string} Within The Accordion {string}',
  (
    text: string,
    tableName: string,
    accordionName: string,
    dataTable: { hashes: () => { [key: string]: string }[] },
  ) => {
    const rows = dataTable.hashes();
    if (rows.length === 0) {
      throw new Error('DataTable must have at least one row of data');
    }
    const rowData = rows[0];
    cy.log(`rowData: ${JSON.stringify(rowData)}`);
    AccordionHelper.within(accordionName, () => {
      TableHelper.clickInRowOfTable(text, tableName, rowData);
    });
    cy.screenshot(`clicked-${text}-in-row-${tableName}`);
  },
);
