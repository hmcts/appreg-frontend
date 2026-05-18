import { Given } from '@badeball/cypress-cucumber-preprocessor';

import { CsvDownloadHelper } from '../../../../support/helper/download/csv/CsvDownloadHelper';

/**
 * Step: Clear CSV downloads folder before test starts (cleanup)
 * Usage: Given User Has No Downloaded CSVs
 */
Given('User Has No Downloaded CSVs', () => {
  CsvDownloadHelper.clearDownloadsFolder();
  cy.log('CSV downloads folder cleared');
});
