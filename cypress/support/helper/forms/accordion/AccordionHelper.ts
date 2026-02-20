import { AccordionElement } from '../../../pageobjects/generic/accordion/AccordionElement';

export class AccordionHelper {
  /**
   * Generic method to check if an accordion is visible by its title
   */
  static IsAccordionVisible(
    detailsSectionTitle: string,
  ): Cypress.Chainable<JQuery<HTMLElement>> {
    return AccordionElement.findAccordion(detailsSectionTitle).should(
      'be.visible',
    );
  }

  /**
   * Generic method to verify if a textbox with a specific label is present within an accordion
   */
  static verifyTextboxInAccordion(
    labelText: string,
    detailsSectionTitle: string,
  ): Cypress.Chainable<JQuery<HTMLElement>> {
    return AccordionElement.findTextboxInAccordion(
      labelText,
      detailsSectionTitle,
    ).should('be.visible');
  }
}
