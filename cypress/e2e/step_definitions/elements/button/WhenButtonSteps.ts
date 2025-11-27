import { When } from '@badeball/cypress-cucumber-preprocessor';

import { ButtonHelper } from '../../../../support/helper/forms/button/ButtonHelper';

When('User Clicks On The {string} Button', (buttonText: string) => {
  ButtonHelper.clickButton(buttonText);
});
