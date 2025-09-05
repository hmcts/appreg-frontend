import { When } from '@badeball/cypress-cucumber-preprocessor';

import { AuthHelper } from '../../../support/helper/auth/AuthHelper';

When('User Clears Cookies And Storage', () => {
  AuthHelper.clearCookiesAndStorage();
});

When('User Refreshes The Page', () => {
  AuthHelper.pageRefresh();
});
