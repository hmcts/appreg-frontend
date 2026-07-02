/// <reference types="cypress" />
import {
  AUTH_CONSTANTS,
  TIMEOUT_CONSTANTS,
} from '../../constants/ProjectConstants';
import { NavigationPage } from '../../pageobjects/pageelements/NavigationPage';

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

        // Helper to handle optional "Stay signed in?" prompt
        const handleStaySignedInPromptIfPresent = () => {
          cy.get('body', { timeout: 15000 })
            .should(($body) => {
              const bodyText = $body.text();

              const isStaySignedInPrompt =
                bodyText.includes('Stay signed in') ||
                bodyText.includes('Keep me signed in');

              const hasNoButton =
                $body.find('#idBtn_Back').filter((_, el) => {
                  const value = (
                    (el as HTMLInputElement).value ||
                    el.textContent ||
                    ''
                  )
                    .toString()
                    .trim();

                  return /^no$/i.test(value);
                }).length > 0;

              expect(
                isStaySignedInPrompt || hasNoButton,
                'Stay signed in prompt or No button should appear',
              ).to.eq(true);
            })
            .then(($body) => {
              const bodyText = $body.text();

              const isStaySignedInPrompt =
                bodyText.includes('Stay signed in') ||
                bodyText.includes('Keep me signed in');

              if (!isStaySignedInPrompt) {
                cy.log(
                  'Microsoft SSO: Stay signed in prompt not present; skipping #idBtn_Back',
                );
                return;
              }

              cy.log('Microsoft SSO: Stay signed in prompt detected');

              cy.get('#idBtn_Back', { timeout: 10000 }).then(($btn) => {
                const value = ($btn.val() || $btn.text() || '')
                  .toString()
                  .trim();

                if (!/^no$/i.test(value)) {
                  throw new Error(
                    `Microsoft SSO: expected #idBtn_Back to be "No", but found "${value}"`,
                  );
                }

                cy.wrap($btn)
                  .should('be.visible')
                  .should('be.enabled')
                  .click();
              });
            });
        };

        // Enter email
        cy.log('Entering email...');
        typeExact(emailSel, innerEmail, 'email');

        // Submit email to proceed to password page
        clickSubmit();
        cy.log('Entering password (next page)...');
        typeExact(passSel, innerPassword, 'password');
        clickSubmit();

        // Wait for and handle optional "Stay signed in?" prompt
        handleStaySignedInPromptIfPresent();
      },
    );

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
