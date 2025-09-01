import { When } from '@badeball/cypress-cucumber-preprocessor';

import { ButtonHelper } from '../../../../support/helper/forms/button/ButtonHelper';

When('User Signs In With Microsoft SSO As {string}', (userType: string) => {
  const ssoUsers = Cypress.env('SSO_USERS');
  const user = ssoUsers[userType] || ssoUsers['default'];

  if (!user) {
    throw new Error(`SSO user type "${userType}" not found in configuration`);
  }

  const emailSSO = user.email;
  const passwordSSO = user.password;

  ButtonHelper.clickButton('Sign in');

  // Handle Microsoft login page
  cy.origin(
    'https://login.microsoftonline.com',
    { args: { emailSSO, passwordSSO } },
    ({ emailSSO: email, passwordSSO: password }) => {
      // Wait for page load and verify we're on the correct page
      cy.wait(2000, { log: false });
      cy.location('hostname', { timeout: 20000, log: false }).should('eq', 'login.microsoftonline.com', { log: false });
      cy.document({ log: false }).should('not.have.property', 'documentMode', { log: false });

      // Enter email and submit
      cy.get('input[name="loginfmt"]')
        .should('be.visible')
        .should('be.enabled')
        .type(email);

      // Click Next
      cy.get('input[type="submit"]').click();

      // Enter password
      cy.get('input[name="passwd"]')
        .should('be.visible')
        .should('be.enabled')
        .type(password);

      // Click Sign in
      cy.get('input[type="submit"]')
        .should('be.visible')
        .click();

      // Handle "Stay signed in" prompt
      cy.wait(2000, { log: false });
      cy.get('#idBtn_Back')
        .should('be.visible')
        .click();
    }
  );
});