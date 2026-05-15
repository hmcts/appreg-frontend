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
    return cy.get('body').then(($body) => {
      const title = accordionTitle.trim().toLowerCase();

      const $accordion = $body
        .find(accordionSelector)
        .filter((_, el) => el.textContent?.trim().toLowerCase() === title);

      if ($accordion.length > 0) {
        return cy.wrap($accordion.first()) as unknown as Cypress.Chainable<
          JQuery<HTMLElement>
        >;
      }

      const $details = $body
        .find(detailsSelector)
        .filter((_, el) => el.textContent?.trim().toLowerCase() === title);

      if ($details.length > 0) {
        return cy.wrap($details.first()) as unknown as Cypress.Chainable<
          JQuery<HTMLElement>
        >;
      }

      throw new Error(`Accordion "${accordionTitle}" not found`);
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
      return cy.wrap($section) as unknown as Cypress.Chainable<
        JQuery<HTMLElement>
      >;
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
      return cy.wrap($button) as unknown as Cypress.Chainable<
        JQuery<HTMLElement>
      >;
    });
  }

  static findAccordion(
    accordionTitle: string,
  ): Cypress.Chainable<JQuery<HTMLElement>> {
    return this.findAccordionButton(accordionTitle);
  }
}
