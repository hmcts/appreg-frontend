
export class ButtonElement {
  /**
   * Returns a Cypress chainable for a button by CSS selector
   * @param selector CSS selector for the button
   */
  static getButton(selector: string) {
    return cy.get(selector);
  }
}
