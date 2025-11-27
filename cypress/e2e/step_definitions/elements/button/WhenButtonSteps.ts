import { When } from '@badeball/cypress-cucumber-preprocessor';

import { ButtonHelper } from '../../../../support/helper/forms/button/ButtonHelper';

When('User Clicks On The {string} Button', (buttonText: string) => {
  ButtonHelper.clickButton(buttonText);
});

When(
  'User clicks On The {string} Button In The Row With Description {string} DisplayDate {string} Time {string} Court {string} Entries {string} Status {string}',
  (
    selectButton: string,
    description: string,
    displayDate: string,
    time: string,
    court: string,
    entries: string,
    status: string,
  ) => {
    ButtonHelper.clickButtonInTableRow(selectButton, {
      Description: description,
      Date: displayDate,
      Time: time,
      Location: court,
      Entries: entries,
      Status: status,
    });
  },
);
