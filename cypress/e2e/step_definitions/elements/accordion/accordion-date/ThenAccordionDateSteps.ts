import { Then } from '@badeball/cypress-cucumber-preprocessor';

import { AccordionDateTimeHelper } from '../../../../../support/helper/forms/accordion/accordionDate/AccordionDateTimeHelper';

/**
 * Step: User Enters a date value into a date field within a specific accordion
 * Example: When User Enters "today+7d" Into The Accordion "Event Details" Date Field "Start Date"
 */
Then(
  'User Enters {string} Into The Accordion {string} Date Field {string}',
  (dateValue: string, accordionTitle: string, dateFieldLabel: string) => {
    AccordionDateTimeHelper.setDateInAccordion(
      accordionTitle,
      dateFieldLabel,
      dateValue,
    );
  },
);

/**
 * Step: Verify date value in an accordion date field
 * Example: Then The Accordion "Event Details" Date Field "Start Date" Should Be "22/7/2024"
 */
Then(
  'The Accordion {string} Date Field {string} Should Be {string}',
  (accordionTitle: string, dateFieldLabel: string, expectedDate: string) => {
    AccordionDateTimeHelper.verifyDateInAccordion(
      accordionTitle,
      dateFieldLabel,
      expectedDate,
    );
  },
);
