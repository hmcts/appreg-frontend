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
      if (!$dropdown || $dropdown.length === 0) {
        throw new Error(`Dropdown "${name}" not found`);
      }

      if ($dropdown.is('select')) {
        cy.wrap($dropdown)
          .find('option')
          .then(($options) => {
            const match = [...$options].find(
              (o) =>
                o.textContent?.trim().toLowerCase() === option.toLowerCase(),
            );

            if (!match) {
              throw new Error(`Option "${option}" not found in select`);
            }

            cy.wrap($dropdown).select(match.value);
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
      return cy.wrap($dropdown);
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
      .then((val) => {
        const valMatch = String(val).toLowerCase() === optionText.toLowerCase();
        if (valMatch) {
          expect(valMatch).to.be.true;
        } else {
          // Fall back to comparing text content
          DropdownElement.findDropdown(dropdownLabel).then(($dropdown) => {
            expect($dropdown.text().toLowerCase()).to.include(
              optionText.toLowerCase(),
            );
          });
        }
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

  static verifyDropdownIsVisibleUnderFieldset(
    dropdownLabel: string,
    fieldsetLabel: string,
  ): void {
    cy.contains('fieldset', fieldsetLabel, { matchCase: false }).then(
      ($fieldset) => {
        DropdownElement.findDropdownWithin($fieldset, dropdownLabel).should(
          'be.visible',
        );
      },
    );
  }
}
