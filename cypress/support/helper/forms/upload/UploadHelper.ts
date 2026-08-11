import { UploadElement } from '../../../pageobjects/generic/upload/UploadElement';

export class UploadHelper {
  private static hasBulkUploadTerminalState(
    $body: JQuery<HTMLElement>,
  ): boolean {
    const pageText = $body.text();

    return (
      pageText.includes('Bulk upload failed') ||
      pageText.includes('Bulk upload complete') ||
      pageText.includes('All records were uploaded successfully') ||
      pageText.includes('Error table')
    );
  }

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
   * Phase 2 — waits for either the async job progress section or a terminal
   *   bulk upload state. Fast validation failures can render the error table
   *   without ever showing the progress component.
   */
  static waitForBulkUploadToComplete(): void {
    // Phase 1: POST in-flight spinner on bulk-upload page
    UploadElement.getPageSpinner(60000).should('not.exist');

    cy.get('body', { timeout: 15000 })
      .should(($body) => {
        const hasProgress = $body.find('.app-async-job-progress').length > 0;
        const hasTerminalState = UploadHelper.hasBulkUploadTerminalState($body);

        if (!hasProgress && !hasTerminalState) {
          throw new Error('Bulk upload has not reached progress or completion');
        }
      })
      .then(($body) => {
        const hasProgress = $body.find('.app-async-job-progress').length > 0;

        if (hasProgress) {
          UploadElement.findBulkProgressByText(
            UploadElement.bulkProgressHeading,
          ).should('be.visible');
          UploadElement.findBulkProgressByText(
            UploadElement.bulkProgressBody,
          ).should('be.visible');
        }
      });

    // Wait for any visible job progress to complete and for the terminal
    // success/error state to be rendered.
    cy.get('body', { timeout: 120000 }).should(($body) => {
      const hasProgress = $body.find('.app-async-job-progress').length > 0;
      const hasTerminalState = UploadHelper.hasBulkUploadTerminalState($body);

      if (hasProgress || !hasTerminalState) {
        throw new Error('Bulk upload has not completed');
      }
    });

    cy.url().should('not.include', 'bulkUploadJobId');
  }
}
