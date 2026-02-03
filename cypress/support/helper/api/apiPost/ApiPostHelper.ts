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
    const processedBody = ApiBaseHelper.processDynamicValues(
      parsedBody,
    ) as Cypress.RequestBody;
    ApiBaseHelper.makeRequest('POST', endpoint, processedBody);
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
    const processedBody = ApiBaseHelper.processDynamicValues(
      nestedBody,
    ) as Cypress.RequestBody;

    // Log the built request for debugging
    cy.log('Built nested object from dot-notation');
    cy.log('Request Body:', JSON.stringify(processedBody, null, 2));

    ApiBaseHelper.makeRequest('POST', endpoint, processedBody);
  }
}
