/// <reference types="cypress" />

export class AccordionElement {
  private static readonly accordionHeadingSelector =
    '.govuk-accordion__section-heading-text-focus';
  private static readonly detailsSummarySelector =
    '.govuk-details__summary-text';
  private static readonly accordionSectionSelector =
    '.govuk-accordion__section, details';
  private static readonly accordionButtonSelector =
    '.govuk-accordion__section-button, .govuk-details__summary';

  private static findElementByText(
    accordionTitle: string,
    accordionSelector: string,
    detailsSelector: string,
  ): Cypress.Chainable<JQuery<HTMLElement>> {
    const findElements = ($body: JQuery<HTMLElement>) => {
      const title = accordionTitle.trim().toLowerCase();

      const $accordion = $body
        .find(accordionSelector)
        .filter((_, el) => el.textContent?.trim().toLowerCase() === title);

      const $details = $body
        .find(detailsSelector)
        .filter((_, el) => el.textContent?.trim().toLowerCase() === title);

      return $accordion.add($details);
    };

    return cy
      .get('body')
      .should(($body) => {
        expect(
          findElements($body).length,
          `Accordion "${accordionTitle}"`,
        ).to.be.greaterThan(0);
      })
      .then(($body) => {
        return cy.wrap(findElements($body).first());
      });
  }
  static getAccordionContent(
    accordionTitle: string,
  ): Cypress.Chainable<JQuery<HTMLElement>> {
    return this.findAccordionSection(accordionTitle).then(($section) => {
      const selector = $section.is('details')
        ? '.govuk-details__text'
        : '.govuk-accordion__section-content';
      return cy.wrap($section.find(selector).first());
    });
  }

  static findAccordionSection(
    accordionTitle: string,
  ): Cypress.Chainable<JQuery<HTMLElement>> {
    return this.findElementByText(
      accordionTitle,
      this.accordionHeadingSelector,
      this.detailsSummarySelector,
    ).then(($el) => {
      const $section = $el.closest(this.accordionSectionSelector);
      return cy.wrap($section);
    });
  }

  static findAccordionButton(
    accordionTitle: string,
  ): Cypress.Chainable<JQuery<HTMLElement>> {
    return this.findElementByText(
      accordionTitle,
      this.accordionHeadingSelector,
      this.detailsSummarySelector,
    ).then(($el) => {
      const $button = $el.closest(this.accordionButtonSelector);
      return cy.wrap($button);
    });
  }

  static findAccordion(
    accordionTitle: string,
  ): Cypress.Chainable<JQuery<HTMLElement>> {
    return this.findAccordionButton(accordionTitle);
  }
}
