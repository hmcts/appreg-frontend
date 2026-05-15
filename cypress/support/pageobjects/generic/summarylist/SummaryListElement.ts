/// <reference types="cypress" />

export class SummaryListElement {
  private static readonly summaryListSelector = '.govuk-summary-list';
  private static readonly summaryListRowSelector = '.govuk-summary-list__row';

  static findSummaryList(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get(this.summaryListSelector);
  }

  static findSummaryListRows(): Cypress.Chainable<JQuery<HTMLElement>> {
    return this.findSummaryList().find(this.summaryListRowSelector);
  }
}
