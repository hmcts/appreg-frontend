import { Then, When } from '@badeball/cypress-cucumber-preprocessor';

import { AuthHelper } from '../../../support/helper/auth/AuthHelper';

When('User Signs In With Microsoft SSO As {string}', (userType: string) => {
  const ssoUsers = Cypress.env('SSO_USERS');
  const user = ssoUsers[userType] || ssoUsers['default'];
  if (!user) {
    throw new Error(`SSO user type "${userType}" not found in configuration`);
  }
  AuthHelper.signInWithMicrosoftSSO(user.email, user.password);
  cy.screenshot(`SSOLogin-${userType}`);
});

When(
  'the user signs in with SSO credentials {string} and {string}',
  (emailSSO: string, passwordSSO: string) => {
    AuthHelper.signInWithMicrosoftSSO(emailSSO, passwordSSO);
    cy.screenshot(`SSOLogin-${emailSSO}`);
  },
);

Then('User Signs Out From The Application', () => {
  AuthHelper.aadSignOut();
  cy.screenshot('AADSignOut');
});

When('User Clears Cookies And Storage', () => {
  AuthHelper.clearCookiesAndStorage();
});

When('User Refreshes The Page', () => {
  AuthHelper.pageRefresh();
});
