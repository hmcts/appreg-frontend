import { Then, DataTable } from '@badeball/cypress-cucumber-preprocessor';
import { AccessibilityHelper } from '../../../../support/helper/accessibility/AccessibilityHelper';

Then('User Checks Accessibility Of The Current Page', () => {
  cy.log('Checking accessibility of the current page');
  AccessibilityHelper.checkAccessibility();
});

Then('User Navigates To {string} URL And Checks Accessibility', (url: string) => {
  cy.log(`Navigating to ${url} and checking accessibility`);
  AccessibilityHelper.checkAccessibilityOnPage(url);
});

Then('User Navigates To Each URL In The Datatable And Checks Accessibility', (dataTable: DataTable) => {
  cy.log('Navigating to each URL in the datatable and checking accessibility');
    const pages = dataTable.hashes() as Array<{ url: string; header: string }>;
  AccessibilityHelper.checkAccessibilityOnPages(pages);
});