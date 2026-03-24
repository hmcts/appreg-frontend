/// <reference types="cypress" />

import { AccordionElement } from '../accordion/AccordionElement';

export class AccordionTextboxElement {
  /**
   * Find a textbox within a specific accordion by its label text
   */
  static findTextboxInAccordion(
    accordionTitle: string,
    textboxLabel: string,
  ): Cypress.Chainable<JQuery<HTMLElement>> {
    return AccordionElement.getAccordionContent(accordionTitle)
      .contains('label', textboxLabel, { matchCase: false })
      .invoke('attr', 'for')
      .then((textboxId) => {
        if (!textboxId) {
          throw new Error(
            `Label "${textboxLabel}" in accordion "${accordionTitle}" does not have a 'for' attribute`,
          );
        }
        return cy.get(`#${textboxId}`);
      });
  }
}
