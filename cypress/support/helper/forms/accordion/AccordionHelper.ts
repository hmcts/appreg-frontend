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

  /**
   * Generic method to toggle an accordion by its title
   */
  static toggleAccordion(accordionTitle: string): void {
    AccordionElement.findAccordion(accordionTitle).click();
  }
}
