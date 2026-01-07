/// <reference types="cypress" />
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
}
