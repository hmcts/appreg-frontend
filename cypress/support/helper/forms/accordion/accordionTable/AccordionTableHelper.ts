/// <reference types="cypress" />

import { AccordionTableElement } from '../../../../pageobjects/generic/accordion/accordionTable/AccordionTableElement';

export class AccordionTableHelper {
  /**
   * Enter text into a textbox within a specific accordion
   */
  static verifySortableHeadersInAccordion(
    accordionTitle: string,
    tableCaption: string,
    headers: string,
  ): void {
    cy.log(
      `Verifying table: "${tableCaption}" within accordion: "${accordionTitle}" has sortable headers: "${headers}"`,
    );
    AccordionTableElement.verifySortableHeadersInAccordion(
      accordionTitle,
      tableCaption,
      headers,
    );
  }

  static clickButtonInAccordionTableRows(
    tableCaption: string,
    columnValues: Record<string, string>,
    selectButtonText: string,
  ): Cypress.Chainable<void> {
    return AccordionTableElement.verifyButtonsInAccordionTableRows(
      tableCaption,
      columnValues,
      selectButtonText,
    );
  }
}
