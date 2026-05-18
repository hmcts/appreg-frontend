/// <reference types="cypress" />
export class RadioElement {
  private static readonly labelSelector = 'label';
  private static readonly radioSelector = 'input[type="radio"]';

  /**
   * Supports both wrapped and linked labels (for/id)
   */
  static findRadio(
    labelText: string,
  ): Cypress.Chainable<JQuery<HTMLInputElement>> {
    return cy.contains(this.labelSelector, labelText).then(($label) => {
      const forAttr = $label.attr('for');
      if (forAttr) {
        // Label with for attribute pointing to radio id
        return cy.get(`${this.radioSelector}#${forAttr}`);
      } else {
        // Label wrapping the radio
        return cy.wrap($label).find(this.radioSelector);
      }
    });
  }
}
