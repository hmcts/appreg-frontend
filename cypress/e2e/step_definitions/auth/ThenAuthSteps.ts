import { Then } from '@badeball/cypress-cucumber-preprocessor';

import { AuthHelper } from '../../../support/helper/auth/AuthHelper';

Then('User Verify The {string} Cookie Should Exist', (cookieName: string) => {
  AuthHelper.verifyCookieExists(cookieName);
});

Then(
  'User Verify The {string} Cookie Should Not Exist',
  (cookieName: string) => {
    AuthHelper.verifyCookieNotExists(cookieName);
  },
);

Then('User Should Not See The Element {string}', (element: string) => {
  AuthHelper.verifyElementNotVisible(element);
});

Then('User Should See The Element {string}', (element: string) => {
  AuthHelper.verifyElementVisible(element);
});
