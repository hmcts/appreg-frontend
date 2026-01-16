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
        const emailSel = 'input[name="loginfmt"], input[name="signInName"], input[name="logonIdentifier"], #email, input[type="email"]';
        const passSel = 'input[name="passwd"], input[name="password"], #password, input[type="password"]';

        // Helper to get visible, enabled element
        const getVisible = (sel: string) =>
          cy.get(sel, { timeout: 30000 }).filter(':visible').first().should('be.enabled').scrollIntoView();

        // Helper to type with retry and verification
        const typeExact = (sel: string, value: string, label: string) =>
          getVisible(sel).then(($input) => {
            const tryType = (delay: number): void => {
              cy.wrap($input).clear({ force: true });
              cy.wait(150);
              cy.wrap($input).type(value, { log: false, delay });
              cy.wrap($input)
                .invoke('val')
                .then((v) => {
                  const got = (v || '').toString().length;
                  const want = value.length;
                  if (got !== want) {
                    if (delay >= 60) {throw new Error(`Failed to type full ${label}: got ${got}/${want}`);}
                    cy.log(`Retry typing ${label}: got ${got}/${want}, retry slower`);
                    tryType(60);
                  }
                });
            };
            tryType(35);
          });

        // Helper to click submit button
        const clickSubmit = () => {
          cy.get('body').then(($body) => {
            const $btn = $body
              .find('button, input[type="submit"]')
              .filter((_, el) => {
                const element = el as HTMLElement;
                const text = element.innerText || ('value' in element ? (element as HTMLInputElement).value : '') || '';
                return /^(sign in|continue|next|yes)$/i.test(text.trim());
              })
              .first();
            if ($btn.length) {
              cy.wrap($btn).click({ force: true });
            } else {
              cy.get('input[type="submit"]').first().click({ force: true });
            }
          });
        };

        // Enter email
        cy.log('Entering email...');
        typeExact(emailSel, innerEmail, 'email');
        cy.screenshot('Microsoft-01-Email-Entered');

        // Check if password is on same page or next page
        cy.get('body').then(($b) => {
          const hasPassHere = $b.find(passSel).length > 0;

          if (hasPassHere) {
            cy.wait(250);
            cy.log('Entering password (same page)...');
            typeExact(passSel, innerPassword, 'password');
            cy.screenshot('Microsoft-02-Password-Entered');
            clickSubmit();
          } else {
            clickSubmit();
            cy.wait(250);
            cy.log('Entering password (next page)...');
            typeExact(passSel, innerPassword, 'password');
            cy.screenshot('Microsoft-02-Password-Entered');
            clickSubmit();
          }
        });

        // Handle "Stay signed in?" prompt
        cy.get('body', { timeout: 20000 }).then(($body) => {
          const text = $body.text();
          if (/Stay signed in\?/i.test(text)) {
            cy.log('Handling "Stay signed in?" prompt...');
            cy.get('#idBtn_Back, button:contains("No")').first().should('be.visible').click({ force: true });
            cy.screenshot('Microsoft-03-Stay-Signed-In-Handled');
          }
        });
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
