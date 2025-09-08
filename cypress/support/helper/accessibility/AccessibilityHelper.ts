/// <reference types="cypress" />
import 'cypress-axe';
import type { NodeResult, Result } from 'axe-core';

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

        violations.forEach((violation) => {
          cy.log(`${violation.id} (${violation.impact}): ${violation.description}`);
          violation.nodes.forEach((node: NodeResult) => {
            cy.log(`Element: ${JSON.stringify(node.target)}`);
            cy.log(`Failure Summary: ${node.failureSummary}`);
          });
        });

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
    pages.forEach((row) => {
      cy.visit(row.url);
      AccessibilityHelper.checkAccessibility();
    });
  }
}
