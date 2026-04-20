import { Then } from '@badeball/cypress-cucumber-preprocessor';

import { AccordionHelper } from '../../../../../support/helper/forms/accordion/accordion/AccordionHelper';
import { DateTimeHelper } from '../../../../../support/helper/forms/datetime/DateTimeHelper';

Then(
  'User Enters {string} Into The Date Field {string} In The Accordion {string}',
  (dateValue: string, dateFieldLabel: string, accordionTitle: string) => {
    AccordionHelper.within(accordionTitle, () =>
      DateTimeHelper.setDateValue(dateFieldLabel, dateValue),
    );
  },
);

Then(
  'The Date Field {string} Should Be {string} In The Accordion {string}',
  (dateFieldLabel: string, expectedDate: string, accordionTitle: string) => {
    AccordionHelper.within(accordionTitle, () =>
      DateTimeHelper.verifyDateValue(dateFieldLabel, expectedDate),
    );
  },
);

Then(
  'User Verifies Date Field {string} Is Disabled In The Accordion {string}',
  (dateFieldLabel: string, accordionTitle: string) => {
    AccordionHelper.within(accordionTitle, () =>
      DateTimeHelper.verifyDateFieldDisabled(dateFieldLabel),
    );
  },
);
