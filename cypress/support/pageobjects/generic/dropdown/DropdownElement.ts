export class DropdownElement {
  static findDropdown(name: string): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy
      .contains(
        'select, [role="combobox"], [role="listbox"], .dropdown, .select, label',
        name,
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
