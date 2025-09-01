import { Then } from '@badeball/cypress-cucumber-preprocessor';

import { TextHelper } from '../../../../support/helper/forms/text/TextHelper';
import { PageElements } from '../../../../support/pageobjects/pageelements/PageElements';

Then('User See {string} On The Page', (expectedText: string) => {
  TextHelper.verifyTextPresence(PageElements.body, expectedText);
});
