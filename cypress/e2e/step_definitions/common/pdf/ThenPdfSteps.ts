/// <reference types="cypress" />
import { Then } from '@badeball/cypress-cucumber-preprocessor';
import { DataTable } from '@cucumber/cucumber';

import { PdfDownloadHelper } from '../../../../support/helper/pdf/PdfDownloadHelper';

/**
 * Step: Clear all downloaded PDF files
 * Usage: Then User Clears Downloaded PDFs
 */
Then('User Clears Downloaded PDFs', () => {
  PdfDownloadHelper.clearDownloadsFolder();
  cy.screenshot('Cleared-Downloaded-PDFs');
});

/**
 * Step: Verify a PDF file was downloaded by partial name
 * Usage: Then User Verifies PDF "cardiff-crown-court" Is Downloaded
 */
Then('User Verifies PDF {string} Is Downloaded', (partialName: string) => {
  PdfDownloadHelper.findPdfByName(partialName).then((filename) => {
    cy.log(`✅ PDF Downloaded: ${filename}`);
    cy.screenshot(`PDF-Downloaded-${partialName}`);
  });
});

/**
 * Step: Verify a PDF file is not empty
 * Usage: Then User Verifies PDF "application-list.pdf" Is Not Empty
 */
Then('User Verifies PDF {string} Is Not Empty', (filename: string) => {
  PdfDownloadHelper.verifyFileNotEmpty(filename);
  cy.screenshot(`PDF-Not-Empty-${filename}`);
});

/**
 * Step: Verify PDF contains specific text
 * Usage: Then User Verifies PDF "list.pdf" Contains Text "Cardiff Crown Court"
 */
Then(
  'User Verifies PDF {string} Contains Text {string}',
  (filename: string, expectedText: string) => {
    PdfDownloadHelper.verifyPdfContainsText(filename, expectedText);
    cy.screenshot(`PDF-Contains-Text-${filename}`);
  },
);

/**
 * Step: Verify PDF does NOT contain specific text
 * Usage: Then User Verifies PDF "list.pdf" Does Not Contain Text "Deleted"
 */
Then(
  'User Verifies PDF {string} Does Not Contain Text {string}',
  (filename: string, unexpectedText: string) => {
    PdfDownloadHelper.verifyPdfDoesNotContainText(filename, unexpectedText);
    cy.screenshot(`PDF-Does-Not-Contain-Text-${filename}`);
  },
);

/**
 * Step: Verify PDF contains multiple text values from a data table
 * Usage:
 *   Then User Verifies PDF "list.pdf" Contains:
 *     | Date       | 2025-05-19            |
 *     | Time       | 09:00                 |
 *     | Location   | Cardiff Crown Court   |
 */
Then(
  'User Verifies PDF {string} Contains:',
  (filename: string, dataTable: DataTable) => {
    const expectedTexts: string[] = [];
    const rows = dataTable.rows();

    rows.forEach((row) => {
      // Each row has [label, value] - we only care about the value
      expectedTexts.push(row[1]);
    });

    PdfDownloadHelper.verifyPdfContainsTexts(filename, expectedTexts);
    cy.screenshot(`PDF-Contains-Multiple-${filename}`);
  },
);

/**
 * Step: Verify PDF has a specific number of pages
 * Usage: Then User Verifies PDF "list.pdf" Has "2" Pages
 */
Then(
  'User Verifies PDF {string} Has {string} Pages',
  (filename: string, pageCount: string) => {
    const expectedPages = parseInt(pageCount, 10);
    PdfDownloadHelper.verifyPdfPageCount(filename, expectedPages);
    cy.screenshot(`PDF-Page-Count-${filename}`);
  },
);

/**
 * Step: Verify PDF filename matches a pattern
 * Usage: Then User Verifies Downloaded PDF Name Contains "cardiff-crown-court"
 */
Then(
  'User Verifies Downloaded PDF Name Contains {string}',
  (expectedPattern: string) => {
    PdfDownloadHelper.listPdfFiles().then((files) => {
      expect(files.length).to.be.greaterThan(
        0,
        'At least one PDF should be downloaded',
      );
      const latestPdf = files[files.length - 1];
      PdfDownloadHelper.verifyFilenamePattern(latestPdf, expectedPattern);
      cy.screenshot(`PDF-Name-Verified-${expectedPattern}`);
    });
  },
);

/**
 * Step: Find and verify PDF by partial name, then verify it contains text
 * Usage: Then User Verifies PDF With Name "cardiff" Contains Text "Applications List"
 */
Then(
  'User Verifies PDF With Name {string} Contains Text {string}',
  (partialName: string, expectedText: string) => {
    PdfDownloadHelper.findPdfByName(partialName).then((filename) => {
      cy.log(`Found PDF: ${filename}`);
      PdfDownloadHelper.verifyPdfContainsText(filename, expectedText);
      cy.screenshot(`PDF-${partialName}-Contains-${expectedText}`);
    });
  },
);

/**
 * Step: Get the latest downloaded PDF and verify its content
 * Usage: Then User Verifies Latest Downloaded PDF Contains Text "Application List"
 */
Then(
  'User Verifies Latest Downloaded PDF Contains Text {string}',
  (expectedText: string) => {
    PdfDownloadHelper.listPdfFiles().then((files) => {
      expect(files.length).to.be.greaterThan(
        0,
        'At least one PDF should be downloaded',
      );
      const latestPdf = files[files.length - 1];
      cy.log(`Verifying latest PDF: ${latestPdf}`);
      PdfDownloadHelper.verifyPdfContainsText(latestPdf, expectedText);
      cy.screenshot(`Latest-PDF-Contains-${expectedText}`);
    });
  },
);
