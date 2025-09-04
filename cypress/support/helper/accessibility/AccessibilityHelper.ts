/// <reference types="cypress" />
import 'cypress-axe';

export class AccessibilityHelper {
  static checkAccessibility(): void {
    cy.injectAxe();
    cy.checkA11y(undefined, undefined, (violations) => {
      if (violations.length) {
        const criticalViolations = violations.filter(violation => 
          violation.impact === 'critical' || violation.impact === 'serious'
        );
        
        violations.forEach((violation) => {
          // eslint-disable-next-line no-console
          console.log(`${violation.id} (${violation.impact}): ${violation.description}`);
          violation.nodes.forEach((node) => {
            // eslint-disable-next-line no-console
            console.log('Element:', node.target);
            // eslint-disable-next-line no-console
            console.log('Failure Summary:', node.failureSummary);
          });
        });
        
        if (criticalViolations.length) {
          cy.then(() => {
            expect(criticalViolations.length, `Found ${criticalViolations.length} critical/serious accessibility violations`).to.equal(0);
          });
        }
      }
    });
  }

  static checkAccessibilityOnPage(url: string): void {
    cy.visit(url);
    AccessibilityHelper.checkAccessibility();
  }

  static checkAccessibilityOnPages(pages: Array<{ url: string }>): void {
    pages.forEach((row) => {
      cy.visit(row.url);
      AccessibilityHelper.checkAccessibility();
    });
  }
}
