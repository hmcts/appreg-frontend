export class NavigationHelper {
  static navigateToPortalPage() {
    cy.visit('/');
  }

  static navigateToUrl(url: string) {
    cy.visit(url);
  }

  static navigateToLogin() {
    cy.visit('/login');
  }

  static verifyPageTitle(expectedTitle: string) {
    cy.title().should('eq', expectedTitle);
  }
}
