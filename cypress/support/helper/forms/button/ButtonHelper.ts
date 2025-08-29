import { ButtonElement } from "../../../pageobjects/webelements/buttons/ButtonElement";

export class ButtonHelper {
  /**
   * Clicks a button by its visible text
   * @param buttonText Visible text of the button
   */
  static clickButton(buttonText: string) {
    ButtonElement.findButton(buttonText).click();
  }

}
