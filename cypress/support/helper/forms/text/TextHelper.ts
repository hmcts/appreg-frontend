/// <reference types="cypress" />

import { TextElement } from '../../../pageobjects/generic/text/TextElement';

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
    // Find the section container and verify text using existing TextElement method
    cy.contains(sectionLabel)
      .closest('fieldset, div, section, form, article')
      .within(() => {
        TextElement.getText('*').should('contain.text', expectedText);
      });
  }
}
