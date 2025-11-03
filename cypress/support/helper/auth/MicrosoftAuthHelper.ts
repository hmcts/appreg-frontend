/// <reference types="cypress" />
import {
  APP_URLS,
  TIMEOUT_CONSTANTS,
  UI_CONSTANTS,
} from '../../constants/ProjectConstants';
import { LinkHelper } from '../forms/link/LinkHelper';

export class MicrosoftAuthHelper {
  static performLogin(email: string, password: string): void {
    cy.origin(
      'https://login.microsoftonline.com',
      { args: { email, password } },
      ({ email: innerEmail, password: innerPassword }) => {
        cy.log('Entering email...');
        cy.get('input[name="loginfmt"]')
          .should('be.visible')
          .type(innerEmail, { log: false });
        cy.get('input[type="submit"]').click();

        cy.log('Entering password...');
        cy.get('input[name="passwd"]')
          .should('be.visible')
          .type(innerPassword, { log: false });
        cy.get('input[type="submit"]').should('be.visible').click();

        cy.log('Clicking "No" on Stay Signed In prompt...');
        cy.get('#idBtn_Back').should('be.visible').click();

        // Wait for Microsoft to initiate the redirect
        // The page will start redirecting away from Microsoft
        cy.log('Waiting for redirect to start...');
        cy.wait(2000);
      },
    );
  }

  static performSignOut(): void {
    // Click the app's sign out link or button
    LinkHelper.clickLink(UI_CONSTANTS.BUTTON_TEXT_SIGN_OUT);
    cy.log('AAD logout initiated');

    // If redirected to Microsoft account picker, click the user tile to fully sign out
    cy.origin('https://login.microsoftonline.com', () => {
      cy.get('body', { timeout: 10000 }).then(($body) => {
        if ($body.find('.table-cell.tile-img > .tile-img').length) {
          cy.get('.table-cell.tile-img > .tile-img')
            .should('be.visible')
            .click();
        }
      });
    });

    // Verify signed-out state in app
    cy.visit(APP_URLS.HOME);
    cy.contains(/sign in|login/i, {
      timeout: TIMEOUT_CONSTANTS.DEFAULT_TIMEOUT,
    }).should('be.visible');
  }
}
