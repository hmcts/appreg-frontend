/// <reference types="cypress" />

export class TextElement {
  /**
   * Returns a Cypress chainable for a text element by CSS selector
   * @param selector CSS selector for the text element
   */
  static getText(selector: string): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get(selector);
  }

  static getTextByContent(content: string): Cypress.Chainable {
    return cy.contains(content);
  }
}
