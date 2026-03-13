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
      const $nextButton = TableElement.getEnabledNextPaginationButton($body);
      if ($nextButton.length > 0) {
        // Capture current page before clicking
        const currentPage = TableElement.getCurrentPageNumber($body);

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
            .then(() => {
              // Verify page actually changed
              return cy.get('body').then(($newBody) => {
                const newPage = TableElement.getCurrentPageNumber($newBody);
                if (newPage === currentPage) {
                  // Page didn't change, stop pagination
                  cy.log(
                    `Page did not change (still on page ${currentPage}), stopping pagination`,
                  );
                  return false;
                }
                return true;
              });
            });
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

  /**
   * Navigates to first page by clicking page 1 link
   * @returns True if navigated, false if already on page 1
   */
  static navigateToFirstPage(): Cypress.Chainable<boolean> {
    return cy.get('body').then(($body) => {
      const $page1Link = TableElement.getFirstPageLink($body);
      // Check if we're already on page 1 (current page has aria-current="page")
      if ($page1Link.attr('aria-current') === 'page') {
        return cy.wrap(false);
      }
      if ($page1Link.length > 0) {
        return cy
          .wrap($page1Link.first())
          .click({ force: true })
          .then(() => {
            cy.wait(500);
            return cy
              .get('table')
              .should('be.visible')
              .and('not.have.class', 'animating');
          })
          .then(() => true);
      }
      return cy.wrap(false);
    });
  }

  /**
   * Checks if table has multiple pages
   * @returns True if pagination exists with more than one page
   */
  static hasMultiplePages(): Cypress.Chainable<boolean> {
    return cy.get('body').then(($body) => {
      const $pagination = TableElement.getPaginationContainer($body);
      if ($pagination.length === 0) {
        return cy.wrap(false);
      }
      const $pageLinks = TableElement.getPageLinks($body);
      return cy.wrap($pageLinks.length > 1);
    });
  }
}
