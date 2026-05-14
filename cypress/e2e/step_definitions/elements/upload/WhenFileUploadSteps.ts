/// <reference types="cypress" />
import { When } from '@badeball/cypress-cucumber-preprocessor';

import { TestDataGenerator } from '../../../../support/utils/TestDataGenerator';

/**
 * Uploads a fixture file via the file input element.
 *
 * For bulk-upload-entries.csv, regenerates the CSV with unique data
 * (names, addresses, emails, account numbers) before uploading, using
 * the scenario-scoped {RANDOM} suffix to avoid data collisions across runs.
 *
 * All other files are uploaded as-is from cypress/fixtures.
 */

When('User Uploads The File {string}', (fileName: string) => {
  if (fileName === 'bulk-upload-entries.csv') {
    const suffix = TestDataGenerator.replaceRandomPlaceholders('{RANDOM}');
    cy.task('generateBulkUploadCsv', { suffix });
  }
  cy.get('input[type="file"]').selectFile(`cypress/fixtures/${fileName}`, {
    force: true,
  });
  cy.screenshot(`uploaded-file-${fileName}`);
});

When('User Waits For The File Upload To Complete', () => {
  cy.get('app-loading-spinner', { timeout: 60000 }).should('not.exist');
});
