import { AccordionElement } from '../../../../pageobjects/generic/accordion/accordion/AccordionElement';

export class AccordionTextHelper {
  static verifyTextInAccordion(
    accordionTitle: string,
    expectedText: string,
  ): void {
    AccordionElement.getAccordionContent(accordionTitle).contains(expectedText);
  }
}
