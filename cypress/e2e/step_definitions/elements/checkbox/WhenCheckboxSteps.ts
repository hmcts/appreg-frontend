import { When } from '@badeball/cypress-cucumber-preprocessor';

import { CheckboxHelper } from '../../../../support/helper/forms/checkbox/CheckboxHelper';

When('User Checks The Checkbox With Label {string}', (label: string) => {
  CheckboxHelper.check(label);
});

When('User Unchecks The Checkbox With Label {string}', (label: string) => {
  CheckboxHelper.uncheck(label);
});
