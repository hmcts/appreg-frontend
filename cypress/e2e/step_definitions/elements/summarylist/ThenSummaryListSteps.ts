import { Then } from '@badeball/cypress-cucumber-preprocessor';

import { SummaryListHelper } from '../../../../support/helper/forms/summarylist/SummaryListHelper';

Then(
  'User Should See Summary List Row With Key {string} And Value {string}',
  (key: string, value: string) => {
    SummaryListHelper.verifySummaryListRow(key, value);
  },
);
