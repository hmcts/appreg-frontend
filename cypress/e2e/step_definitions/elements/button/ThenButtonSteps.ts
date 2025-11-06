import { Then } from '@badeball/cypress-cucumber-preprocessor';

import { ButtonHelper } from '../../../../support/helper/forms/button/ButtonHelper';

Then(
  'User Should See The Button {string}',
  (buttonText: string) => {
    ButtonHelper.isButtonVisible(buttonText);
  },
);

Then(
  'User Should See The Button {string} Is Enabled',
  (buttonText: string) => {
    ButtonHelper.isButtonEnabled(buttonText);
  },
);

Then(
  'User Should See The Button {string} Is Disabled',
  (buttonText: string) => {
    ButtonHelper.isButtonDisabled(buttonText);
  },
);
