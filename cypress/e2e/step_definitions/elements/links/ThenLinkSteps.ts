import { Then } from '@badeball/cypress-cucumber-preprocessor';

import { LinkHelper } from '../../../../support/helper/forms/link/LinkHelper';

Then('User Should See The Link {string}', (linkText: string) => {
  LinkHelper.verifyLinkVisible(linkText);
});

Then('User Should Not See The Link {string}', (linkText: string) => {
  LinkHelper.verifyLinkNotVisible(linkText);
});

Then('User Clicks On The Link {string}', (linkText: string) => {
  LinkHelper.clickLink(linkText);
});
