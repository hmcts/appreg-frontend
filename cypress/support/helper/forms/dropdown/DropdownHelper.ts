import { DropdownElement } from '../../../pageobjects/generic/dropdown/DropdownElement';

export class DropdownHelper {
  /**
   * Selects an option from a dropdown by its label and option text
   * @param dropdownLabel The label of the dropdown
   * @param optionText The visible text of the option to select
   */
  static selectDropdownOption(dropdownLabel: string, optionText: string): void {
    DropdownElement.findDropdown(dropdownLabel).select(optionText);
  }

  static verifyDropdownOptionSelected(
    dropdownLabel: string,
    optionText: string,
  ): void {
    DropdownElement.findDropdown(dropdownLabel).should(
      'have.value',
      optionText,
    );
  }

  static verifyDropdownOptionNotSelected(
    dropdownLabel: string,
    optionText: string,
  ): void {
    DropdownElement.findDropdown(dropdownLabel).should(
      'not.have.value',
      optionText,
    );
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
