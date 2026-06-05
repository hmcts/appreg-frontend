import { DataTable, Then } from '@badeball/cypress-cucumber-preprocessor';

import { DropdownHelper } from '../../../../support/helper/forms/dropdown/DropdownHelper';
import { TestDataGenerator } from '../../../../support/utils/TestDataGenerator';


Then('User Should See The Dropdown {string}', (dropdownLabel: string) => {
  DropdownHelper.verifyDropdownIsVisible(dropdownLabel);
});

Then(
  'User Selects {string} In The {string} Dropdown',
  (optionText: string, dropdownLabel: string) => {
    DropdownHelper.selectDropdownOption(dropdownLabel, optionText);
  },
);

Then(
  'User Verifies {string} Is Selected In The {string} Dropdown',
  (optionText: string, dropdownLabel: string) => {
    DropdownHelper.verifyDropdownOptionSelected(dropdownLabel, optionText);
  },
);

Then(
  'User Verifies {string} Is Not Selected In The {string} Dropdown',
  (optionText: string, dropdownLabel: string) => {
    DropdownHelper.verifyDropdownOptionNotSelected(dropdownLabel, optionText);
  },
);

Then('User Verifies {string} Dropdown Is Disabled', (dropdownLabel: string) => {
  DropdownHelper.verifyDropdownIsDisabled(dropdownLabel);
});

Then('User Verifies {string} Dropdown Is Enabled', (dropdownLabel: string) => {
  DropdownHelper.verifyDropdownIsEnabled(dropdownLabel);
});

Then(
  'User Verifies {string} Dropdown Has Option {string}',
  (dropdownLabel: string, optionText: string) => {
    DropdownHelper.verifyDropdownContainsOption(dropdownLabel, optionText);
  },
);

Then(
  'User Verifies {string} Dropdown Does Not Have Option {string}',
  (dropdownLabel: string, optionText: string) => {
    DropdownHelper.verifyDropdownDoesNotContainOption(
      dropdownLabel,
      optionText,
    );
  },
);

Then(
  'User Verifies {string} Dropdown Has Options {string}',
  (dropdownLabel: string, options: string) => {
    const optionList = options.split(',').map((opt) => opt.trim());
    for (const optionText of optionList) {
      DropdownHelper.verifyDropdownContainsOption(dropdownLabel, optionText);
    }
  },
);

Then(
  'User Verifies {string} Dropdown Does Not Have Options {string}',
  (dropdownLabel: string, options: string) => {
    const optionList = options.split(',').map((opt) => opt.trim());
    for (const optionText of optionList) {
      DropdownHelper.verifyDropdownDoesNotContainOption(
        dropdownLabel,
        optionText,
      );
    }
  },
);

Then(
  'User Verifies {string} Dropdown Has Options:',
  (dropdownLabel: string, dataTable: DataTable) => {
    const optionList = dataTable.raw().flat();
    for (const optionText of optionList) {
      DropdownHelper.verifyDropdownContainsOption(dropdownLabel, optionText);
    }
  },
);

Then(
  'User Verifies {string} Dropdown Does Not Have Options:',
  (dropdownLabel: string, dataTable: DataTable) => {
    const optionList = dataTable.raw().flat();
    for (const optionText of optionList) {
      DropdownHelper.verifyDropdownDoesNotContainOption(
        dropdownLabel,
        optionText,
      );
    }
  },
);

Then(
  'User Selects {string} From The {string} Dropdown Within The {string} FieldSet',
  (optionText: string, dropdownLabel: string, fieldsetLabel: string) => {
    const substituteOptionText =
      TestDataGenerator.replaceRandomPlaceholders(optionText);
    const substituteDropdownLabel =
      TestDataGenerator.replaceRandomPlaceholders(dropdownLabel);
    const substituteFieldsetLabel =
      TestDataGenerator.replaceRandomPlaceholders(fieldsetLabel);

    DropdownHelper.selectDropdownOptionUnderFieldset(
      substituteDropdownLabel,
      substituteOptionText,
      substituteFieldsetLabel,
    );
  },
);
