/// <reference types="cypress" />
import { StringUtils } from '../../../utils/StringUtils';

export class TextboxElement {
  /**
   * Finds a textbox element by label text (exact match, case-insensitive)
   */
  static findTextbox(
    labelOrIdentifier: string,
  ): Cypress.Chainable<JQuery<HTMLElement>> {
    const normalized = StringUtils.normalizeText(labelOrIdentifier);
    const escaped = normalized.replaceAll(
      /[.*+?^${}()|[\]\\]/g,
      String.raw`\$&`,
    );
    const exactRegex = new RegExp(String.raw`^\s*${escaped}\s*$`, 'i');
    return cy
      .contains(
        'label, input[placeholder], textarea[placeholder], input[aria-label], textarea[aria-label], select[aria-label]',
        exactRegex,
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

  /**
   * Finds an input/textarea by its placeholder attribute
   */
  static findByPlaceholder(
    placeholder: string,
  ): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get(
      `input[placeholder="${placeholder}"], textarea[placeholder="${placeholder}"]`,
    );
  }

  /**
   * Finds an element containing the given text within the current DOM context
   */
  static findContainsText(
    text: string,
  ): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.contains(text) as unknown as Cypress.Chainable<
      JQuery<HTMLElement>
    >;
  }
}
