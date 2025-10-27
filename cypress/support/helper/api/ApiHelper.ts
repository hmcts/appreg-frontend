/// <reference types="cypress" />

export class ApiHelper {
  private static lastResponse: any = null;

  static makeApiRequest(endpoint: string): void {
    cy.request({
      method: 'GET',
      url: endpoint,
      failOnStatusCode: false
    }).then((response) => {
      ApiHelper.lastResponse = response;
      cy.log(`API Request to ${endpoint} returned status: ${response.status}`);
    });
  }

  static verifyApiResponseStatusCode(expectedStatusCode: number): void {
    expect(ApiHelper.lastResponse).to.not.be.null;
    expect(ApiHelper.lastResponse.status).to.eq(expectedStatusCode);
  }
}
