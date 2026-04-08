import { BannerElement } from '../../../pageobjects/generic/banner/BannerElement';
import { StringUtils } from '../../../utils/StringUtils';

export class BannerHelper {
  static verifyBannerText(expectedText: string): void {
    BannerElement.findNotificationRegionByText(expectedText).should(
      'be.visible',
    );
  }

  static verifyBannerNotPresent(unexpectedText: string): void {
    BannerElement.findNotificationAlertByText(unexpectedText).should(
      'not.exist',
    );
  }
  static verifySuccessBanner(message: string): void {
    BannerElement.findSuccessAlertByText(message)
      .should('be.visible')
      .invoke('text')
      .then((actualText) => {
        const normalizedActual = StringUtils.normalizeText(actualText);
        expect(normalizedActual).to.include(message);
      });
  }

  static verifyErrorBanner(unexpectedText: string): void {
    BannerElement.getErrorAlert()
      .should('be.visible')
      .invoke('text')
      .then((actualText) => {
        const normalizedActual = StringUtils.normalizeText(actualText);
        expect(normalizedActual).to.include(unexpectedText);
      });
  }

  static verifyErrorBannerNotPresent(unexpectedText: string): void {
    BannerElement.findErrorAlertByText(unexpectedText).should('not.exist');
  }

  static verifyWarningBanner(expectedText: string): void {
    BannerElement.findWarningRegionByText(expectedText).should('be.visible');
  }
}
