export class ApiAuthHelper {
  static authenticateUser(userKey: string): Cypress.Chainable<void> {
    const user = Cypress.env('SSO_USERS')[userKey];
    const url = `https://login.microsoftonline.com/${Cypress.env('TENANT_ID')}/oauth2/v2.0/token`;
    return cy
      .request({
        method: 'POST',
        url,
        form: true,
        body: {
          grant_type: 'password',
          client_id: Cypress.env('CLIENT_ID'),
          client_secret: Cypress.env('CLIENT_SECRET'),
          scope: Cypress.env('SCOPE'),
          username: user.email,
          password: user.password,
        },
      })
      .then((response) => {
        expect(response.status).to.eq(200);
        cy.wrap(response.body.access_token).as('authToken');
      }) as unknown as Cypress.Chainable<void>;
  }
}
