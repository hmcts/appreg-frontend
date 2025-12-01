import { When } from '@badeball/cypress-cucumber-preprocessor';

import { ApiGetHelper } from '../../../../support/helper/api/apiGet/ApiGetHelper';


When('User Makes GET API Request To {string}', (endpoint: string) => {
  cy.get('@authToken').then((token) => {
    ApiGetHelper.makeGetRequest(endpoint, token as unknown as string);
  });
});