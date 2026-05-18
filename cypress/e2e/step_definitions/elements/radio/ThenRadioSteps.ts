import { Then } from '@badeball/cypress-cucumber-preprocessor';

import { RadioHelper } from '../../../../support/helper/forms/radio/RadioHelper';

Then('User Verifies The Radio Button {string} Is Selected', (label: string) => {
  RadioHelper.verifySelected(label);
});

Then(
  'User Verifies The Radio Button {string} Is Not Selected',
  (label: string) => {
    RadioHelper.verifyNotSelected(label);
  },
);
