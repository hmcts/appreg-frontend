import { Then } from '@badeball/cypress-cucumber-preprocessor';

import { AccordionElement } from '../../../../../support/pageobjects/generic/accordion/accordion/AccordionElement';
import { TableElement } from '../../../../../support/pageobjects/generic/table/TableElement';

Then(
  'User Verifies Table {string} In The Accordion {string} Has Sortable Headers {string}',
  (tableCaption: string, accordionTitle: string, headers: string) => {
    const sortableHeaders = headers.split(',').map((h) => h.trim());
    for (const headerText of sortableHeaders) {
      AccordionElement.findAccordionSection(accordionTitle)
        .find('thead th')
        .contains(headerText)
        .closest('th')
        .should('have.attr', 'aria-sort');
    }
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
    TableElement.verifyButtonInTableRows(tableCaption, selectButtonText);
    cy.screenshot(`clicked-button-${selectButtonText}-in-row`);
  },
);
