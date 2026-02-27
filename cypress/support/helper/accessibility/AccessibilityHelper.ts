/// <reference types="cypress" />
import 'cypress-axe';
import type { Result, RunOptions } from 'axe-core';

const WCAG22_AA_OPTIONS: RunOptions = {
  runOnly: {
    type: 'tag',
    values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'],
  },
  rules: {
    'target-size': { enabled: true },
  },
};

export class AccessibilityHelper {
  static checkAccessibility(): void {
    cy.injectAxe();
    cy.checkA11y(undefined, WCAG22_AA_OPTIONS, (violations: Result[]) => {
      // Count violations by impact level
      const violationsByImpact = {
        critical: violations.filter((v) => v.impact === 'critical').length,
        serious: violations.filter((v) => v.impact === 'serious').length,
        moderate: violations.filter((v) => v.impact === 'moderate').length,
        minor: violations.filter((v) => v.impact === 'minor').length,
      };

      const summary = `Total: ${violations.length} | Critical: ${violationsByImpact.critical} | Serious: ${violationsByImpact.serious} | Moderate: ${violationsByImpact.moderate} | Minor: ${violationsByImpact.minor}`;

      // Log to Cypress UI
      cy.log('**Accessibility Check Summary**');
      cy.log(summary);

      // Log to terminal console
      cy.task('log', `[A11Y SUMMARY] ${summary}`);

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
