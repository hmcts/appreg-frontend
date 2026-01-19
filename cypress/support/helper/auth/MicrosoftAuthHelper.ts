/// <reference types="cypress" />
import {
  APP_URLS,
  TIMEOUT_CONSTANTS,
  UI_CONSTANTS,
} from '../../constants/ProjectConstants';
import { LinkHelper } from '../forms/link/LinkHelper';

export class MicrosoftAuthHelper {
  static performLogin(email: string, password: string): void {
    cy.screenshot('03-Microsoft-Login-Page');

    cy.origin(
      'https://login.microsoftonline.com',
      { args: { email, password } },
      ({ email: innerEmail, password: innerPassword }) => {
        const emailSel =
          'input[name="loginfmt"], input[name="signInName"], input[name="logonIdentifier"], #email, input[type="email"]';
        const passSel =
          'input[name="passwd"], input[name="password"], #password, input[type="password"]';

        // Helper to get visible, enabled element
        const getVisible = (sel: string) =>
          cy
            .get(sel, { timeout: 30000 })
            .filter(':visible')
            .first()
            .should('be.enabled')
            .scrollIntoView();

        // Helper to type with retry and verification
        const typeExact = (sel: string, value: string, label: string) =>
          getVisible(sel).then(($input) => {
            const tryType = (delay: number): void => {
              cy.wrap($input).clear({ force: true });
              cy.wrap($input).type(value, { log: false, delay });
              cy.wrap($input)
                .invoke('val')
                .then((v) => {
                  const got = (v || '').toString().length;
                  const want = value.length;
                  if (got !== want) {
                    if (delay >= 60) {
                      throw new Error(
                        `Failed to type full ${label}: got ${got}/${want}`,
                      );
                    }
                    cy.log(
                      `Retry typing ${label}: got ${got}/${want}, retry slower`,
                    );
                    tryType(60);
                  }
                });
            };
            tryType(35);
          });

        // Helper to click submit button
        const clickSubmit = () => {
          // Microsoft Next / Sign in button id is stable
          cy.get('#idSIButton9', { timeout: 20000 })
            .should('be.visible')
            .should('be.enabled')
            .click();
        };

        // Enter email
        cy.log('Entering email...');
        typeExact(emailSel, innerEmail, 'email');

        // Submit email to proceed to password page
        clickSubmit();
        cy.log('Entering password (next page)...');
        typeExact(passSel, innerPassword, 'password');
        clickSubmit();

        // Wait for and handle "Stay signed in?" prompt
        cy.get('#idBtn_Back', { timeout: 15000 })
          .should('be.visible')
          .should('be.enabled')
          .click();
      },
    );

    // Wait for callback to process, then navigate to applications list
    cy.log('Waiting for OAuth callback to complete...');

    // Visit applications list directly to complete the flow
    cy.visit(APP_URLS.APPLICATIONS_LIST, { timeout: 30000 });

    // Verify session is established
    cy.request('/sso/me').its('status').should('eq', 200);
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
