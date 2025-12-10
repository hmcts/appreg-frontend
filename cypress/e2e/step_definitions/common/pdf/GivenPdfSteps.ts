/// <reference types="cypress" />
import { Given } from '@badeball/cypress-cucumber-preprocessor';

import { PdfDownloadHelper } from '../../../../support/helper/pdf/PdfDownloadHelper';

/**
 * Step: Clear downloads folder before test starts (cleanup)
 * Usage: Given User Has No Downloaded PDFs
 */
Given('User Has No Downloaded PDFs', () => {
  PdfDownloadHelper.clearDownloadsFolder();
  cy.log('Downloads folder cleared');
});
