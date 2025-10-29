import { When } from '@badeball/cypress-cucumber-preprocessor';

import { AuthErrorScenarios } from '../../../support/helper/auth/AuthErrorScenarios';
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
  'User Signs In With SSO Credentials {string} and {string}',
  (emailSSO: string, passwordSSO: string) => {
    AuthHelper.signInWithMicrosoftSSO(emailSSO, passwordSSO);
    cy.screenshot(`SSOLogin-${emailSSO}`);
  },
);

When('User Clears Cookies And Storage', () => {
  AuthHelper.clearCookiesAndStorage();
});

When(
  'User Tries To Sign In With Invalid Email {string} And Expects Error {string}',
  (invalidEmail: string, expectedError: string) => {
    AuthErrorScenarios.signInWithInvalidEmailAndVerifyError(
      invalidEmail,
      expectedError,
    );
  },
);

When(
  'User Tries To Sign In With Valid Email {string} And Invalid Password {string} And Expects Error {string}',
  (validEmail: string, invalidPassword: string, expectedError: string) => {
    AuthErrorScenarios.signInWithValidEmailInvalidPasswordAndVerifyError(
      validEmail,
      invalidPassword,
      expectedError,
    );
  },
);
