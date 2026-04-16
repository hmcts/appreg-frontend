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

    cy.get('table').should('be.visible').and('not.have.class', 'animating');
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
    // Wait for table to be visible before searching
    cy.contains('caption', tableCaption, { timeout: 20000 }).should(
      'be.visible',
    );

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
   * Finds a row by column values and clicks a single (non-menu) button in that row.
   * Use this when the row has a plain button (e.g. "Select") with no dropdown.
   * @param tableCaption Caption of the table to scope the search
   * @param columnValues Key-value pairs matching the target row
   * @param buttonText Text of the button to click
   */
  static clickButtonInTableRow(
    tableCaption: string,
    columnValues: Record<string, string>,
    buttonText: string,
  ): Cypress.Chainable<void> {
    return TableSearch.searchWithPagination(
      columnValues,
      tableCaption,
      true,
      (row) => {
        return TableElement.getButtonInRow(row, buttonText).then((button) => {
          TableInteraction.clickButton(button);
        }) as unknown as Cypress.Chainable<void>;
      },
    ).then((found) => {
      if (!found) {
        throw new Error(
          `Row with specified values not found in table "${tableCaption}" to click button "${buttonText}"`,
        );
      }
    }) as unknown as Cypress.Chainable<void>;
  }

  /**
   * Clicks a menu item from the Actions button menu in a table caption
   * @param tableCaption Caption of the table to scope the search
   * @param toggleButtonText Text of the toggle button to open the menu (e.g. "Actions")
   * @param menuItemText Text of the menu item to click (e.g. "Result selected")
   */
  static clickCaptionMenuButton(
    tableCaption: string,
    toggleButtonText: string,
    menuItemText: string,
  ): void {
    cy.log(
      `Clicking "${menuItemText}" from "${toggleButtonText}" caption menu in table "${tableCaption}"`,
    );
    TableElement.getCaptionMenuToggle(tableCaption, toggleButtonText)
      .scrollIntoView()
      .should('be.visible')
      .click()
      .then(() => {
        TableElement.getCaptionMenuItem(tableCaption, menuItemText)
          .scrollIntoView()
          .should('be.visible')
          .click();
      });
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
