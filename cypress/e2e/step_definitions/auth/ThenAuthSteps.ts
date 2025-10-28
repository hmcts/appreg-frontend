import { Then } from '@badeball/cypress-cucumber-preprocessor';

import { SessionValidator } from '../../../support/helper/auth/SessionValidator';
import { MicrosoftAuthHelper } from '../../../support/helper/auth/MicrosoftAuthHelper';

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
  MicrosoftAuthHelper.performSignOut();
  cy.screenshot('AADSignOut');
});
