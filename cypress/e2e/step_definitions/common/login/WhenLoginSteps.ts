import { When } from '@badeball/cypress-cucumber-preprocessor';
import { ButtonHelper } from '../../../../support/helper/forms/button/ButtonHelper';
import { TextboxHelper } from '../../../../support/helper/forms/textbox/TextboxHelper';

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
    ({ emailSSO, passwordSSO }) => {
      // Wait for page load and verify we're on the correct page
      cy.wait(2000, { log: false });
      cy.location('hostname', { timeout: 20000, log: false }).should('eq', 'login.microsoftonline.com', { log: false });
      cy.document({ log: false }).should('not.have.property', 'documentMode', { log: false });
      
      // Enter email and submit
      TextboxHelper.typeInTextbox('@loginfmt', emailSSO);
      ButtonHelper.clickButton('[type="submit"]');

      // Enter password and submit
      cy.wait(2000, { log: false });
      TextboxHelper.typeInTextbox('@passwd', passwordSSO);
      ButtonHelper.clickButton('[type="submit"]');

      // Handle "Stay signed in" prompt
      cy.wait(2000, { log: false });
      ButtonHelper.isButtonVisible('#idBtn_Back');
      ButtonHelper.clickButton('#idBtn_Back');
    }
  );
});