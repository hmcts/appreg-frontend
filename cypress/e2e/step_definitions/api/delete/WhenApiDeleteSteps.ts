import { When } from '@badeball/cypress-cucumber-preprocessor';

import { ApiDeleteHelper } from '../../../../support/helper/api/apiDelete/ApiDeleteHelper';

When('User Makes DELETE API Request To {string}', (endpoint: string) => {
  ApiDeleteHelper.makeDeleteRequest(endpoint);
}); 