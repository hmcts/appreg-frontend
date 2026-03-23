import { AccordionTextboxElement } from '../../../../pageobjects/generic/accordion/accordionTextbox/AccordionTextboxElement';
import { AccordionHelper } from '../accordion/AccordionHelper';

export class AccordionTextboxHelper {
  /**
   * Enter text into a textbox within a specific accordion
   */
  static enterTextIntoAccordionTextbox(
    accordionTitle: string,
    textboxLabel: string,
    text: string,
  ): void {
    AccordionHelper.isAccordionVisible(accordionTitle);
    AccordionHelper.ensureAccordionExpanded(accordionTitle);
    AccordionTextboxElement.findTextboxInAccordion(
      accordionTitle,
      textboxLabel,
    ).then(($textbox) => {
      cy.wrap($textbox).clear().type(text);
    });
  }

  /**
   * Verify text value in a textbox within an accordion
   */
  static verifyTextboxValue(
    accordionTitle: string,
    textboxLabel: string,
    expectedValue: string,
  ): void {
    AccordionHelper.ensureAccordionExpanded(accordionTitle);

    AccordionTextboxElement.findTextboxInAccordion(
      accordionTitle,
      textboxLabel,
    ).should('have.value', expectedValue);
  }
}
