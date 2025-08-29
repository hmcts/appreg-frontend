export class NavigationHelper {
  static navigateToPortalPage() {
    cy.log('Navigating to portal page: ', Cypress.config('baseUrl'));
    cy.visit('/');
  }

  static navigateToUrl(url: string) {
    cy.log(`Navigating to ${url}`);
    cy.visit(url);
  }

  static navigateToLogin() {
    cy.log('Navigating to login page: ', Cypress.config('baseUrl') + '/login');
    cy.visit('/login');
  }

  static verifyPageTitle(expectedTitle: string) {
    cy.log(`Verifying page title is ${expectedTitle}`);
    cy.title().should('eq', expectedTitle);
  }
}
