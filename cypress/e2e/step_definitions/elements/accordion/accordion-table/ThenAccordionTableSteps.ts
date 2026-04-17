import { Then } from '@badeball/cypress-cucumber-preprocessor';

import { AccordionHelper } from '../../../../../support/helper/forms/accordion/accordion/AccordionHelper';
import { TableHelper } from '../../../../../support/helper/table/TableHelper';

Then(
  'User Verifies Table {string} In The Accordion {string} Has Sortable Headers {string}',
  (tableCaption: string, accordionTitle: string, headers: string) => {
    TableHelper.verifySortableHeadersInAccordion(accordionTitle, headers);
  },
);

Then(
  'User Clicks {string} Button In Row Of Table {string} With In The Accordion {string}:',
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
  'User Clicks {string} Link In Row Of Table {string} With In The Accordion {string}:',
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
  'User Clicks {string} In Row Of Table {string} With In The Accordion {string}:',
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
