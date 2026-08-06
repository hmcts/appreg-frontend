import { Then } from '@badeball/cypress-cucumber-preprocessor';

import { AuthHelper } from '../../../support/helper/auth/AuthHelper';
import { SessionValidator } from '../../../support/helper/auth/SessionValidator';

Then('User Verify The {string} Cookie Should Exist', (cookieName: string) => {
  SessionValidator.verifyCookieExists(cookieName);
});

Then(
  'User Verify The {string} Cookie Should Not Exist',
  (cookieName: string) => {
    SessionValidator.verifyCookieNotExists(cookieName);
  },
);

Then('User Verify The Session Is Valid', () => {
  SessionValidator.verifySessionIsValid();
});

Then('User Signs Out From The Application', () => {
  AuthHelper.aadSignOut();
  cy.screenshot('AADSignOut');
});
