import { AccordionElement } from '../../../pageobjects/generic/accordion/AccordionElement';

export class AccordionHelper {
  /**
   * Generic method to check if an accordion is visible by its title
   */
  static isAccordionVisible(
    accordionTitle: string,
  ): Cypress.Chainable<JQuery<HTMLElement>> {
    return AccordionElement.findAccordion(accordionTitle).should('be.visible');
  }

  static toggleAccordion(accordionTitle: string) {
    AccordionElement.findAccordion(accordionTitle).click();
  }
}
