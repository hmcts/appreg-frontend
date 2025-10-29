import { Then } from '@badeball/cypress-cucumber-preprocessor';

import { ElementHelper } from '../../../../support/helper/forms/element/ElementHelper';

Then('User Should Not See The Element {string}', (element: string) => {
  ElementHelper.verifyElementNotVisible(element);
});

Then('User Should See The Element {string}', (element: string) => {
  ElementHelper.verifyElementVisible(element);
});
