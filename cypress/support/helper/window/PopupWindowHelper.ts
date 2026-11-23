/// <reference types="cypress" />

import { ComparisonUtils } from '../../utils/ComparisonUtils';
import { StringUtils } from '../../utils/StringUtils';
import { TestDataGenerator } from '../../utils/TestDataGenerator';

export class PopupWindowHelper {
  private static popupUrl: string | undefined;

  static captureNextPopup(): void {
    PopupWindowHelper.popupUrl = undefined;

    cy.window().then((window) => {
      const popup = {
        focus: cy.stub().as('popupWindowFocus'),
      } as unknown as Window;

      cy.stub(window, 'open')
        .as('popupWindowOpen')
        .callsFake((url: string) => {
          PopupWindowHelper.popupUrl = url;
          return popup;
        });
    });
  }

  static verifyUrlContains(expectedUrlFragment: string): void {
    cy.then(() => {
      expect(PopupWindowHelper.popupUrl).to.include(expectedUrlFragment);
    });
  }

  static verifyWindowName(expectedName: string): void {
    cy.get('@popupWindowOpen').should(
      'have.been.calledWithMatch',
      Cypress.sinon.match.string,
      expectedName,
    );
  }

  static visitCapturedPopup(): void {
    cy.then(() => {
      expect(PopupWindowHelper.popupUrl, 'captured popup URL').to.be.a(
        'string',
      );
      return cy.visit(PopupWindowHelper.popupUrl as string);
    });
  }

  static verifyTitle(expectedTitle: string): void {
    cy.title().should('eq', TestDataGenerator.parseValue(expectedTitle));
  }

  static verifyHeading(expectedHeading: string): void {
    cy.get('.app-print-preview h1').should(
      'have.text',
      TestDataGenerator.parseValue(expectedHeading),
    );
  }

  static verifySummaryValues(
    rows: readonly { Label: string; Value: string }[],
  ): void {
    const occurrences = new Map<string, number>();

    for (const { Label: label, Value: value } of rows) {
      const resolvedLabel = TestDataGenerator.parseValue(label);
      const resolvedValue = TestDataGenerator.parseValue(value);
      const hasDynamicMinute = /\btimenowhhmm\b/i.test(value);
      const occurrence = occurrences.get(resolvedLabel) ?? 0;
      occurrences.set(resolvedLabel, occurrence + 1);

      cy.get('.govuk-summary-list__row')
        .filter((_, row) => {
          const actualLabel = StringUtils.normalizeText(
            Cypress.$(row).find('.govuk-summary-list__key').text(),
          );
          return actualLabel === StringUtils.normalizeText(resolvedLabel);
        })
        .eq(occurrence)
        .find('.govuk-summary-list__value')
        .should((valueElement) => {
          const actualValue =
            valueElement.prop('innerText') ?? valueElement.text();
          const normalizedActual = StringUtils.normalizeText(actualValue);
          const normalizedExpected = StringUtils.normalizeText(resolvedValue);

          if (normalizedActual.includes(normalizedExpected)) {
            return;
          }

          const expectedTimes = resolvedValue.match(/\d{1,2}:\d{2}/g) ?? [];
          const expectedWithoutTimes = normalizedExpected.replace(
            /\d{1,2}:\d{2}/g,
            '',
          );

          if (
            hasDynamicMinute &&
            normalizedActual
              .replace(/\d{1,2}:\d{2}/g, '')
              .includes(expectedWithoutTimes) &&
            expectedTimes.every((time) =>
              ComparisonUtils.textContainsTimeWithTolerance(
                actualValue,
                time,
                2,
              ),
            )
          ) {
            return;
          }

          expect(normalizedActual).to.contain(normalizedExpected);
        });
    }
  }

  static closeCapturedPopup(): void {
    cy.get('@popupWindowFocus').should('have.been.called');
  }
}
