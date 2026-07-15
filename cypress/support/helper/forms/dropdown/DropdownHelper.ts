/// <reference types="cypress" />
import { DropdownElement } from '../../../pageobjects/generic/dropdown/DropdownElement';

export class DropdownHelper {
  private static normalise(value: string): string {
    return value.replaceAll('\u00a0', ' ').trim().toLowerCase();
  }

  private static retryUntil(
    check: () => Cypress.Chainable<boolean>,
    failureMessage: string,
    timeoutMs: number = 5000,
    intervalMs: number = 250,
  ): Cypress.Chainable<void> {
    const startedAt = Date.now();

    const attempt = (): Cypress.Chainable<void> =>
      check().then((passed) => {
        if (passed) {
          return;
        }

        if (Date.now() - startedAt >= timeoutMs) {
          throw new Error(failureMessage);
        }

        return cy.wait(intervalMs).then(attempt);
      });

    return attempt();
  }

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
        return cy
          .wrap($dropdown)
          .find('option')
          .then(($options) => {
            const match = [...$options].find(
              (o) =>
                o.textContent?.trim().toLowerCase() === option.toLowerCase(),
            );

            if (!match) {
              throw new Error(`Option "${option}" not found in select`);
            }

            return cy.wrap($dropdown).select(match.value);
          });
      } else {
        // For custom dropdowns
        return cy
          .wrap($dropdown)
          .click()
          .then(() =>
            cy
              .contains(
                '.dropdown [role="option"], .select [role="option"], .dropdown__option, .select__option',
                option,
                { matchCase: false },
              )
              .click(),
          )
          .then(() => cy.wrap($dropdown).should('contain.text', option));
      }
    });
  }

  static verifyDropdownIsVisible(dropdownLabel: string): void {
    DropdownElement.findDropdown(dropdownLabel).should('be.visible');
  }

  static verifyDropdownOptionSelected(
    dropdownLabel: string,
    optionText: string,
  ): Cypress.Chainable<void> {
    const expected = this.normalise(optionText);

    return this.retryUntil(
      () =>
        DropdownElement.findDropdown(dropdownLabel).then(($dropdown) => {
          if (!$dropdown.is('select')) {
            throw new Error(
              `Dropdown "${dropdownLabel}" is not a native select`,
            );
          }

          const actual = this.normalise(
            $dropdown.find('option:selected').text(),
          );
          return actual === expected;
        }),
      `Dropdown "${dropdownLabel}" did not select "${optionText}" within 5000ms`,
    );
  }

  static verifyDropdownOptionNotSelected(
    dropdownLabel: string,
    optionText: string,
  ): Cypress.Chainable<void> {
    const expected = this.normalise(optionText);

    return this.retryUntil(
      () =>
        DropdownElement.findDropdown(dropdownLabel).then(($dropdown) => {
          if (!$dropdown.is('select')) {
            throw new Error(
              `Dropdown "${dropdownLabel}" is not a native select`,
            );
          }

          const actual = this.normalise(
            $dropdown.find('option:selected').text(),
          );
          return actual !== expected;
        }),
      `Dropdown "${dropdownLabel}" was still set to "${optionText}" after 5000ms`,
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

  static selectDropdownOptionUnderFieldset(
    dropdownLabel: string,
    optionText: string,
    fieldsetLabel: string,
  ): void {
    cy.contains('fieldset', fieldsetLabel, { matchCase: false }).then(
      ($fieldset) => {
        DropdownElement.findDropdownWithin($fieldset, dropdownLabel).then(
          ($dropdown) => {
            if (!$dropdown || $dropdown.length === 0) {
              throw new Error(
                `Dropdown "${dropdownLabel}" not found within fieldset "${fieldsetLabel}"`,
              );
            }
            if ($dropdown.is('select')) {
              cy.wrap($dropdown).select(optionText);
            } else {
              cy.wrap($dropdown)
                .click()
                .then(() =>
                  cy
                    .contains(
                      '.dropdown [role="option"], .select [role="option"], .dropdown__option, .select__option',
                      optionText,
                      { matchCase: false },
                    )
                    .click(),
                )
                .then(() =>
                  cy.wrap($dropdown).should('contain.text', optionText),
                );
            }
          },
        );
      },
    );
  }

  static verifyDropdownOptionSelectedUnderFieldset(
    dropdownLabel: string,
    optionText: string,
    fieldsetLabel: string,
  ): void {
    cy.contains('fieldset', fieldsetLabel, { matchCase: false }).then(
      ($fieldset) => {
        DropdownElement.findDropdownWithin($fieldset, dropdownLabel).then(
          ($dropdown) => {
            if (!$dropdown || $dropdown.length === 0) {
              throw new Error(
                `Dropdown "${dropdownLabel}" not found within fieldset "${fieldsetLabel}"`,
              );
            }
            DropdownHelper.verifyDropdownOptionSelected(
              dropdownLabel,
              optionText,
            );
          },
        );
      },
    );
  }
}
