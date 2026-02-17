/// <reference types="cypress" />
export class TextboxElement {
  /**
   * Finds a textbox element by label text, placeholder, or accessible name
   */
  static findTextbox(
    labelOrIdentifier: string,
  ): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy
      .contains(
        'label, input[placeholder], textarea[placeholder], input[aria-label], textarea[aria-label], select[aria-label]',
        labelOrIdentifier,
        { matchCase: false },
      )
      .then(($el) => {
        // If it's a label, find the associated input
        if ($el.is('label')) {
          const forAttr = $el.attr('for');
          if (forAttr) {
            return cy.get(`#${forAttr}`).then(($target) => {
              // If target is already an input/textarea/select, use it directly
              if ($target.is('input, textarea, select')) {
                return cy.wrap($target);
              }
              // If target is a container (component), look for input inside
              const inputInside = $target.find('input, textarea, select');
              if (inputInside.length > 0) {
                return cy.wrap(inputInside.first());
              }
              // Fallback: return the target as-is (might be a custom component)
              return cy.wrap($target);
            });
          }
          // No 'for' attribute, look in parent container
          return cy.wrap($el).parent().find('input, textarea, select').first();
        }
        // If it's already an input/textarea/select, return it
        return cy.wrap($el);
      });
    // });
  }
}
