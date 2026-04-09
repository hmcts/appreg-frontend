/// <reference types="cypress" />

export class SummaryCardElement {
  /**
   * Find a summary card by its title
   */
  static findSummaryCard(
    cardTitle: string,
  ): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy
      .contains('.govuk-summary-card__title', cardTitle, { matchCase: false })
      .should('be.visible')
      .closest('.govuk-summary-card');
  }

  /**
   * Get the content area of a summary card
   */
  static getSummaryCardContent(
    cardTitle: string,
  ): Cypress.Chainable<JQuery<HTMLElement>> {
    return this.findSummaryCard(cardTitle).find('.govuk-summary-card__content');
  }

  /**
   * Find input by placeholder within a summary card
   */
  static findInputByPlaceholderInCard(
    cardTitle: string,
    placeholder: string,
  ): Cypress.Chainable<JQuery<HTMLElement>> {
    return this.getSummaryCardContent(cardTitle).find(
      `input[placeholder="${placeholder}"]`,
    );
  }

  /**
   * Find a tag within a summary card
   */
  static findTagInCard(
    cardTitle: string,
  ): Cypress.Chainable<JQuery<HTMLElement>> {
    return this.findSummaryCard(cardTitle).find('.govuk-tag');
  }

  /**
   * Find a link within a summary card
   */
  static findLinkInCard(
    cardTitle: string,
    linkText: string,
  ): Cypress.Chainable<JQuery<HTMLElement>> {
    return this.findSummaryCard(cardTitle).contains('a.govuk-link', linkText);
  }
}
