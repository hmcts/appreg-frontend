/// <reference types="cypress" />
import { ObjectBuilder } from '../../../utils/ObjectBuilder';
import { ApiBaseHelper } from '../apiBase/ApiBaseHelper';

export class ApiPostHelper {
  /**
   * Makes a POST API request to the given endpoint using a processed row object
   * @param endpoint API endpoint
   * @param processedRow Object with processed key-value pairs
   */
  static postWithProcessedRow(
    endpoint: string,
    processedRow: Record<string, unknown>,
  ): void {
    ApiBaseHelper.makeRequest('POST', endpoint, processedRow);
  }

  /**
   * Makes a POST API request to the given endpoint using a JSON string body
   * @param endpoint API endpoint
   * @param jsonBody JSON string body
   */
  static postWithJsonBody(endpoint: string, jsonBody: string): void {
    const parsedBody = JSON.parse(jsonBody);
    ApiBaseHelper.resolveBodyPlaceholders(parsedBody).then((resolvedBody) => {
      const processedBody = ApiBaseHelper.processDynamicValues(
        resolvedBody,
      ) as Cypress.RequestBody;
      ApiBaseHelper.makeRequest('POST', endpoint, processedBody);
    });
  }

  /**
   * Makes a POST API request using a nested object built from flat dot-notation keys
   * @param endpoint API endpoint
   * @param flatProcessedRow Flat object with dot-notation keys and processed values
   */
  static postWithBuilder(
    endpoint: string,
    flatProcessedRow: Record<string, string>,
  ): void {
    const nestedBody = ObjectBuilder.buildNestedObject(flatProcessedRow);
    ApiBaseHelper.resolveBodyPlaceholders(nestedBody).then((resolvedBody) => {
      const processedBody = ApiBaseHelper.processDynamicValues(
        resolvedBody,
      ) as Cypress.RequestBody;

      // Log the built request for debugging
      cy.log('Built nested object from dot-notation');
      cy.log('Request Body:', JSON.stringify(processedBody, null, 2));

      ApiBaseHelper.makeRequest('POST', endpoint, processedBody);
    });
  }

  static postMultipartFile(
    endpoint: string,
    fileName: string,
    contentType: string,
  ): void {
    if (fileName === 'bulk-upload-entries.csv') {
      const suffix = Cypress._.random(100000, 999999).toString();
      cy.task<string>('buildBulkUploadCsv', { fileName, suffix }).then(
        (fileContents) => {
          ApiPostHelper.postMultipartFileContents(
            endpoint,
            fileName,
            fileContents,
            contentType,
          );
        },
      );
      return;
    }

    cy.readFile(`cypress/fixtures/${fileName}`, 'utf8').then((fileContents) => {
      ApiPostHelper.postMultipartFileContents(
        endpoint,
        fileName,
        fileContents,
        contentType,
      );
    });
  }

  static postRaw(
    endpoint: string,
    body: string,
    headers?: Record<string, string>,
  ): void {
    ApiBaseHelper.makeRawRequest('POST', endpoint, {
      body,
      headers,
    });
  }

  private static postMultipartFileContents(
    endpoint: string,
    fileName: string,
    fileContents: string,
    contentType: string,
  ): void {
    const boundary = `----CypressFormBoundary${Date.now()}`;
    const multipartBody =
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="file"; filename="${fileName}"\r\n` +
      `Content-Type: ${contentType}\r\n\r\n` +
      `${fileContents}\r\n` +
      `--${boundary}--\r\n`;

    ApiBaseHelper.makeRawRequest('POST', endpoint, {
      body: multipartBody,
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
      },
    });
  }
}
