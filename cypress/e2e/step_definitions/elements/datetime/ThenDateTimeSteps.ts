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

Then(
  'User Verifies The Date field {string} Has Value {string}',
  (fieldLabel: string, expectedValue: string) => {
    DateTimeHelper.verifyDateFieldValue(fieldLabel, expectedValue);
  },
);

Then(
  'User Verifies The Time field {string} Has Value {string}',
  (fieldLabel: string, expectedValue: string) => {
    DateTimeHelper.verifyTimeFieldValue(fieldLabel, expectedValue);
  },
);

Then(
  'User Verifies The {string} field Has Values hours {string} and minutes {string}',
  (fieldLabel: string, hours: string, minutes: string) => {
    DateTimeHelper.verifyDurationFieldValuesByLabel(fieldLabel, hours, minutes);
  },
);
