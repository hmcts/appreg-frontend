/// <reference types="cypress" />

export class AccordionElement {
  static findAccordion(
    accordionTitle: string,
  ): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.contains('details summary, summary, details', accordionTitle);
  }
}
