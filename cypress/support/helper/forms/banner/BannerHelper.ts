import { TextElement } from '../../../pageobjects/generic/text/TextElement';
import { StringUtils } from '../../../utils/StringUtils';

export class BannerHelper {
  static verifyBannerText(expectedText: string): void {
    TextElement.getTextByContent(
      expectedText,
      'app-notification-banner [role="region"]',
    ).should('be.visible');
  }

  static verifyBannerNotPresent(unexpectedText: string): void {
    TextElement.getTextByContent(
      unexpectedText,
      'app-notification-banner [role="alert"]',
    ).should('not.exist');
  }
  static verifySuccessBanner(message: string): void {
    TextElement.getText('app-success-banner [role="alert"]')
      .should('be.visible')
      .invoke('text')
      .then((actualText) => {
        const normalizedActual = StringUtils.normalizeText(actualText);
        expect(normalizedActual).to.include(message);
      });
  }

  static verifyErrorBanner(unexpectedText: string): void {
    TextElement.getText('app-error-summary [role="alert"]')
      .should('be.visible')
      .invoke('text')
      .then((actualText) => {
        const normalizedActual = StringUtils.normalizeText(actualText);
        expect(normalizedActual).to.include(unexpectedText);
      });
  }

  static verifyErrorBannerNotPresent(unexpectedText: string): void {
    TextElement.getTextByContent(
      unexpectedText,
      'app-error-summary [role="alert"]',
    ).should('not.exist');
  }
}
