/// <reference types="cypress" />
import {
  AUTH_CONSTANTS,
  TIMEOUT_CONSTANTS,
} from '../../constants/ProjectConstants';
import { NavigationPage } from '../../pageobjects/pageelements/NavigationPage';

export class MicrosoftAuthHelper {
  static performLogin(email: string, password: string): void {
    cy.screenshot('03-Microsoft-Login-Page');

    // Stage 1: complete the initial Microsoft username/password flow.
    // This origin block should stop at the password submit because Azure can
    // either redirect straight back to the app or keep the user on a
    // follow-up Microsoft prompt.
    cy.origin(
      'https://login.microsoftonline.com',
      { args: { email, password } },
      ({ email: innerEmail, password: innerPassword }) => {
        const emailSel =
          'input[name="loginfmt"], input[name="signInName"], input[name="logonIdentifier"], #email, input[type="email"]';
        const passSel =
          'input[name="passwd"], input[name="password"], #password, input[type="password"]';

        // Re-query the active Microsoft page element every time. Azure often
        // swaps the form DOM between validations, so stale element handles are
        // a common source of detached-element failures here.
        const getVisible = (sel: string) =>
          cy
            .get(sel, { timeout: 30000 })
            .filter(':visible')
            .first()
            .scrollIntoView()
            .should('be.visible')
            .and('be.enabled');

        // Type and verify against a fresh lookup on each attempt. If Azure
        // mutates the input mid-type, retry once more slowly before failing.
        const typeExact = (
          sel: string,
          value: string,
          label: string,
          delay = 35,
        ): void => {
          getVisible(sel)
            .clear({ force: true })
            .type(value, { log: false, delay })
            .invoke('val')
            .then((typedValue) => {
              const got = (typedValue || '').toString().length;
              const want = value.length;

              if (got === want) {
                return;
              }

              if (delay >= 60) {
                throw new Error(
                  `Failed to type full ${label}: got ${got}/${want}`,
                );
              }

              cy.log(`Retry typing ${label}: got ${got}/${want}, retry slower`);
              typeExact(sel, value, label, 60);
            });
        };

        // The Microsoft "Next"/"Sign in" button keeps a stable id even when
        // the surrounding form changes between email and password steps.
        const clickSubmit = () => {
          getVisible('#idSIButton9').click();
        };

        // Stage 1a: submit the email address to move onto the password screen.
        cy.log('Entering email...');
        typeExact(emailSel, innerEmail, 'email');

        clickSubmit();

        // Stage 1b: enter the password on the second Microsoft screen and
        // submit it. Do not queue any more Microsoft-origin commands here.
        // The next screen may already be back on the app origin.
        cy.log('Entering password (next page)...');
        typeExact(passSel, innerPassword, 'password');
        clickSubmit();
      },
    );

    // Stage 2: decide whether Microsoft has already redirected back to the
    // app or whether we still need to dismiss a Microsoft follow-up prompt.
    cy.location('hostname', { timeout: 10000 }).then((hostname) => {
      if (!hostname.includes(AUTH_CONSTANTS.MICROSOFT_LOGIN_DOMAIN)) {
        return;
      }

      cy.log('Microsoft SSO: still on Microsoft origin after password submit');

      // Only re-enter the Microsoft origin when we are definitely still on it.
      // This avoids the earlier race where Cypress tried to run Microsoft
      // commands after Azure had already navigated back to localhost.
      cy.origin('https://login.microsoftonline.com', () => {
        // The guarded branch means this is the follow-up Microsoft page. Make
        // the redirecting click the final command in this origin so Cypress has
        // no Microsoft-page work left to execute after the app loads.
        cy.get('#idBtn_Back', { timeout: 10000 })
          .should('be.visible')
          .and('be.enabled')
          .click();
      });
    });

    // Stage 3: wait for the browser to leave Microsoft and land back in the
    // application before the wider auth helper continues with app assertions.
    cy.location('hostname', {
      timeout: TIMEOUT_CONSTANTS.LONG_TIMEOUT,
    }).should('not.include', AUTH_CONSTANTS.MICROSOFT_LOGIN_DOMAIN);
    cy.screenshot('04-After-Microsoft-Auth');
  }

  static performSignOut(): void {
    // Click the app's sign out link or button
    NavigationPage.signOutLink().click();
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
    cy.url({ timeout: TIMEOUT_CONSTANTS.LONG_TIMEOUT }).should(
      'include',
      '/login',
    );
  }
}
