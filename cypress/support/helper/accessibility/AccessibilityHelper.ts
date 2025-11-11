/// <reference types="cypress" />
import 'cypress-axe';
import type { Result } from 'axe-core';

export class AccessibilityHelper {
  static checkAccessibility(): void {
    cy.injectAxe();
    cy.checkA11y(undefined, undefined, (violations: Result[]) => {
      if (violations.length) {
        // Log all violations to file for reporting
        cy.task('logA11yViolations', violations);

        // Filter for critical and serious violations
        const criticalViolations = violations.filter(
          (violation) =>
            violation.impact === 'critical' || violation.impact === 'serious',
        );

        for (const violation of violations) {
          cy.log(
            `${violation.id} (${violation.impact}): ${violation.description}`,
          );
          for (const node of violation.nodes) {
            cy.log(`Element: ${JSON.stringify(node.target)}`);
            cy.log(`Failure Summary: ${node.failureSummary}`);
          }
        }

        if (criticalViolations.length) {
          cy.then(() => {
            expect(
              criticalViolations.length,
              `Found ${criticalViolations.length} critical/serious accessibility violations`,
            ).to.equal(0);
          });
        }
      }
    });
  }

  static checkAccessibilityOnPage(url: string): void {
    cy.visit(url);
    AccessibilityHelper.checkAccessibility();
  }

  static checkAccessibilityOnPages(pages: { url: string }[]): void {
    for (const row of pages) {
      cy.visit(row.url);
      AccessibilityHelper.checkAccessibility();
    }
  }
}
