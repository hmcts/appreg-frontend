import { When } from '@badeball/cypress-cucumber-preprocessor';

import { DateTimeHelper } from '../../../../support/helper/forms/datetime/DateTimeHelper';

When(
  'User Set Date Field {string} To {string}',
  (fieldLabel: string, dateValue: string) => {
    DateTimeHelper.setDateValue(fieldLabel, dateValue);
  },
);

When(
  'User Set Time Field {string} To {string}',
  (fieldLabel: string, timeValue: string) => {
    DateTimeHelper.setTimeValue(fieldLabel, timeValue);
  },
);

When(
  'User Clears The Time Field {string}',
  (fieldLabel: string) => {
    DateTimeHelper.clearTimeField(fieldLabel);
  },
);

When(
  'User Clears The Date Field {string}',
  (fieldLabel: string) => {
    DateTimeHelper.clearDateField(fieldLabel);
  },
);