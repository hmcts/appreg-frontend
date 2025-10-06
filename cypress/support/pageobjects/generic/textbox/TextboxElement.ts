export class TextboxElement {
  /**
   * Finds a textbox element by label text, placeholder, or accessible name
   */
  static findTextbox(labelOrIdentifier: string): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.contains(
      'label, input[placeholder], textarea[placeholder], input[aria-label], textarea[aria-label], select[aria-label]',
      labelOrIdentifier,
      { matchCase: false }
    ).then(($el) => {
      // If it's a label, find the associated input
      if ($el.is('label')) {
        const forAttr = $el.attr('for');
        if (forAttr) {
          return cy.get(`#${forAttr}`);
        }
        return cy.wrap($el).parent().find('input, textarea, select').first();
      }
      // If it's already an input/textarea/select, return it
      return cy.wrap($el);
    });
  }
}
