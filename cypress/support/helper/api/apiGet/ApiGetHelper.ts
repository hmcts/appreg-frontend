/// <reference types="cypress" />

import { ApiBaseHelper } from '../apiBase/ApiBaseHelper';

export class ApiGetHelper {
  private static lastResponse: Cypress.Response<unknown> | null = null;

  static makeGetRequest(endpoint: string): void {
    ApiBaseHelper.makeRequest('GET', endpoint);
  }

  static makeGetRequestUsingFE(endpoint: string, token?: string): void {
    const options: Partial<Cypress.RequestOptions> = {
      method: 'GET',
      url: endpoint,
      failOnStatusCode: false,
      headers: {
        Authorization: `Bearer ${token ?? ''}`,
      },
    };
    cy.log(`API GET Request full URL: ${endpoint}`);
    cy.request(options).then((response) => {
      ApiGetHelper.lastResponse = response;
      cy.wrap(response).as('lastApiResponse');
      cy.log(
        `[ApiGetHelper] Received response with status: ${response.status}`,
      );
    });
  }
}
