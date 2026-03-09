/// <reference types="cypress" />
import { ObjectBuilder } from '../../../utils/ObjectBuilder';
import { ApiBaseHelper } from '../apiBase/ApiBaseHelper';

export class ApiPutHelper {
  /**
   * Makes a PUT API request to the given endpoint using a processed row object
   * @param endpoint API endpoint
   * @param processedRow Object with processed key-value pairs
   */
  static putWithProcessedRow(
    endpoint: string,
    processedRow: Record<string, unknown>,
  ): void {
    ApiBaseHelper.makeRequest('PUT', endpoint, processedRow);
  }

  /**
   * Makes a PUT API request to the given endpoint using a JSON string body
   * @param endpoint API endpoint
   * @param jsonBody JSON string body
   */
  static putWithJsonBody(endpoint: string, jsonBody: string): void {
    const parsedBody = JSON.parse(jsonBody);
    const processedBody = ApiBaseHelper.processDynamicValues(
      parsedBody,
    ) as Cypress.RequestBody;
    ApiBaseHelper.makeRequest('PUT', endpoint, processedBody);
  }

  /**
   * Makes a PUT API request using a nested object built from flat dot-notation keys
   * @param endpoint API endpoint
   * @param flatProcessedRow Flat object with dot-notation keys and processed values
   */
  static putWithBuilder(
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

    ApiBaseHelper.makeRequest('PUT', endpoint, processedBody);
  }
}
