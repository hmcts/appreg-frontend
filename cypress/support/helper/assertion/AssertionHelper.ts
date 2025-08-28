export class AssertionHelper {
  static verifyPageTitle(expectedTitle: string) {
    cy.title().should('eq', expectedTitle);
  }
}
