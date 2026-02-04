import { CheckboxElement } from '../../../pageobjects/generic/checkbox/checkboxElement';

export class CheckboxHelper {
  static checkByIndex(rowIndex: number): Cypress.Chainable<JQuery<HTMLInputElement>> {
    return CheckboxElement.findInRowByIndex(rowIndex).check({ force: true });
  }

  static uncheckByIndex(rowIndex: number): Cypress.Chainable<JQuery<HTMLInputElement>> {
    return CheckboxElement.findInRowByIndex(rowIndex).uncheck({ force: true });
  }
}