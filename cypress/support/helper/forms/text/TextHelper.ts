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
    cy.contains(sectionLabel, { matchCase: false })
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
    cy.get('[role="alert"]').should('not.exist');
  }
}
