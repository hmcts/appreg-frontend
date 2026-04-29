export class DropdownElement {
  /**
   * Finds a dropdown within a given jQuery root element (e.g. a fieldset).
   * Uses synchronous jQuery to avoid cy.within() nesting issues.
   */
  static findDropdownWithin(
    $root: JQuery<HTMLElement>,
    name: string,
  ): Cypress.Chainable<JQuery<HTMLElement>> {
    const $label = $root
      .find('label')
      .filter(
        (_, el) =>
          el.textContent?.trim().toLowerCase() === name.trim().toLowerCase(),
      );
    if ($label.length > 0) {
      const forAttr = $label.first().attr('for');
      if (forAttr) {
        return cy.get(`#${forAttr}`);
      }
    }
    // Fallback: first select/combobox inside root
    return cy.wrap(
      $root.find('select, [role="combobox"], [role="listbox"]').first(),
    );
  }

  static findDropdown(name: string): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy
      .contains(
        'select, [role="combobox"], [role="listbox"], .dropdown, .select, label',
        name,
        { matchCase: false },
      )
      .then(($element) => {
        // If we found a label, look for its associated dropdown
        if ($element.is('label')) {
          const forAttr = $element.attr('for');
          if (forAttr) {
            return cy.get(`#${forAttr}`);
          } else {
            return cy
              .wrap($element)
              .parent()
              .find('select, [role="combobox"], [role="listbox"]')
              .first();
          }
        }
        // Otherwise return the dropdown element directly
        return cy.wrap($element);
      });
  }
}
