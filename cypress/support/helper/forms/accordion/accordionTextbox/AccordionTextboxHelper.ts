import { AccordionElement } from '../../../../pageobjects/generic/accordion/accordion/AccordionElement';
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

  /**
   * Generic method to verify the value of an accordion by its title
   */
  static verifyAccordionValue(
    accordionTitle: string,
    expectedValue: string,
  ): void {
    AccordionElement.getAccordionContent(accordionTitle).contains(
      expectedValue,
    );
  }

  /**
   * Generic method to verify the value of an accordion by its title
   */
  static verifyAccordionTextboxPlaceholder(
    accordionTitle: string,
    placeholder: string,
    value: string,
  ): void {
    AccordionElement.getAccordionContent(accordionTitle)
      .find('input')
      .should('have.attr', 'placeholder', placeholder)
      .clear()
      .type(value);
  }

  static scrollIntoViewAccordion(accordionTitle: string): void {
    AccordionElement.findAccordion(accordionTitle).scrollIntoView();
  }

  static verifyTextboxDisabledInAccordion(
    accordionTitle: string,
    textboxLabel: string,
  ): void {
    AccordionHelper.ensureAccordionExpanded(accordionTitle);
    AccordionTextboxElement.findTextboxInAccordion(
      accordionTitle,
      textboxLabel,
    ).should('be.disabled');
  }
}
