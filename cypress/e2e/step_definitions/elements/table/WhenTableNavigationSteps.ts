import { When } from '@badeball/cypress-cucumber-preprocessor';

import { TableNavigation } from '../../../../support/helper/table/TableNavigation';

/**
 * Table Navigation Steps
 * Handles pagination navigation actions in tables
 */

/**
 * Navigates to the first page of a paginated table
 */
When('User Goes To First Page', () => {
  TableNavigation.navigateToFirstPage();
});

/**
 * Navigates to the last page of a paginated table
 */
When('User Goes To Last Page', () => {
  TableNavigation.navigateToLastPage();
});

/**
 * Navigates to the next page if it exists
 */
When('User Goes To Next Page', () => {
  TableNavigation.goToNextPageIfExists();
});
