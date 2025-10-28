import { Then } from '@badeball/cypress-cucumber-preprocessor';

import { ApiHelper } from '../../../support/helper/api/ApiHelper';

Then(
  'User Verify API Request Returns Status Code {string}',
  (expectedStatusCode: string) => {
    ApiHelper.verifyApiResponseStatusCode(parseInt(expectedStatusCode, 10));
  },
);
