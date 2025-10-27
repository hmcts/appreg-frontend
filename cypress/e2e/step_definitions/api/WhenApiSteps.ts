import { When } from '@badeball/cypress-cucumber-preprocessor';

import { ApiHelper } from '../../../support/helper/api/ApiHelper';

When(
  'User Makes API Request To {string}',
  (endpoint: string) => {
    ApiHelper.makeApiRequest(endpoint);
  },
);