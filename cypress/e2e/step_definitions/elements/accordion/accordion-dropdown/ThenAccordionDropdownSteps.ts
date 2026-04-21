import { Then } from '@badeball/cypress-cucumber-preprocessor';

import { AccordionHelper } from '../../../../../support/helper/forms/accordion/accordion/AccordionHelper';
import { DropdownHelper } from '../../../../../support/helper/forms/dropdown/DropdownHelper';

Then(
  'User Selects {string} From The Dropdown {string} In The Accordion {string}',
  (optionText: string, dropdownLabel: string, accordionTitle: string) => {
    AccordionHelper.within(accordionTitle, () => {
      DropdownHelper.selectDropdownOption(dropdownLabel, optionText);
    });
  },
);

Then(
  'The Dropdown {string} Should Be {string} In The Accordion {string}',
  (dropdownLabel: string, expectedValue: string, accordionTitle: string) => {
    AccordionHelper.within(accordionTitle, () => {
      DropdownHelper.verifyDropdownOptionSelected(dropdownLabel, expectedValue);
    });
  },
);

Then(
  'User Verifies Dropdown {string} Is Disabled In The Accordion {string}',
  (dropdownLabel: string, accordionTitle: string) => {
    AccordionHelper.within(accordionTitle, () => {
      DropdownHelper.verifyDropdownIsDisabled(dropdownLabel);
    });
  },
);
