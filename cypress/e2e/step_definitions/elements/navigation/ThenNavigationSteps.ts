import { Then } from '@badeball/cypress-cucumber-preprocessor';

import { NavigationHelper } from '../../../../support/helper/navigation/NavigationHelper';

Then('User Verify The Page Title Is {string}', (expectedTitle: string) => {
  NavigationHelper.verifyPageTitle(expectedTitle);
});

Then('User Verify The Page URL Is {string}', (expectedUrl: string) => {
  NavigationHelper.verifyPageUrl(expectedUrl);
});

Then('User Verify The Page URL Contains {string}', (partialUrl: string) => {
  NavigationHelper.verifyPageUrlContains(partialUrl);
});
