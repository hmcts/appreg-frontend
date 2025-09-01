import { Given } from '@badeball/cypress-cucumber-preprocessor';

import { NavigationHelper } from '../../../../support/helper/navigation/NavigationHelper';

Given('User Is On The Portal Page', () => {
  NavigationHelper.navigateToPortalPage();
});


