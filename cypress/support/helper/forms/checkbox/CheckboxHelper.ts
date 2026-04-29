import { CheckboxElement } from '../../../pageobjects/generic/checkbox/checkboxElement';

export class CheckboxHelper {
  /**
   * Generic method to check a checkbox by label text
   */
  static check(labelText: string): Cypress.Chainable<JQuery<HTMLInputElement>> {
    return CheckboxElement.findCheckbox(labelText).check({ force: true });
  }

  /**
   * Generic method to uncheck a checkbox by label text
   */
  static uncheck(
    labelText: string,
  ): Cypress.Chainable<JQuery<HTMLInputElement>> {
    return CheckboxElement.findCheckbox(labelText).uncheck({ force: true });
  }

  static verifyEnabled(labelText: string): void {
    CheckboxElement.findCheckbox(labelText).should('be.enabled');
  }

  static verifyUnchecked(labelText: string): void {
    CheckboxElement.findCheckbox(labelText).should('not.be.checked');
  }

  static verifyChecked(labelText: string): void {
    CheckboxElement.findCheckbox(labelText).should('be.checked');
  } 
}
