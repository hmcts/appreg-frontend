/// <reference types="cypress" />

export class SummaryListElement {
  static findSummaryList(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get('.govuk-summary-list');
  }

  static findSummaryListRows(): Cypress.Chainable<JQuery<HTMLElement>> {
    return this.findSummaryList().find('.govuk-summary-list__row');
  }
}
