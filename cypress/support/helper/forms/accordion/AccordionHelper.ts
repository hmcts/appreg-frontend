import { AccordionElement } from '../../../pageobjects/generic//accordion/AccordionElement';

export class AccordionHelper {
  static IsAccordionVisible(accordionTitle: string) {
    AccordionElement.findAccordion(accordionTitle).should('be.visible');
  }

  static verifyTextboxInAccordion(
    textboxLabel: string,
    accordionTitle: string,
  ) {
    AccordionElement.findTextboxInAccordion(
      textboxLabel,
      accordionTitle,
    ).should('be.visible');
  }

  static toggleAccordion(accordionTitle: string) {
    AccordionElement.findAccordion(accordionTitle).click();
  }
}
