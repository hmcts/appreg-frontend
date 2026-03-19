/// <reference types="cypress" />
import { TableElement } from '../../pageobjects/generic/table/TableElement';

import { TableSearch } from './TableSearch';

/**
 * Handles table interaction operations (clicks, buttons, menus)
 */
export class TableInteraction {
  /**
   * Clicks a button element
   */
  static clickButton(button: JQuery<HTMLElement>): void {
    cy.wrap(button)
      .scrollIntoView()
      .should('be.visible')
      .and('not.be.disabled')
      .click();
  }

  /**
   * Clicks on a table header to trigger sorting
   */
  static clickTableHeader(caption: string, headerText: string): void {
    cy.log(`Clicking on table header "${headerText}" in table "${caption}"`);

    TableElement.findTable(caption)
      .find('thead th')
      .contains(headerText)
      .closest('th')
      .find('button')
      .click();

    cy.wait(500);
  }

  /**
   * Selects an option from a menu button within a specific table row
   */
  static clickMenuButtonInTableRow(
    tableCaption: string,
    columnValues: Record<string, string>,
    menuButtonText: string,
    selectButtonText: string,
  ): Cypress.Chainable<void> {
    return TableSearch.searchWithPagination(
      columnValues,
      tableCaption,
      true,
      (row) => {
        return TableElement.getButtonInRow(row, selectButtonText)
          .then((button) => {
            TableInteraction.clickButton(button);
          })
          .then(() => TableElement.getMenuButtonInRow(row, menuButtonText))
          .then((menuButton) => {
            TableInteraction.clickButton(menuButton);
          }) as unknown as Cypress.Chainable<void>;
      },
    ).then((found) => {
      if (!found) {
        throw new Error(
          `Row with specified values not found in table "${tableCaption}" to select menu button "${menuButtonText}"`,
        );
      }
    }) as unknown as Cypress.Chainable<void>;
  }

  /**
   * Finds a row by values, clicks a button, and verifies menu options
   */
  static verifyButtonsInTableRow(
    tableCaption: string,
    columnValues: Record<string, string>,
    selectButtonText: string,
    expectedMenuOptions: string[],
  ): Cypress.Chainable<void> {
    return TableSearch.searchWithPagination(
      columnValues,
      tableCaption,
      true,
      (row) => {
        return TableElement.getButtonInRow(row, selectButtonText)
          .then((button) => {
            TableInteraction.clickButton(button);
          })
          .then(() => {
            cy.log(`Expected Menu Options: ${expectedMenuOptions.join(', ')}`);
          })
          .then(() => {
            for (const btnText of expectedMenuOptions) {
              cy.log(`Verifying menu button: ${btnText}`);
              TableElement.getMenuButtonInRow(row, btnText).should(
                'be.visible',
              );
            }
          })
          .then(() => {
            cy.screenshot('menu-buttons-verified');
          }) as unknown as Cypress.Chainable<void>;
      },
    ).then((found) => {
      if (!found) {
        throw new Error(
          `Row with specified values not found in table "${tableCaption}" to verify menu options: ${expectedMenuOptions.join(', ')}`,
        );
      }
    }) as unknown as Cypress.Chainable<void>;
  }

  static checkCheckboxInTableRow(
    tableCaption: string,
    columnValues: Record<string, string>,
  ): Cypress.Chainable<void> {
    return TableSearch.searchWithPagination(
      columnValues,
      tableCaption,
      true,
      (row) => {
        return TableElement.getCheckboxInRow(row).then((checkbox) => {
          cy.wrap(checkbox)
            .scrollIntoView()
            .should('exist')
            .and('not.be.disabled')
            .check({ force: true });
        }) as unknown as Cypress.Chainable<void>;
      },
    ).then((found) => {
      if (!found) {
        throw new Error(
          `Row with specified values not found in table "${tableCaption}" to check checkbox`,
        );
      }
    }) as unknown as Cypress.Chainable<void>;
  }

  /**
   * Checks the "Select all" checkbox in the table header to select all rows
   * @param tableCaption Caption of the table to scope the checkbox search
   */
  static checkSelectAllCheckbox(tableCaption: string): void {
    cy.log(`Checking the "Select all" checkbox in table "${tableCaption}"`);
    TableElement.getSelectAllCheckbox(tableCaption)
      .scrollIntoView()
      .should('exist')
      .and('not.be.disabled')
      .check({ force: true });
  }
}
