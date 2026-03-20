/// <reference types="cypress" />

import { AccordionElement } from '../accordion/AccordionElement';

export class AccordionDateElement {
  private static findDateComponentInput(
    accordionTitle: string,
    componentType: 'day' | 'month' | 'year',
  ): Cypress.Chainable<JQuery<HTMLElement>> {
    return AccordionElement.getAccordionContent(accordionTitle).then(
      ($content) => {
        const $input = $content.find(
          `input[id*="${componentType}"], input[name*="${componentType}"]`,
        );

        if ($input.length > 0) {
          return cy.wrap($input.first());
        }

        throw new Error(
          `Date ${componentType} input not found in accordion "${accordionTitle}"`,
        );
      },
    );
  }

  static findDayInputInAccordion(
    accordionTitle: string,
  ): Cypress.Chainable<JQuery<HTMLElement>> {
    return this.findDateComponentInput(accordionTitle, 'day');
  }

  static findMonthInputInAccordion(
    accordionTitle: string,
  ): Cypress.Chainable<JQuery<HTMLElement>> {
    return this.findDateComponentInput(accordionTitle, 'month');
  }

  static findYearInputInAccordion(
    accordionTitle: string,
  ): Cypress.Chainable<JQuery<HTMLElement>> {
    return this.findDateComponentInput(accordionTitle, 'year');
  }
}
