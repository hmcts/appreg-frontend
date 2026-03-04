/// <reference types="cypress" />

export class TextElement {
  /**
   * Returns a Cypress chainable for a text element by CSS selector
   * @param selector CSS selector for the text element
   */
  static getText(selector: string): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get(selector);
  }

  /**
   * Returns a Cypress chainable for an element containing text, optionally scoped by selector
   * @param content Text content to locate
   * @param selector Optional CSS selector to scope the text lookup
   */
  static getTextByContent(
    content: string,
    selector?: string,
  ): Cypress.Chainable {
    if (selector) {
      return cy.contains(selector, content);
    }
    return cy.contains(content);
  }
}
