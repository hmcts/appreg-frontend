/// <reference types="cypress" />

import { TableElement } from '../../pageobjects/generic/table/TableElement';

/**
 * Handles table pagination and navigation logic
 */
export class TableNavigation {
  /**
   * Navigates to the next page if available
   * @returns True if next page exists and navigation succeeded, false otherwise
   */
  static goToNextPageIfExists(): Cypress.Chainable<boolean> {
    return cy.get('body').then(($body) => {
      const $nextButton = TableElement.getNextPaginationButton($body);
      if ($nextButton.length > 0) {
        return cy.get('body').then(($freshBody) => {
          const $freshButton = TableElement.getNextPaginationButton($freshBody);
          return cy
            .wrap($freshButton.first())
            .click({ force: true })
            .then(() => {
              cy.wait(500);
              return cy
                .get('table')
                .should('be.visible')
                .and('not.have.class', 'animating');
            })
            .then(() => true);
        });
      }
      return cy.wrap(false);
    });
  }

  /**
   * Navigates to last page recursively
   * @returns True if navigated to a different page, false if already on last page
   */
  static navigateToLastPage(): Cypress.Chainable<boolean> {
    return cy.get('body').then(($body) => {
      const $nextButton = TableElement.getEnabledNextPaginationButton($body);
      if ($nextButton.length === 0) {
        return cy.wrap(false);
      }
      // Re-query to prevent element detachment
      return cy.get('body').then(($freshBody) => {
        const $freshButton =
          TableElement.getEnabledNextPaginationButton($freshBody);
        return cy
          .wrap($freshButton.first())
          .click({ force: true })
          .then(() => {
            cy.wait(500);
            return cy
              .get('table')
              .should('be.visible')
              .and('not.have.class', 'animating');
          })
          .then(() => TableNavigation.navigateToLastPage())
          .then(() => true);
      });
    });
  }
}
