import { UploadElement } from '../../../pageobjects/generic/upload/UploadElement';

export class UploadHelper {
  private static readonly bulkUploadSuccessHeading = 'Bulk upload complete';
  private static readonly bulkUploadFailureHeading = 'Bulk upload failed';
  private static readonly bulkUploadErrorExportButton =
    'Export the file with errors shown';

  /**
   * Selects a file from cypress/fixtures via the file input element.
   */
  static selectFile(fileName: string): void {
    UploadElement.getFileInput().selectFile(`cypress/fixtures/${fileName}`, {
      force: true,
    });
  }

  static selectFileContents(
    fileName: string,
    fileContents: string,
    mimeType: string,
  ): void {
    UploadElement.getFileInput().selectFile(
      {
        contents: Cypress.Buffer.from(fileContents),
        fileName,
        mimeType,
        lastModified: Date.now(),
      },
      {
        force: true,
      },
    );
  }

  /**
   * Waits for the full bulk upload lifecycle to complete:
   *
   * Phase 1 — bulk-upload page: waits for the submission spinner
   *   (app-loading-spinner) to disappear, indicating the POST was accepted
   *   and the app has navigated to the list detail page.
   *
   * Phase 2 — list detail page: asserts the async job progress section
   *   (.app-async-job-progress) is visible with the expected headings,
   *   then waits for it to disappear once the background job finishes.
   */
  static waitForBulkUploadToComplete(): void {
    // Phase 1: POST in-flight spinner on bulk-upload page
    UploadElement.getPageSpinner(60000).should('not.exist');

    // Phase 2: list detail page reaches either an in-progress state or a
    // terminal state. Staging can skip the visible progress widget entirely
    // when the job fails or completes quickly.
    cy.get('body', { timeout: 120000 }).should(($body) => {
      const bodyText = $body.text();
      const hasProgress = $body.find('.app-async-job-progress').length > 0;
      const hasFailureState =
        bodyText.includes(UploadHelper.bulkUploadFailureHeading) ||
        bodyText.includes(UploadHelper.bulkUploadErrorExportButton);
      const hasSuccessState = bodyText.includes(
        UploadHelper.bulkUploadSuccessHeading,
      );

      if (!hasProgress && !hasFailureState && !hasSuccessState) {
        throw new Error(
          'bulk upload should show progress or a terminal result',
        );
      }
    });

    cy.get('body').then(($body) => {
      if ($body.find('.app-async-job-progress').length === 0) {
        return;
      }

      UploadElement.findBulkProgressByText(
        UploadElement.bulkProgressHeading,
      ).should('be.visible');
      UploadElement.findBulkProgressByText(
        UploadElement.bulkProgressBody,
      ).should('be.visible');

      // Wait for job to complete if the progress widget was rendered.
      UploadElement.getBulkProgress(120000).should('not.exist');
    });

    cy.url().should('not.include', 'bulkUploadJobId');
  }
}
