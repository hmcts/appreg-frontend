/// <reference types="cypress" />

export class SummaryCardElement {
  private static readonly summaryCardTitleSelector =
    '.govuk-summary-card__title';
  private static readonly summaryCardSelector = '.govuk-summary-card';
  private static readonly summaryCardContentSelector =
    '.govuk-summary-card__content';
  private static readonly summaryCardTagSelector = '.govuk-tag';
  private static readonly summaryCardLinkSelector = 'a.govuk-link';

  /**
   * Find a summary card by its title
   */
  static findSummaryCard(
    cardTitle: string,
  ): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy
      .contains(this.summaryCardTitleSelector, cardTitle, { matchCase: false })
      .should('be.visible')
      .closest(this.summaryCardSelector);
  }

  /**
   * Get the content area of a summary card
   */
  static getSummaryCardContent(
    cardTitle: string,
  ): Cypress.Chainable<JQuery<HTMLElement>> {
    return this.findSummaryCard(cardTitle).find(
      this.summaryCardContentSelector,
    );
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
    return this.findSummaryCard(cardTitle).find(this.summaryCardTagSelector);
  }

  /**
   * Find a link within a summary card
   */
  static findLinkInCard(
    cardTitle: string,
    linkText: string,
  ): Cypress.Chainable<JQuery<HTMLElement>> {
    return this.findSummaryCard(cardTitle).contains(
      this.summaryCardLinkSelector,
      linkText,
    );
  }
}
