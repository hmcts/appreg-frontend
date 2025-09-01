import { ButtonElement } from "../../../pageobjects/generic/button/ButtonElement";

export class ButtonHelper {
  /**
   * Clicks a button by its visible text
   * @param buttonText Visible text of the button
   */
  static clickButton(buttonText: string) {
    ButtonElement.findButton(buttonText).click();
  }

  static isButtonVisible(buttonText: string) {
    return ButtonElement.findButton(buttonText).should('be.visible');
  }

  static isButtonEnabled(buttonText: string) {
    return ButtonElement.findButton(buttonText).should('not.be.disabled');
  }

  static isButtonDisabled(buttonText: string) {
    return ButtonElement.findButton(buttonText).should('be.disabled');
  }

}
