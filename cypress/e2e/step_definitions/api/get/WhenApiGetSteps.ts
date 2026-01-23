import { When } from '@badeball/cypress-cucumber-preprocessor';

import { ApiGetHelper } from '../../../../support/helper/api/apiGet/ApiGetHelper';

When('User Makes GET API Request To {string}', (endpoint: string) => {
  ApiGetHelper.makeGetRequest(endpoint);
});

When(
  'User Makes GET API Request To {string} Using Frontend URL',
  (endpoint: string) => {
    cy.log(`API GET Request full URL: ${endpoint}`);
    ApiGetHelper.makeGetRequestUsingFE(endpoint);
  },
);
