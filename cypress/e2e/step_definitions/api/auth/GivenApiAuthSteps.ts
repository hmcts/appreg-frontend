import { Given } from '@badeball/cypress-cucumber-preprocessor';

import { ApiAuthHelper } from '../../../../support/helper/api/auth/ApiAuthHelper';

Given('User Authenticates Via API As {string}', (user: string) => {
  ApiAuthHelper.authenticateUser(user);
});