/// <reference types="cypress" />
import { TestDataGenerator } from '../../../utils/TestDataGenerator';

export class ApiBaseHelper {
  /**
   * Resolves endpoint placeholders like :listId or {{listId}} from Cypress aliases
   * @param endpoint API endpoint with placeholders
   * @returns Resolved endpoint with placeholder values
   */
  static resolveEndpointPlaceholders(
    endpoint: string,
  ): Cypress.Chainable<string> {
    const placeholderRegex = /:(\w+)|\{\{(\w+)\}\}/g;
    const placeholderNames = new Set<string>();

    let match: RegExpExecArray | null;
    while ((match = placeholderRegex.exec(endpoint)) !== null) {
      const aliasName = match[1] ?? match[2];
      if (aliasName) {
        placeholderNames.add(aliasName);
      }
    }

    let chain = cy.wrap(endpoint);
    placeholderNames.forEach((aliasName) => {
      chain = chain.then((currentEndpoint) =>
        cy.get(`@${aliasName}`).then((aliasValue) => {
          const stringValue = `${aliasValue as unknown as string}`;
          const withColonPlaceholdersReplaced = currentEndpoint.replaceAll(
            new RegExp(String.raw`:${aliasName}\b`, 'g'),
            stringValue,
          );
          const withAllPlaceholdersReplaced =
            withColonPlaceholdersReplaced.replace(
              new RegExp(String.raw`\{\{${aliasName}\}\}`, 'g'),
              stringValue,
            );
          return withAllPlaceholdersReplaced;
        }),
      );
    });

    return chain;
  }

  /**
   * Recursively processes dynamic values in data (dates, times, {RANDOM}, etc.)
   * @param data Data to process
   * @returns Processed data with dynamic values replaced
   */
  static processDynamicValues(data: unknown): unknown {
    if (Array.isArray(data)) {
      return data.map((item) => ApiBaseHelper.processDynamicValues(item));
    }
    if (data && typeof data === 'object') {
      return Object.fromEntries(
        Object.entries(data).map(([key, value]) => [
          key,
          ApiBaseHelper.processDynamicValues(value),
        ]),
      );
    }
    if (typeof data === 'string') {
      return TestDataGenerator.parseValue(data);
    }
    return data;
  }

  /**
   * Makes an authenticated API request
   * @param method HTTP method (GET, POST, PUT, DELETE, etc.)
   * @param endpoint API endpoint (can contain placeholders)
   * @param body Request body (optional)
   */
  static makeRequest(
    method: string,
    endpoint: string,
    body?: Cypress.RequestBody,
  ): void {
    ApiBaseHelper.resolveEndpointPlaceholders(endpoint).then(
      (resolvedEndpoint) => {
        const baseUrl = Cypress.env('API_BASE_URL');
        const url = baseUrl
          ? `${baseUrl}${resolvedEndpoint}`
          : resolvedEndpoint;
        cy.get('@authToken').then((token) => {
          cy.request({
            method,
            url,
            headers: {
              Authorization: `Bearer ${token as unknown as string}`,
              'Content-Type': 'application/vnd.hmcts.appreg.v1+json',
            },
            body,
          }).as('lastApiResponse');
        });
      },
    );
  }
}
