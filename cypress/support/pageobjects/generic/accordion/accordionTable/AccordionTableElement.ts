/// <reference types="cypress" />

import { TableElement } from '../../table/TableElement';
import { AccordionElement } from '../accordion/AccordionElement';

export class AccordionTableElement {
  static verifySortableHeadersInAccordion(
    accordionTitle: string,
    tableCaption: string,
    headers: string,
  ): void {
    const sortableHeaders = headers.split(',').map((h) => h.trim());

    cy.log(
      `Verifying ${sortableHeaders.length} headers are sortable: ${sortableHeaders.join(', ')}`,
    );

    for (const headerText of sortableHeaders) {
      AccordionElement.findAccordionSection(accordionTitle)
        .find('thead th')
        .contains(headerText)
        .closest('th')
        .should('have.attr', 'aria-sort');
    }
  }

  static verifyButtonsInAccordionTableRows(
    tableCaption: string,
    columnValues: Record<string, string>,
    selectButtonText: string,
  ): Cypress.Chainable<void> {
    return TableElement.verifyButtonInTableRows(tableCaption, selectButtonText);
  }
}
