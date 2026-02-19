/// <reference types="cypress" />

export class AccordionElement {
  static findAccordion(
    accordionTitle: string,
  ): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.contains('details summary, summary, detatils', accordionTitle);
  }

  static findTextboxInAccordion(
    textboxLabel: string,
    accordionTitle: string,
  ): Cypress.Chainable<JQuery<HTMLElement>> {
    return this.findAccordion(accordionTitle)
      .should('be.visible')
      .parent()
      .within(() => {
        cy.contains('label', textboxLabel, { matchCase: false }).should(
          'exist',
        );
      });
  }
}
