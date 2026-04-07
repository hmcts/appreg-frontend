import { Then } from '@badeball/cypress-cucumber-preprocessor';

import { AccordionDropdownHelper } from '../../../../../support/helper/forms/accordion/accordionDropdown/AccordionDropdownHelper';

/**
 * Step: User Selects an option from a dropdown within a specific accordion
 */
Then(
  'User Selects {string} From The Accordion {string} Dropdown {string}',
  (optionText: string, accordionTitle: string, dropdownLabel: string) => {
    AccordionDropdownHelper.selectDropdownInAccordion(
      accordionTitle,
      dropdownLabel,
      optionText,
    );
  },
);

/**
 * Step: Verify selected value in an accordion dropdown
 */
Then(
  'The Accordion {string} Dropdown {string} Should Be {string}',
  (accordionTitle: string, dropdownLabel: string, expectedValue: string) => {
    AccordionDropdownHelper.verifyDropdownValue(
      accordionTitle,
      dropdownLabel,
      expectedValue,
    );
  },
);

Then(
  'User Verifies Dropdown {string} Is Disabled In The Accordion {string}',
  (dropdownLabel: string, accordionTitle: string) => {
    AccordionDropdownHelper.verifyDropdownDisabled(
      accordionTitle,
      dropdownLabel,
    );
  },
);
