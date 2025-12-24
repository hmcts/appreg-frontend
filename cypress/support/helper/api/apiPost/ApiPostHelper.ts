/// <reference types="cypress" />
import { TestDataGenerator } from '../../../utils/TestDataGenerator';

export class ApiPostHelper {
  private static resolveEndpointPlaceholders(
    endpoint: string,
  ): Cypress.Chainable<string> {
    const placeholderRegex = /:([a-zA-Z0-9_]+)|\{\{([a-zA-Z0-9_]+)\}\}/g;
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
          const withColonPlaceholdersReplaced = currentEndpoint.replace(
            new RegExp(`:${aliasName}\\b`, 'g'),
            stringValue,
          );
          const withAllPlaceholdersReplaced =
            withColonPlaceholdersReplaced.replace(
              new RegExp(`\\{\\{${aliasName}\\}\\}`, 'g'),
              stringValue,
            );
          return withAllPlaceholdersReplaced;
        }),
      );
    });

    return chain;
  }

  private static processDynamicValues(data: unknown): unknown {
    if (Array.isArray(data)) {
      return data.map((item) => ApiPostHelper.processDynamicValues(item));
    }
    if (data && typeof data === 'object') {
      return Object.fromEntries(
        Object.entries(data).map(([key, value]) => [
          key,
          ApiPostHelper.processDynamicValues(value),
        ]),
      );
    }
    if (typeof data === 'string') {
      return TestDataGenerator.parseValue(data);
    }
    return data;
  }

  private static makePostRequest(
    endpoint: string,
    body: Cypress.RequestBody,
  ): void {
    ApiPostHelper.resolveEndpointPlaceholders(endpoint).then(
      (resolvedEndpoint) => {
        const baseUrl = Cypress.env('API_BASE_URL');
        const url = baseUrl
          ? `${baseUrl}${resolvedEndpoint}`
          : resolvedEndpoint;
        cy.get('@authToken').then((token) => {
          cy.request({
            method: 'POST',
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

  /**
   * Makes a POST API request to the given endpoint using a processed row object
   * @param endpoint API endpoint
   * @param processedRow Object with processed key-value pairs
   */
  static postWithProcessedRow(
    endpoint: string,
    processedRow: Record<string, unknown>,
  ): void {
    ApiPostHelper.makePostRequest(endpoint, processedRow);
  }

  /**
   * Makes a POST API request to the given endpoint using a JSON string body
   * @param endpoint API endpoint
   * @param jsonBody JSON string body
   */
  static postWithJsonBody(endpoint: string, jsonBody: string): void {
    const parsedBody = JSON.parse(jsonBody);
    const processedBody = ApiPostHelper.processDynamicValues(
      parsedBody,
    ) as Cypress.RequestBody;
    ApiPostHelper.makePostRequest(endpoint, processedBody);
  }
}
