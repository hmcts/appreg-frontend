/// <reference types="cypress" />

import { TextElement } from '../../../pageobjects/generic/text/TextElement';
import { StringUtils } from '../../../utils/StringUtils';

export class TextHelper {
  /**
   * Asserts that a text element contains the expected text.
   * @param selector CSS selector for the text element
   * @param expectedText The expected text content
   */
  static verifyTextPresence(selector: string, expectedText: string): void {
    TextElement.getText(selector).should('contain.text', expectedText);
  }

  /**
   * Verifies text exists within a labeled section
   * @param sectionLabel The label/heading of the section
   * @param expectedText The expected text content within that section
   */
  static verifyTextInSection(sectionLabel: string, expectedText: string): void {
    TextElement.getTextByContent(sectionLabel)
      .parent()
      .parent()
      .invoke('text')
      .then((text) => {
        const normalizedText = StringUtils.normalizeText(text);
        expect(normalizedText).to.include(expectedText);
      });
  }

  /**
   * Verifies that a validation error message is displayed
   * @param errorMessage The expected error message text
   */
  static verifyValidationError(errorMessage: string): void {
    TextElement.getText('[role="alert"]')
      .should('be.visible')
      .invoke('text')
      .then((actualText) => {
        const normalizedActual = StringUtils.normalizeText(actualText);
        expect(normalizedActual).to.include(errorMessage);
      });
  }

  /**
   * Verifies that no validation errors are displayed
   */
  static verifyNoValidationErrors(): void {
    TextElement.getText('[role="alert"]').should('not.exist');
  }

  /**
   * Verifies that a notification banner message is displayed
   * @param message The expected message text (heading and/or body)
   */
  static verifyNotificationBanner(message: string): void {
    TextElement.getText('[role="region"], [role="alert"]' )
      .should('be.visible')
      .invoke('text')
      .then((actualText) => {
        const normalizedActual = StringUtils.normalizeText(actualText);
        expect(normalizedActual).to.include(message);
      });
  }

  /**
   * Verifies that a field-level error message is displayed under a specific field
   * @param fieldLabel The label of the field (e.g., "Date", "Time")
   * @param errorMessage The expected error message text
   */
  static verifyFieldError(fieldLabel: string, errorMessage: string): void {
    TextElement.getTextByContent(fieldLabel)
      .filter('label, legend')
      .first()
      .closest('fieldset, div')
      .then(($container) => {
        const $errorMsg = $container.find('[class*="error"]');

        if ($errorMsg.length === 0) {
          throw new Error(`No error message found for field "${fieldLabel}"`);
        }

        const errorText = $errorMsg.text().trim();
        const normalizedError = StringUtils.normalizeText(errorText);
        const cleanedText = normalizedError
          .replace(/^(Error:|Error\s*)/i, '')
          .trim();

        expect(cleanedText, `Field error for "${fieldLabel}"`).to.include(
          errorMessage,
        );
      });
  }
}
