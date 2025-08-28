import { TextElement } from '../../../pageobjects/webelements/text/TextElement';

export class TextHelper {
  /**
   * Asserts that a text element contains the expected text.
   * @param selector CSS selector for the text element
   * @param expectedText The expected text content
   */
  static verifyTextPresence(selector: string, expectedText: string) {
    TextElement.getText(selector).should('contain.text', expectedText);
  }
}
