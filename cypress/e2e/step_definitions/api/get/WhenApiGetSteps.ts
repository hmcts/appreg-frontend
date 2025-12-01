import { When } from '@badeball/cypress-cucumber-preprocessor';

import { ApiGetHelper } from '../../../../support/helper/api/apiGet/ApiGetHelper';


When('User Makes GET API Request To {string}', (endpoint: string) => {
  const token = Cypress.env('authToken');
  ApiGetHelper.makeGetRequest(endpoint, token);
});