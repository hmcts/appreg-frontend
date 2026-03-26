/// <reference types="cypress" />
export class ApiAuthHelper {
  static authenticateUser(userKey: string): Cypress.Chainable<void> {
    let ssoUsers: Record<string, { email: string; password: string }>;
    let tenantId: string;
    let clientId: string;
    let clientSecret: string;
    let scope: string;

    return cy
      .task<Record<string, { email: string; password: string }>>(
        'getEnv',
        'SSO_USERS',
      )
      .then((users: Record<string, { email: string; password: string }>) => {
        ssoUsers = users;
        return cy.task<string>('getEnv', 'TENANT_ID');
      })
      .then((tenant: string) => {
        tenantId = tenant;
        return cy.task<string>('getEnv', 'CLIENT_ID');
      })
      .then((client: string) => {
        clientId = client;
        return cy.task<string>('getEnv', 'CLIENT_SECRET');
      })
      .then((secret: string) => {
        clientSecret = secret;
        return cy.task<string>('getEnv', 'SCOPE');
      })
      .then((sc: string) => {
        scope = sc;
        const user = ssoUsers[userKey];
        const url = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;

        return cy.request({
          method: 'POST',
          url,
          form: true,
          body: {
            grant_type: 'password',
            client_id: clientId,
            client_secret: clientSecret,
            scope,
            username: user.email,
            password: user.password,
          },
        });
      })
      .then((response: { status: number; body: { access_token: string } }) => {
        expect(response.status).to.eq(200);
        cy.wrap(response.body.access_token).as('authToken');
      }) as unknown as Cypress.Chainable<void>;
  }
}
