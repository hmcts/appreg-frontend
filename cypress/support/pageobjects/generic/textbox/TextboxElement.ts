export class TextboxElement {
  /**
   * Finds a textbox element using a smart selector
   * Preferred order: %data-test-id > @name > #id > &aria-label > ~label
   * Weak selectors (class, placeholder, nth-child, etc.) removed for stability.
   */
  static findTextbox(selector: string): Cypress.Chainable {
    const prefix = selector.charAt(0);
    const value = selector.slice(1);

    switch (prefix) {
      case '%': // data-test-id (preferred)
        return cy.get(`input[data-test-id="${value}"]`);

      case '@': // name attribute
        return cy.get(`input[name="${value}"]`);

      case '#': // id
        return cy.get(`#${value}`);

      case '&': // aria-label
        return cy.get(`input[aria-label="${value}"]`);

      case '~': {
        // label text
        return cy.contains('label', value).then(($label) => {
          const forAttr = $label.attr('for');
          if (forAttr) {
            return cy.get(`#${forAttr}`);
          }
          return cy.wrap($label).parent().find('input');
        });
      }

      default: // CSS selector (only if absolutely needed)
        return cy.get(selector);
    }
  }
}
