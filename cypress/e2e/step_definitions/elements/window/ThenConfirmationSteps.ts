import { When } from '@badeball/cypress-cucumber-preprocessor';

import { ConfirmationHelper } from '../../../../support/helper/window/ConfirmationHelper';

When('User Accepts The Confirmation Dialog', () => {
  ConfirmationHelper.acceptNextConfirm();
});

When('User Cancels The Confirmation Dialog', () => {
  ConfirmationHelper.dismissNextConfirm();
});

When('User Accepts The Confirmation Dialog With Message {string}', (message: string) => {
  ConfirmationHelper.acceptNextConfirm(message);
});

When('User Cancels The Confirmation Dialog With Message {string}', (message: string) => {
  ConfirmationHelper.dismissNextConfirm(message);
});
