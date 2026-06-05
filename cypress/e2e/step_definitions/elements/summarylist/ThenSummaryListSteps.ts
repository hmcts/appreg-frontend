import { Then } from '@badeball/cypress-cucumber-preprocessor';

import { SummaryListHelper } from '../../../../support/helper/forms/summarylist/SummaryListHelper';
import { DateTimeUtil } from '../../../../support/utils/DateTimeUtil';
import { TestDataGenerator } from '../../../../support/utils/TestDataGenerator';

Then(
  'User Should See Summary List Row With Key {string} And Value {string}',
  (key: string, value: string) => {
    const resolvedDateValue = DateTimeUtil.parseDateValue(value);
    const resolvedValue =
      TestDataGenerator.replaceRandomPlaceholders(resolvedDateValue);

    SummaryListHelper.verifySummaryListRow(key, resolvedValue);
    cy.screenshot(`VerifiedSummaryListRow-${key}-${resolvedValue}`);
  },
);
