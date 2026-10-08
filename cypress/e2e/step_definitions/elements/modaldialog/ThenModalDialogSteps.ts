import { Then } from '@badeball/cypress-cucumber-preprocessor';

import { ModalDialogHelper } from '../../../../support/helper/forms/modaldialog/ModalDialogHelper';

Then(
  'User Should See The Modal Dialog With Heading {string}',
  (heading: string) => {
    ModalDialogHelper.verifyModalDialogVisibleWithHeading(heading);
  },
);

Then('User Should Not See The Modal Dialog', () => {
  ModalDialogHelper.verifyModalDialogNotVisible();
});

Then(
  'User Should See The Modal Dialog With Button {string}',
  (buttonText: string) => {
    ModalDialogHelper.verifyModalDialogButtonVisible(buttonText);
  },
);

Then('User Clicks On The Modal Dialog Close Link', () => {
  ModalDialogHelper.clickModalDialogCloseLink();
});

Then('User Clicks On The Modal Dialog Cancel Button', () => {
  ModalDialogHelper.clickModalDialogCancelButton();
});

Then('User Clicks On The Modal Dialog Confirm Button', () => {
  ModalDialogHelper.clickModalDialogConfirmButton();
});

Then(
  'User Should See The Text {string} In The Modal Dialog',
  (text: string) => {
    ModalDialogHelper.verifyTextInModalDialog(text);
  },
);
