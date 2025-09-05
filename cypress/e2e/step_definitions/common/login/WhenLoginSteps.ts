import { When } from '@badeball/cypress-cucumber-preprocessor';

import { AuthHelper } from '../../../../support/helper/auth/AuthHelper';

When('User Signs In With Microsoft SSO As {string}', (userType: string) => {
  const ssoUsers = Cypress.env('SSO_USERS');
  const user = ssoUsers[userType] || ssoUsers['default'];
  if (!user) {
    throw new Error(`SSO user type "${userType}" not found in configuration`);
  }
  AuthHelper.signInWithMicrosoftSSO(user.email, user.password);
});

When(
  'the user signs in with SSO credentials {string} and {string}',
  (emailSSO: string, passwordSSO: string) => {
    AuthHelper.signInWithMicrosoftSSO(emailSSO, passwordSSO);
  },
);
