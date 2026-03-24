import { Then } from '@badeball/cypress-cucumber-preprocessor';

import { AccordionTableHelper } from '../../../../../support/helper/forms/accordion/accordionTable/AccordionTableHelper';
Then(
  'User Verifies Table {string} In The Accordion {string} Has Sortable Headers {string}',
  (tableCaption: string, accordionTitle: string, headers: string) => {
    cy.log(
      `Verifying table: "${tableCaption}" within accordion: "${accordionTitle}" has sortable headers: "${headers}"`,
    );
    AccordionTableHelper.verifySortableHeadersInAccordion(
      accordionTitle,
      tableCaption,
      headers,
    );
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
    AccordionTableHelper.clickButtonInAccordionTableRows(
      tableCaption,
      rowData,
      selectButtonText,
    );
    cy.screenshot(`clicked-button-${selectButtonText}-in-row`);
  },
);
