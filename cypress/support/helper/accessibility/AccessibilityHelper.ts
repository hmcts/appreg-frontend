/// <reference types="cypress" />
import 'cypress-axe';
import type { NodeResult, Result } from 'axe-core';

export class AccessibilityHelper {
  static checkAccessibility(): void {
    cy.injectAxe();
    cy.checkA11y(undefined, undefined, (violations: Result[]) => {
      if (violations.length) {
        const criticalViolations = violations.filter(
          (violation) =>
            violation.impact === 'critical' || violation.impact === 'serious',
        );

        violations.forEach((violation) => {
          // eslint-disable-next-line no-console
          console.log(
            `${violation.id} (${violation.impact}): ${violation.description}`,
          );
          violation.nodes.forEach((node: NodeResult) => {
            // eslint-disable-next-line no-console
            console.log('Element:', node.target);
            // eslint-disable-next-line no-console
            console.log('Failure Summary:', node.failureSummary);
          });
        });

        if (criticalViolations.length) {
          cy.then(() => {
            // Put the message on .equal(...) to avoid any stray Jest typings
            expect(criticalViolations.length).to.equal(
              0,
              `Found ${criticalViolations.length} critical/serious accessibility violations`,
            );
          });
        }
      }
    });
  }

  static checkAccessibilityOnPage(url: string): void {
    cy.visit(url);
    AccessibilityHelper.checkAccessibility();
  }

  // Use T[] style for ESLint rule
  static checkAccessibilityOnPages(pages: { url: string }[]): void {
    pages.forEach((row) => {
      cy.visit(row.url);
      AccessibilityHelper.checkAccessibility();
    });
  }
}
