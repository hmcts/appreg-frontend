/// <reference types="cypress" />

import { When } from '@badeball/cypress-cucumber-preprocessor';

When(
  'User Clicks {string} Then {string} From The Page Header Menu',
  (toggleButtonText: string, menuItemText: string) => {
    cy.get('.moj-page-header-actions')
      .contains('button.moj-button-menu__toggle-button', toggleButtonText)
      .should('be.enabled')
      .click();

    cy.get('.moj-page-header-actions')
      .contains('button.moj-button-menu__item', menuItemText)
      .should('be.visible')
      .and('be.enabled')
      .click();
  },
);
