import { StringUtils } from '../../../utils/StringUtils';

export class DropdownElement {
  private static readonly dropdownSelector =
    'select, [role="combobox"], [role="listbox"]';
  private static readonly dropdownWithLabelSelector =
    'select, [role="combobox"], [role="listbox"], .dropdown, .select, label';

  private static normalizeText(text: string | null | undefined): string {
    return StringUtils.normalizeText(text ?? '').toLowerCase();
  }

  private static textPattern(text: string): RegExp {
    const normalized = StringUtils.normalizeText(text);
    const escaped = normalized
      .replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`)
      .replaceAll(/['‘’]/g, "['‘’]");

    return new RegExp(escaped.replaceAll(/\s+/g, String.raw`\s+`), 'i');
  }

  private static findDropdownForLabel(
    $label: JQuery<HTMLElement>,
  ): Cypress.Chainable<JQuery<HTMLElement>> {
    const $formGroup = $label.closest('.govuk-form-group');
    if ($formGroup.length > 0) {
      return cy.wrap($formGroup).find(this.dropdownSelector).first();
    }

    const forAttr = $label.attr('for');
    if (forAttr) {
      return cy.get(`#${forAttr}`);
    }

    return cy.wrap($label).parent().find(this.dropdownSelector).first();
  }

  /**
   * Finds a dropdown within a given jQuery root element (e.g. a fieldset).
   * Uses synchronous jQuery to avoid cy.within() nesting issues.
   */
  static findDropdownWithin(
    $root: JQuery<HTMLElement>,
    name: string,
  ): Cypress.Chainable<JQuery<HTMLElement>> {
    const normalizedName = this.normalizeText(name);
    const $label = $root
      .find('label')
      .filter(
        (_, el) =>
          this.normalizeText(el.textContent?.trim()) === normalizedName,
      );
    if ($label.length > 0) {
      return this.findDropdownForLabel($label.first());
    }
    // Fallback: first select/combobox inside root
    return cy.wrap($root.find(this.dropdownSelector).first());
  }

  static findDropdown(name: string): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy
      .contains(this.dropdownWithLabelSelector, this.textPattern(name))
      .then(($element) => {
        // If we found a label, look for its associated dropdown
        if ($element.is('label')) {
          return this.findDropdownForLabel($element);
        }
        // Otherwise return the dropdown element directly
        return cy.wrap($element);
      });
  }
}
