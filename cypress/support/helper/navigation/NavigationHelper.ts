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
}
