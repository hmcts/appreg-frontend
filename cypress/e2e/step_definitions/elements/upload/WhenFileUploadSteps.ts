/// <reference types="cypress" />
import { When } from '@badeball/cypress-cucumber-preprocessor';

import { UploadHelper } from '../../../../support/helper/forms/upload/UploadHelper';
import { TestDataGenerator } from '../../../../support/utils/TestDataGenerator';

/**
 * Uploads a fixture file via the file input element.
 *
 * For supported bulk-upload entry fixtures, generates unique CSV content in-memory
 * (names, addresses, emails, account numbers) before uploading, using
 * the scenario-scoped {RANDOM} suffix to avoid data collisions across runs
 * without mutating the shared fixture on disk.
 *
 * All other files are uploaded as-is from cypress/fixtures.
 */

const generatedBulkUploadFiles = new Set([
  'bulk-upload-entries.csv',
  'bulk-upload-entries-fee-not-required.csv',
  'bulk-upload-entries-fee-required.csv',
]);

When('User Uploads The File {string}', (fileName: string) => {
  if (generatedBulkUploadFiles.has(fileName)) {
    const suffix = TestDataGenerator.replaceRandomPlaceholders('{RANDOM}');
    cy.task<string>('buildBulkUploadCsv', { fileName, suffix }).then(
      (fileContents) => {
        UploadHelper.selectFileContents(fileName, fileContents, 'text/csv');
        cy.screenshot(`uploaded-file-${fileName}`);
      },
    );
    return;
  }
  UploadHelper.selectFile(fileName);
  cy.screenshot(`uploaded-file-${fileName}`);
});

When('User Waits For The File Upload To Complete', () => {
  UploadHelper.waitForBulkUploadToComplete();
});
