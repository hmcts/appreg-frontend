/// <reference types="cypress" />
import { DropdownElement } from '../../../pageobjects/generic/dropdown/DropdownElement';

export class DropdownHelper {
  /**
   * Selects an option from a dropdown by its label and option text
   * @param dropdownLabel The label of the dropdown
   * @param optionText The visible text of the option to select
   */
  static selectDropdownOption(
    name: string,
    option: string,
  ): Cypress.Chainable<JQuery<HTMLElement>> {
    return DropdownElement.findDropdown(name).then(($dropdown) => {
      if ($dropdown.is('select')) {
        // For native select elements
        cy.wrap($dropdown)
          .find('option')
          .filter(
            (_i, el) =>
              Cypress.$(el).text().trim().toLowerCase() ===
              option.toLowerCase(),
          )
          .then(($option) => {
            if ($option.length > 0) {
              cy.wrap($dropdown).select($option.val() as string);
            } else {
              cy.wrap($dropdown).select(option);
            }
          });
      } else {
        // For custom dropdowns
        cy.wrap($dropdown).click();
        cy.contains(
          '.dropdown [role="option"], .select [role="option"], .dropdown__option, .select__option',
          option,
          { matchCase: false },
        ).click();
        cy.wrap($dropdown).should('contain.text', option);
      }
    });
  }

  static verifyDropdownIsVisible(dropdownLabel: string): void {
    DropdownElement.findDropdown(dropdownLabel).should('be.visible');
  }

  static verifyDropdownOptionSelected(
    dropdownLabel: string,
    optionText: string,
  ): void {
    DropdownElement.findDropdown(dropdownLabel)
      .invoke('val')
      .should((val) => {
        expect(String(val).toLowerCase()).to.equal(optionText.toLowerCase());
      });
  }

  static verifyDropdownOptionNotSelected(
    dropdownLabel: string,
    optionText: string,
  ): void {
    DropdownElement.findDropdown(dropdownLabel)
      .invoke('val')
      .should((val) => {
        expect(String(val).toLowerCase()).to.not.equal(
          optionText.toLowerCase(),
        );
      });
  }

  static verifyDropdownIsDisabled(dropdownLabel: string): void {
    DropdownElement.findDropdown(dropdownLabel).should('be.disabled');
  }

  static verifyDropdownIsEnabled(dropdownLabel: string): void {
    DropdownElement.findDropdown(dropdownLabel).should('be.enabled');
  }

  static verifyDropdownContainsOption(
    dropdownLabel: string,
    optionText: string,
  ): void {
    DropdownElement.findDropdown(dropdownLabel)
      .find('option')
      .contains(optionText)
      .should('exist');
  }

  static verifyDropdownDoesNotContainOption(
    dropdownLabel: string,
    optionText: string,
  ): void {
    DropdownElement.findDropdown(dropdownLabel)
      .find('option')
      .contains(optionText)
      .should('not.exist');
  }
}
