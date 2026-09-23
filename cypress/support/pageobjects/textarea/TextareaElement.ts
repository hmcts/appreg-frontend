/// <reference types="cypress" />

export class TextareaElement {
  static findTextarea(
    label: string,
  ): Cypress.Chainable<JQuery<HTMLTextAreaElement>> {
    return cy
      .contains('label', label, { matchCase: false })
      .should('be.visible')
      .then(($label) => {
        const id = $label.attr('for');

        if (!id) {
          throw new Error(
            `Textarea label "${label}" does not have a for attribute`,
          );
        }

        return cy.get<HTMLTextAreaElement>(`textarea[id="${id}"]`);
      });
  }
}
