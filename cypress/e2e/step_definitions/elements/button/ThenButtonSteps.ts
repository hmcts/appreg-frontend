import { Then } from '@badeball/cypress-cucumber-preprocessor';

import { ButtonHelper } from '../../../../support/helper/forms/button/ButtonHelper';

Then('User Verifies The Button {string} Should Be Visible', (buttonText: string) => {
  ButtonHelper.isButtonVisible(buttonText);
});

Then('User Verifies The Button {string} Should Be Enabled', (buttonText: string) => {
  ButtonHelper.isButtonEnabled(buttonText);
});

Then('User Verifies The Button {string} Should Be Disabled', (buttonText: string) => {
  ButtonHelper.isButtonDisabled(buttonText);
});


