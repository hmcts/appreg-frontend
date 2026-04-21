import Cypress from 'cypress';

import { ButtonElement } from '../../../pageobjects/generic/button/ButtonElement';

export class ButtonHelper {
  /**
   * Clicks a button by its visible text
   * @param buttonText Visible text of the button
   */
  static clickButton(buttonText: string, timeout?: number): void {
    ButtonElement.findButton(buttonText, timeout).click();
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
}
