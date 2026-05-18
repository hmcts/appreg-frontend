import { When } from '@badeball/cypress-cucumber-preprocessor';

import { RadioHelper } from '../../../../support/helper/forms/radio/RadioHelper';

When('User Selects The Radio Button {string}', (label: string) => {
  RadioHelper.select(label);
});
