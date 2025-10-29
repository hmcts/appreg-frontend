/// <reference types="cypress" />

export class ApiHelper {
  private static lastResponse: Cypress.Response<unknown> | null = null;

  static makeGetRequest(endpoint: string): void {
    cy.request({
      method: 'GET',
      url: endpoint,
      failOnStatusCode: false,
    }).then((response) => {
      ApiHelper.lastResponse = response;
      cy.log(
        `GET API Request to ${endpoint} returned status: ${response.status}`,
      );
    });
  }

  static verifyApiResponseStatusCode(expectedStatusCode: number): void {
    cy.wrap(ApiHelper.lastResponse)
      .should('not.be.null')
      .then((response) => {
        expect(response!.status).to.eq(expectedStatusCode);
      });
  }

  static getLastResponse(): Cypress.Chainable<Cypress.Response<unknown> | null> {
    return cy.wrap(ApiHelper.lastResponse);
  }

  static verifyResponseBodyHasProperty(
    propertyName: string,
    expectedValue?: unknown,
  ): void {
    cy.wrap(ApiHelper.lastResponse)
      .should('not.be.null')
      .then((response) => {
        if (expectedValue !== undefined) {
          expect(response!.body).to.have.property(propertyName, expectedValue);
        } else {
          expect(response!.body).to.have.property(propertyName);
        }
      });
  }
}
