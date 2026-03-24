/// <reference types="cypress" />

import { AccordionElement } from '../accordion/AccordionElement';

export class AccordionDropdownElement {
  /**
   * Find a dropdown within a specific accordion by its label text
   */
  static findDropdownInAccordion(
    accordionTitle: string,
    dropdownLabel: string,
  ): Cypress.Chainable<JQuery<HTMLElement>> {
    return AccordionElement.getAccordionContent(accordionTitle)
      .contains('label', dropdownLabel, { matchCase: false })
      .invoke('attr', 'for')
      .then((selectId) => {
        if (!selectId) {
          throw new Error(
            `Label "${dropdownLabel}" in accordion "${accordionTitle}" does not have a 'for' attribute`,
          );
        }
        return cy.get(`#${selectId}`);
      });
  }
}
