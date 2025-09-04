import { Given } from '@badeball/cypress-cucumber-preprocessor';

import { NavigationHelper } from '../../../../support/helper/navigation/NavigationHelper';

Given('User Is On The Portal Page', () => {
  NavigationHelper.navigateToPortalPage();
});

Given('User Navigates To The URL {string}', (url: string) => {
  NavigationHelper.navigateToUrl(url);
});

Given('User Is On The {string} Page', (partialUrl: string) => {
  NavigationHelper.navigateToUrl(partialUrl);
});
