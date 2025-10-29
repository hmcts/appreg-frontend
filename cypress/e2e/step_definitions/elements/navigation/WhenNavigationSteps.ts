/// <reference types="cypress" />
import { Given, When } from '@badeball/cypress-cucumber-preprocessor';

import { NavigationHelper } from '../../../../support/helper/navigation/NavigationHelper';

Given('User Is On The Portal Page', () => {
  NavigationHelper.navigateToPortalPage();
  cy.screenshot('PortalPage');
});

Given('User Navigates To The URL {string}', (url: string) => {
  NavigationHelper.navigateToUrl(url);
  cy.screenshot(`NavigatedTo-${url}`);
});

Given('User Is On The {string} Page', (partialUrl: string) => {
  NavigationHelper.navigateToUrl(partialUrl);
  cy.screenshot(`NavigatedTo-${partialUrl}`);
});

When('User Refreshes The Page', () => {
  NavigationHelper.pageRefresh();
});
