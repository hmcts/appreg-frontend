/// <reference types="cypress" />

import { StringUtils } from '../../../utils/StringUtils';

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

  static assertSummaryCardVisible(cardTitle: string): void {
    cy.get('body').should(($body) => {
      const $card = this.findSummaryCardIn($body, cardTitle);

      expect(
        $card.length,
        `summary card "${cardTitle}" should exist`,
      ).to.be.greaterThan(0);
      expect(
        $card.is(':visible'),
        `summary card "${cardTitle}" should be visible`,
      ).to.equal(true);
    });
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

  static assertTextInCard(cardTitle: string, expectedText: string): void {
    const normalizedExpectedText = StringUtils.normalizeText(expectedText);

    cy.get('body').should(($body) => {
      const $card = this.findSummaryCardIn($body, cardTitle);
      const $content = $card.find(this.summaryCardContentSelector);

      expect(
        $card.length,
        `summary card "${cardTitle}" should exist`,
      ).to.be.greaterThan(0);
      expect(
        StringUtils.normalizeText($content.text()),
        `summary card "${cardTitle}" content`,
      ).to.contain(normalizedExpectedText);
    });
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

  static fillInputByPlaceholderInCard(
    cardTitle: string,
    placeholder: string,
    value: string,
  ): void {
    cy.get('body').should(($body) => {
      const $input = this.findInputByPlaceholderInCardElement(
        $body,
        cardTitle,
        placeholder,
      );

      expect(
        $input.length,
        `input with placeholder "${placeholder}" in summary card "${cardTitle}" should exist`,
      ).to.be.greaterThan(0);
      expect(
        $input.is(':visible'),
        `input with placeholder "${placeholder}" in summary card "${cardTitle}" should be visible`,
      ).to.equal(true);
      expect($input.attr('placeholder')).to.equal(placeholder);
    });

    cy.get('body').then(($body) => {
      const $input = this.findInputByPlaceholderInCardElement(
        $body,
        cardTitle,
        placeholder,
      );

      cy.wrap($input).clear().type(value);
    });
  }

  /**
   * Find a tag within a summary card
   */
  static findTagInCard(
    cardTitle: string,
  ): Cypress.Chainable<JQuery<HTMLElement>> {
    return this.findSummaryCard(cardTitle).find(this.summaryCardTagSelector);
  }

  static assertTagInCardContains(cardTitle: string, tagText: string): void {
    const normalizedTagText = StringUtils.normalizeText(tagText);

    cy.get('body').should(($body) => {
      const $card = this.findSummaryCardIn($body, cardTitle);
      const $tag = $card.find(this.summaryCardTagSelector);

      expect(
        $card.length,
        `summary card "${cardTitle}" should exist`,
      ).to.be.greaterThan(0);
      expect(
        $tag.length,
        `tag in summary card "${cardTitle}" should exist`,
      ).to.be.greaterThan(0);
      expect(
        StringUtils.normalizeText($tag.text()),
        `tag in summary card "${cardTitle}"`,
      ).to.contain(normalizedTagText);
    });
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

  static assertLinkInCardVisible(cardTitle: string, linkText: string): void {
    cy.get('body').should(($body) => {
      const $link = this.findLinkInCardElement($body, cardTitle, linkText);

      expect(
        $link.length,
        `link "${linkText}" in summary card "${cardTitle}" should exist`,
      ).to.be.greaterThan(0);
      expect(
        $link.is(':visible'),
        `link "${linkText}" in summary card "${cardTitle}" should be visible`,
      ).to.equal(true);
    });
  }

  static clickLinkInCard(cardTitle: string, linkText: string): void {
    this.assertLinkInCardVisible(cardTitle, linkText);

    cy.get('body').then(($body) => {
      const $link = this.findLinkInCardElement($body, cardTitle, linkText);

      cy.wrap($link).click();
    });
  }

  private static findSummaryCardIn(
    $root: JQuery<HTMLElement>,
    cardTitle: string,
  ): JQuery<HTMLElement> {
    const normalizedCardTitle = this.normalizeForMatch(cardTitle);

    return $root
      .find(this.summaryCardSelector)
      .filter((_, card) => {
        const title = Cypress.$(card)
          .find(this.summaryCardTitleSelector)
          .first()
          .text();

        return this.normalizeForMatch(title).includes(normalizedCardTitle);
      })
      .first();
  }

  private static findInputByPlaceholderInCardElement(
    $root: JQuery<HTMLElement>,
    cardTitle: string,
    placeholder: string,
  ): JQuery<HTMLElement> {
    return this.findSummaryCardIn($root, cardTitle)
      .find('input, textarea')
      .filter(
        (_, input) => Cypress.$(input).attr('placeholder') === placeholder,
      )
      .first();
  }

  private static findLinkInCardElement(
    $root: JQuery<HTMLElement>,
    cardTitle: string,
    linkText: string,
  ): JQuery<HTMLElement> {
    const normalizedLinkText = this.normalizeForMatch(linkText);

    return this.findSummaryCardIn($root, cardTitle)
      .find(this.summaryCardLinkSelector)
      .filter((_, link) =>
        this.normalizeForMatch(Cypress.$(link).text()).includes(
          normalizedLinkText,
        ),
      )
      .first();
  }

  private static normalizeForMatch(text: string): string {
    return StringUtils.normalizeText(text).toLowerCase();
  }
}
