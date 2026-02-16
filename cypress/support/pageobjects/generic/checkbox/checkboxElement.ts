/// <reference types="cypress" />
export class CheckboxElement {
  /**
   * Supports both wrapped and linked labels (for/id)
   */
  static findCheckbox(
    labelText: string,
  ): Cypress.Chainable<JQuery<HTMLInputElement>> {
    return cy.contains('label', labelText).then(($label) => {
      const forAttr = $label.attr('for');
      if (forAttr) {
        // Label with for attribute pointing to checkbox id
        return cy.get(`input[type="checkbox"]#${forAttr}`);
      } else {
        // Label wrapping the checkbox
        return cy.wrap($label).find('input[type="checkbox"]');
      }
    });
  }
}
