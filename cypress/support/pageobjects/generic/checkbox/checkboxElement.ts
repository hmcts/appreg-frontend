/// <reference types="cypress" />
export class CheckboxElement {
  private static readonly labelSelector = 'label';
  private static readonly checkboxSelector = 'input[type="checkbox"]';

  /**
   * Supports both wrapped and linked labels (for/id)
   */
  static findCheckbox(
    labelText: string,
  ): Cypress.Chainable<JQuery<HTMLInputElement>> {
    return cy.contains(this.labelSelector, labelText).then(($label) => {
      const forAttr = $label.attr('for');
      if (forAttr) {
        // Label with for attribute pointing to checkbox id
        return cy.get(`${this.checkboxSelector}#${forAttr}`);
      } else {
        // Label wrapping the checkbox
        return cy.wrap($label).find(this.checkboxSelector);
      }
    });
  }
}
