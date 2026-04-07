/// <reference types="cypress" />

import { AccordionElement } from '../accordion/AccordionElement';
export class AccordionCheckboxElement {
  static findCheckboxInAccordion(
    accordionTitle: string,
    label: string,
  ): Cypress.Chainable<JQuery<HTMLInputElement>> {
    return AccordionElement.getAccordionContent(accordionTitle)
      .find(`label:contains(${label})`)
      .siblings('input[type="checkbox"]');
  }
}
