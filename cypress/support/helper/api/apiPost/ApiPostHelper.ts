export class ApiPostHelper {
  /**
   * Makes a POST API request to the given endpoint using a processed row object
   * @param endpoint API endpoint
   * @param processedRow Object with processed key-value pairs
   */
  static postWithProcessedRow(
    endpoint: string,
    processedRow: Record<string, unknown>,
  ): void {
    const baseUrl = Cypress.env('API_BASE_URL');
    const url = baseUrl ? `${baseUrl}${endpoint}` : endpoint;
    cy.get('@authToken').then((token) => {
      cy.request({
        method: 'POST',
        url,
        headers: {
          Authorization: `Bearer ${token as unknown as string}`,
          'Content-Type': 'application/vnd.hmcts.appreg.v1+json',
        },
        body: processedRow,
      }).as('lastApiResponse');
    });
  }
}
