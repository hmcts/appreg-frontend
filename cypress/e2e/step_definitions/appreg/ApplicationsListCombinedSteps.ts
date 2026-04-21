import { DataTable, When } from '@badeball/cypress-cucumber-preprocessor';

import { ApplicationListCombinedHelper } from '../../../support/helper/appreg/ApplicationListCombinedHelper';
import { ButtonHelper } from '../../../support/helper/forms/button/ButtonHelper';
import { resolveAliases } from '../../../support/utils/AliasResolver';

When('User Searches Application List With:', (dataTable: DataTable) => {
  const rawCriteria = dataTable.hashes()[0];
  resolveAliases(rawCriteria).then((resolved) => {
    ApplicationListCombinedHelper.searchApplicationList(resolved);
    cy.screenshot('search-application-list-results');
  });
});

When('User Submits The Application List Search', () => {
  cy.intercept('GET', '**/application-lists**').as('_appListSearch');
  ButtonHelper.clickButton('Search');
  cy.wait('@_appListSearch', { timeout: 20000 });
  cy.get('body', { timeout: 10000 }).should(($body) => {
    const hasTable = $body.find('caption:contains("Lists")').length > 0;
    const hasNoResultsBanner = $body.text().includes('No lists found');
    const hasValidationError = $body.find('.govuk-error-summary').length > 0;
    if (!hasTable && !hasNoResultsBanner && !hasValidationError) {
      throw new Error('Search results not loaded yet - waiting...');
    }
  });
  cy.screenshot('submit-application-list-search');
});
