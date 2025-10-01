import { When } from '@badeball/cypress-cucumber-preprocessor';

import { DateTimeHelper } from '../../../../support/helper/forms/datetime/DateTimeHelper';

When('User Set Date Field {string} To {string}', (fieldLabel: string, dateValue: string) => {
  DateTimeHelper.setDateValue(fieldLabel, dateValue);
});

When('User Set Time Field {string} To {string}', (fieldLabel: string, timeValue: string) => {
  DateTimeHelper.setTimeValue(fieldLabel, timeValue);
});


