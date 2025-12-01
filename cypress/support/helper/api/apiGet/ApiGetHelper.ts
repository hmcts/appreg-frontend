/// <reference types="cypress" />

export class ApiGetHelper {
  private static lastResponse: Cypress.Response<unknown> | null = null;

  static makeGetRequest(endpoint: string, token?: string): void {
    const options: Partial<Cypress.RequestOptions> = {
      method: 'GET',
      url: endpoint,
      failOnStatusCode: false,
    };
    cy.log(`API GET Request endpoint: ${endpoint}`);
    if (token) {
      options.headers = {
        Authorization: `Bearer ${token}`,
      };
    }
    cy.request(options).then((response) => {
      ApiGetHelper.lastResponse = response;
      cy.log(`GET API Request to ${endpoint} returned status: ${response.status}`);
      if (response.status !== 200) {
        cy.log(`GET API Response body: ${JSON.stringify(response.body)}`);
      }
    });
  }
}
