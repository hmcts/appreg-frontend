import { Then } from '@badeball/cypress-cucumber-preprocessor';

import { SummaryListHelper } from '../../../../support/helper/forms/summarylist/SummaryListHelper';
import { DateTimeUtil } from '../../../../support/utils/DateTimeUtil';

Then(
  'User Should See Summary List Row With Key {string} And Value {string}',
  (key: string, value: string) => {
    const resolvedValue = DateTimeUtil.parseDateValue(value);
    SummaryListHelper.verifySummaryListRow(key, resolvedValue);
  },
);
