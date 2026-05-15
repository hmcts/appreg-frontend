import { UploadElement } from '../../../pageobjects/generic/upload/UploadElement';

export class UploadHelper {
  /**
   * Selects a file from cypress/fixtures via the file input element.
   */
  static selectFile(fileName: string): void {
    UploadElement.getFileInput().selectFile(`cypress/fixtures/${fileName}`, {
      force: true,
    });
  }

  /**
   * Waits for the full bulk upload lifecycle to complete:
   *
   * Phase 1 — bulk-upload page: waits for the submission spinner
   *   (app-loading-spinner) to disappear, indicating the POST was accepted
   *   and the app has navigated to the list detail page.
   *
   * Phase 2 — list detail page: asserts the progress section
   *   (.app-bulk-upload-progress) is visible with the expected headings,
   *   then waits for it to disappear once the background job finishes.
   */
  static waitForBulkUploadToComplete(): void {
    // Phase 1: POST in-flight spinner on bulk-upload page
    UploadElement.getPageSpinner(60000).should('not.exist');

    // Phase 2: background job progress on list detail page
    UploadElement.getBulkProgress(15000).should('be.visible');
    UploadElement.findBulkProgressByText(
      UploadElement.bulkProgressHeading,
    ).should('be.visible');
    UploadElement.findBulkProgressByText(UploadElement.bulkProgressBody).should(
      'be.visible',
    );

    // Wait for job to complete
    UploadElement.getBulkProgress(120000).should('not.exist');

    cy.url().should('not.include', 'bulkUploadJobId');
  }
}
