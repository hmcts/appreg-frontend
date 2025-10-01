import { Then } from '@badeball/cypress-cucumber-preprocessor';

import { DateTimeHelper } from '../../../../support/helper/forms/datetime/DateTimeHelper';

Then('User Should See The Date Field {string}', (fieldLabel: string) => {
  DateTimeHelper.verifyDateFieldVisible(fieldLabel);
});

Then('User Should Not See The Date Field {string}', (fieldLabel: string) => {
  DateTimeHelper.verifyDateFieldNotVisible(fieldLabel);
});

Then('User Should See The Time Field {string}', (fieldLabel: string) => {
  DateTimeHelper.verifyTimeFieldVisible(fieldLabel);
});

Then('User Should Not See The Time Field {string}', (fieldLabel: string) => {
  DateTimeHelper.verifyTimeFieldNotVisible(fieldLabel);
});

