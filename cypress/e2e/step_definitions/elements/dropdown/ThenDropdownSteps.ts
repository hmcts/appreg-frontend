import { Then, DataTable } from '@badeball/cypress-cucumber-preprocessor';

import { DropdownHelper } from '../../../../support/helper/forms/dropdown/DropdownHelper';

Then('User Selects {string} In The {string} Dropdown', (optionText: string, dropdownLabel: string) => {
  DropdownHelper.selectDropdownOption(dropdownLabel, optionText);
});

Then('User Verifies {string} Is Selected In The {string} Dropdown', (optionText: string, dropdownLabel: string) => {
  DropdownHelper.verifyDropdownOptionSelected(dropdownLabel, optionText);
});

Then('User Verifies {string} Is Not Selected In The {string} Dropdown', (optionText: string, dropdownLabel: string) => {
  DropdownHelper.verifyDropdownOptionNotSelected(dropdownLabel, optionText);
});

Then('User Verifies {string} Dropdown Is Disabled', (dropdownLabel: string) => {
  DropdownHelper.verifyDropdownIsDisabled(dropdownLabel);
});

Then('User Verifies {string} Dropdown Is Enabled', (dropdownLabel: string) => {
  DropdownHelper.verifyDropdownIsEnabled(dropdownLabel);
});

Then('User Verifies {string} Dropdown Contains {string} Option', (dropdownLabel: string, optionText: string) => {
  DropdownHelper.verifyDropdownContainsOption(dropdownLabel, optionText);
});

Then('User Verifies {string} Dropdown Does Not Contain {string} Option', (dropdownLabel: string, optionText: string) => {
  DropdownHelper.verifyDropdownDoesNotContainOption(dropdownLabel, optionText);
});

Then('User Verifies {string} Dropdown Contains {string} Options', (dropdownLabel: string, options: string) => {
  const optionList = options.split(',').map(opt => opt.trim());
  optionList.forEach(optionText => {
    DropdownHelper.verifyDropdownContainsOption(dropdownLabel, optionText);
  });
});

Then('User Verifies {string} Dropdown Does Not Contain {string} Options', (dropdownLabel: string, options: string) => {
  const optionList = options.split(',').map(opt => opt.trim());
  optionList.forEach(optionText => {
    DropdownHelper.verifyDropdownDoesNotContainOption(dropdownLabel, optionText);
  });
}); 

Then('User Verifies {string} Dropdown Contains Options:', (dropdownLabel: string, dataTable: DataTable) => {
  const optionList = dataTable.raw().flat();
  optionList.forEach(optionText => {
    DropdownHelper.verifyDropdownContainsOption(dropdownLabel, optionText);
  });
});

Then('User Verifies {string} Dropdown Does Not Contain Options:', (dropdownLabel: string, dataTable: DataTable) => {
  const optionList = dataTable.raw().flat();
  optionList.forEach(optionText => {
    DropdownHelper.verifyDropdownDoesNotContainOption(dropdownLabel, optionText);
  });
});
