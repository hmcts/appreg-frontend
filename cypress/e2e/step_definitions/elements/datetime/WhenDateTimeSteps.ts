import { When } from '@badeball/cypress-cucumber-preprocessor';

import { DateTimeHelper } from '../../../../support/helper/forms/datetime/DateTimeHelper';

When(
  'User Set Date Field {string} To {string}',
  (fieldLabel: string, dateValue: string) => {
    if (dateValue && dateValue.trim() !== '' && dateValue !== '*SKIP*') {
      DateTimeHelper.setDateValue(fieldLabel, dateValue);
    }
  },
);

When(
  'User Set Time Field {string} To {string}',
  (fieldLabel: string, timeValue: string) => {
    if (timeValue && timeValue.trim() !== '' && timeValue !== '*SKIP*') {
      DateTimeHelper.setTimeValue(fieldLabel, timeValue);
    }
  },
);

When('User Clears The Time Field {string}', (fieldLabel: string) => {
  DateTimeHelper.clearTimeField(fieldLabel);
});

When('User Clears The Date Field {string}', (fieldLabel: string) => {
  DateTimeHelper.clearDateField(fieldLabel);
});

When(
  'User clears the {string} and {string} fields in the {string} field', 
  (hoursFieldLabel: string, minutesFieldLabel: string, durationFieldLabel: string) => {
    DateTimeHelper.clearDurationFieldsByLabel(durationFieldLabel, hoursFieldLabel, minutesFieldLabel);
  },
);

When('User Set {string} and {string} In The {string} Field', (hours: string, minutes: string, fieldLabel: string) => {
  DateTimeHelper.setDurationFieldValuesByLabel(fieldLabel, hours, minutes);
});
