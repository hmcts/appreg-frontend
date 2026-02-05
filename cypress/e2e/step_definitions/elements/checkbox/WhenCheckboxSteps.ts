import { When } from '@badeball/cypress-cucumber-preprocessor';

import { CheckboxHelper } from '../../../../support/helper/forms/checkbox/CheckboxHelper';

When('User Clicks On The Checkbox In Row {int}', (rowIndex: number) => {
  CheckboxHelper.checkByIndex(rowIndex);
});
