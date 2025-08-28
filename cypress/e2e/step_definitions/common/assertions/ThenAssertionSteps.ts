import { Then } from '@badeball/cypress-cucumber-preprocessor';
import { AssertionHelper } from '../../../../support/helper/assertion/assertionHelper';

Then('User Verify The Page Title Is {string}', (expectedTitle: string) => {
  AssertionHelper.verifyPageTitle(expectedTitle);

});