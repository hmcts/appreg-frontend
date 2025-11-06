import { TextboxElement } from '../../../pageobjects/generic/textbox/TextboxElement';

export class TextboxHelper {
  /**
   * Types text into a textbox
   * @param selector selector for the textbox
   * @param text The text to type
   */
  static typeInTextbox(selector: string, text: string): void {
    TextboxElement.findTextbox(selector)
      .should('be.visible')
      .should('be.enabled')
      .type(text);
  }

  /**
   * Clears text from a textbox
   * @param selector selector for the textbox
   */
  static clearTextbox(selector: string): void {
    TextboxElement.findTextbox(selector)
      .should('be.visible')
      .should('be.enabled')
      .clear();
  }

  /**
   * Gets the value from a textbox
   * @param selector Smart selector for the textbox
   */
  static getValueInTextbox(selector: string): Cypress.Chainable {
    return TextboxElement.findTextbox(selector).invoke('val');
  }

  /**
   * Checks if a textbox is enabled
   * @param selector Smart selector for the textbox
   */
  static TextboxIsEnabled(selector: string): Cypress.Chainable {
    return TextboxElement.findTextbox(selector).should('be.enabled');
  }

  /**
   * Checks if a textbox is disabled
   * @param selector Smart selector for the textbox
   */
  static TextboxIsDisabled(selector: string): Cypress.Chainable {
    return TextboxElement.findTextbox(selector).should('be.disabled');
  }

  /**
   * Checks if a textbox is visible
   * @param selector Smart selector for the textbox
   */
  static TextboxIsVisible(selector: string): Cypress.Chainable {
    return TextboxElement.findTextbox(selector).should('be.visible');
  }

  /**
   * Types text into an autocomplete textbox and selects an option from dropdown
   * @param selector selector for the textbox
   * @param text The text to type
   * @param optionText The option text to select from the autocomplete dropdown
   */
  static selectAutocompleteOption(
    selector: string,
    text: string,
    optionText: string,
  ): void {
    TextboxElement.findTextbox(selector)
      .should('be.visible')
      .should('be.enabled')
      .clear()
      .type(text);

    cy.contains(optionText, { matchCase: false }).should('be.visible').click();
  }

  /**
   * Verifies that the autocomplete textbox contains the expected value
   * @param selector Smart selector for the textbox
   * @param expectedValue The expected value in the textbox
   */
  static verifyValueInTextbox(
    selector: string,
    expectedValue: string,
  ): Cypress.Chainable {
    return TextboxElement.findTextbox(selector)
      .invoke('val')
      .should('eq', expectedValue);
  }
}
