import { When } from '@badeball/cypress-cucumber-preprocessor';

import { ApiGetHelper } from '../../../../support/helper/api/apiGet/ApiGetHelper';

When('User Makes GET API Request To {string}', (endpoint: string) => {
  cy.get('@authToken').then((token) => {
    const baseUrl = Cypress.env('API_BASE_URL');
    const fullUrl = baseUrl ? `${baseUrl}${endpoint}` : endpoint;
    ApiGetHelper.makeGetRequest(fullUrl, token as unknown as string);
  });
});

When(
  'User Makes GET API Request To {string} Using Frontend URL', (endpoint: string) => {
    cy.log(`API GET Request full URL: ${endpoint}`);
    ApiGetHelper.makeGetRequest(endpoint);
  });
