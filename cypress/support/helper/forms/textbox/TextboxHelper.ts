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
      .clear()
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
  static verifyTextboxIsVisible(selector: string): Cypress.Chainable {
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
    // Break chain to handle DOM re-renders during clear/type
    TextboxElement.findTextbox(selector)
      .should('be.visible')
      .should('be.enabled')
      .clear();

    // Re-find element after clear to handle potential re-renders
    TextboxElement.findTextbox(selector).should('be.visible').type(text);

    // Wait for autocomplete dropdown to appear and trigger mousedown on the link
    cy.get('.app-autocomplete__menu')
      .should('be.visible')
      .contains('.app-autocomplete__link', optionText, { matchCase: false })
      .should('be.visible')
      .trigger('mousedown');
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

  /**
   * Verifies that the "No results found" message is visible in the autocomplete menu
   */
  static verifyInfoVisible(selector: string, info: string): Cypress.Chainable {
    return TextboxElement.findTextbox(selector).then(() => {
      return cy
        .get('.app-autocomplete__menu:visible')
        .should('contain.text', info);
    });
  }
  /**
   * Verifies that the "No results found" message is not visible (menu hidden or message absent)
   */
  static verifyInfoNotVisible(
    selector: string,
    info: string,
  ): Cypress.Chainable {
    return TextboxElement.findTextbox(selector).then(($el) => {
      if ($el.find('.app-autocomplete__menu').length === 0) {
        cy.log(info, 'is not visible');
        return cy.get('.app-autocomplete__menu').should('not.exist');
      } else {
        return cy.get('.app-autocomplete__menu').should('contain.text', info);
      }
    });
  }

  /**
   * Asserts that the current DOM context contains the given text.
   * Designed for use inside AccordionHelper.within() to check accordion content.
   * @param text The text expected to be present
   */
  static verifyContainsText(text: string): void {
    TextboxElement.findContainsText(text).should('be.visible');
  }

  static typeInTextboxByPlaceholder(placeholder: string, value: string): void {
    TextboxElement.findByPlaceholder(placeholder)
      .should('be.visible')
      .should('be.enabled')
      .should('have.attr', 'placeholder', placeholder)
      .type(value);
  }
}
