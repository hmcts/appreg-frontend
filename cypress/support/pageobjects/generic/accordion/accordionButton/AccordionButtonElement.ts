/// <reference types="cypress" />

import { AccordionElement } from '../accordion/AccordionElement';

export class AccordionButtonElement {
  /**
   * Find a button within a specific accordion by its text
   */
  static findButtonInAccordion(
    accordionTitle: string,
    buttonText: string,
  ): Cypress.Chainable<JQuery<HTMLElement>> {
    return AccordionElement.getAccordionContent(accordionTitle).contains(
      'button, input[type="button"], input[type="submit"], [role="button"]',
      buttonText,
    );
  }
}
