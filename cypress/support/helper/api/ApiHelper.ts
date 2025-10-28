/// <reference types="cypress" />

export class ApiHelper {
  private static lastResponse: any = null;

  static makeGetRequest(endpoint: string): void {
    cy.request({
      method: 'GET',
      url: endpoint,
      failOnStatusCode: false
    }).then((response) => {
      ApiHelper.lastResponse = response;
      cy.log(`GET API Request to ${endpoint} returned status: ${response.status}`);
    });
  }

  static verifyApiResponseStatusCode(expectedStatusCode: number): void {
    expect(ApiHelper.lastResponse).to.not.be.null;
    expect(ApiHelper.lastResponse.status).to.eq(expectedStatusCode);
  }

  static getLastResponse(): any {
    return cy.wrap(ApiHelper.lastResponse);
  }

  static verifyResponseBodyHasProperty(propertyName: string, expectedValue?: any): void {
    expect(ApiHelper.lastResponse).to.not.be.null;
    if (expectedValue !== undefined) {
      expect(ApiHelper.lastResponse.body).to.have.property(propertyName, expectedValue);
    } else {
      expect(ApiHelper.lastResponse.body).to.have.property(propertyName);
    }
  }
}
