import { ButtonElement } from '../../../pageobjects/generic/button/ButtonElement';
import Cypress from 'cypress';

export class ButtonHelper {
  /**
   * Clicks a button by its visible text
   * @param buttonText Visible text of the button
   */
  static clickButton(buttonText: string): void {
    ButtonElement.findButton(buttonText).click();
  }

  static isButtonVisible(buttonText: string): Cypress.Chainable {
    return ButtonElement.findButton(buttonText).should('be.visible');
  }

  static isButtonEnabled(buttonText: string): Cypress.Chainable {
    return ButtonElement.findButton(buttonText).should('not.be.disabled');
  }

  static isButtonDisabled(buttonText: string): Cypress.Chainable {
    return ButtonElement.findButton(buttonText).should('be.disabled');
  }

  static clickButtonInTableRow(
    buttonText: string,
    rowData: { [key: string]: string },
  ): void {
    ButtonElement.findButtonInTableRow(buttonText, rowData).click();
  }
}
