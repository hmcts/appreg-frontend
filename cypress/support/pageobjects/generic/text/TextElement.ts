/// <reference types="cypress" />

export class TextElement {
  /**
   * Returns a Cypress chainable for a text element by CSS selector
   * @param selector CSS selector for the text element
   */
  static getText(selector: string) {
    return cy.get(selector);
  }

  static getTextByContent(content: string) {
    return cy.contains(content);
  }
}
