import { Then } from '@badeball/cypress-cucumber-preprocessor';

import { NavigationHelper } from '../../../../support/helper/navigation/NavigationHelper';

Then('User Verify The Page Title Is {string}', (expectedTitle: string) => {
  NavigationHelper.verifyPageTitle(expectedTitle);

});