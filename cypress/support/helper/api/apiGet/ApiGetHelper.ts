/// <reference types="cypress" />

export class ApiGetHelper {
  private static lastResponse: Cypress.Response<unknown> | null = null;

  static makeGetRequest(endpoint: string, token?: string): void {
    const options: Partial<Cypress.RequestOptions> = {
      method: 'GET',
      url: endpoint,
      failOnStatusCode: true,
      headers: {
        Authorization: `Bearer ${token ?? ''}`,
      },
    };
    cy.log(`API GET Request endpoint: ${endpoint}`);
    cy.log(`API GET Request Authorization: Bearer ${token ?? ''}`);
    cy.request(options).then((response) => {
      ApiGetHelper.lastResponse = response;
      cy.wrap(response).as('lastApiResponse');
      cy.log(`[ApiGetHelper] Received response with status: ${response.status}`);
    });
  }
}
