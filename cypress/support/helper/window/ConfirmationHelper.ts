import { ConfirmationElement } from '../../pageobjects/generic/window/ConfirmationElement';

export class ConfirmationHelper {
  /**
   * Accept the next confirmation dialog (if it appears).
   * Optionally asserts the dialog text.
   */
  static acceptNextConfirm(expectedText?: string): void {
    ConfirmationElement.findConfirmation((text) => {
      if (expectedText) {
        expect(text).to.eq(expectedText);
      }
      return true;
    });
  }

  /**
   * Dismiss the next confirmation dialog (if it appears).
   * Optionally asserts the dialog text.
   */
  static dismissNextConfirm(expectedText?: string): void {
    ConfirmationElement.findConfirmation((text) => {
      if (expectedText) {
        expect(text).to.eq(expectedText);
      }
      return false;
    });
  }
}
