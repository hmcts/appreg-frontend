import { AccordionCheckboxElement } from '../../../../pageobjects/generic/accordion/accordionCheckbox/AccordionCheckboxElement';

export class AccordionCheckboxHelper {
  static verifyCheckboxEnabled(accordionTitle: string, label: string): void {
    AccordionCheckboxElement.findCheckboxInAccordion(
      accordionTitle,
      label,
    ).should('be.enabled');
  }

  static verifyCheckboxUnchecked(accordionTitle: string, label: string): void {
    AccordionCheckboxElement.findCheckboxInAccordion(
      accordionTitle,
      label,
    ).should('not.be.checked');
  }

  static checkTheCheckbox(accordionTitle: string, label: string): void {
    AccordionCheckboxElement.findCheckboxInAccordion(
      accordionTitle,
      label,
    ).check();
  }
}
