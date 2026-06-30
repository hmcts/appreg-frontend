import { BannerElement } from '../../../pageobjects/generic/banner/BannerElement';
import { StringUtils } from '../../../utils/StringUtils';

type BannerVerificationOptions = {
  assertAbovePageHeader?: boolean;
};

export class BannerHelper {
  private static readonly placementTolerancePx = 1;

  private static verifyBannerAbovePageHeader(
    $banner: JQuery<HTMLElement>,
    options: BannerVerificationOptions = {},
  ): void {
    if (options.assertAbovePageHeader === false) {
      return;
    }

    BannerElement.getPageHeader().then(($pageHeader) => {
      const bannerRect = $banner[0].getBoundingClientRect();
      const pageHeaderRect = $pageHeader[0].getBoundingClientRect();

      expect(
        bannerRect.bottom,
        'banner bottom should be above the page header top',
      ).to.be.at.most(pageHeaderRect.top + BannerHelper.placementTolerancePx);
    });
  }

  static verifyBannerText(
    expectedText: string,
    options: BannerVerificationOptions = {},
  ): void {
    // Previous assertion:
    // BannerElement.findNotificationRegionByText(expectedText).should(
    //   'be.visible',
    // );
    BannerElement.findNotificationRegionByText(expectedText)
      .should('be.visible')
      .then(($banner) => this.verifyBannerAbovePageHeader($banner, options));
  }

  static verifyBannerNotPresent(unexpectedText: string): void {
    BannerElement.findNotificationAlertByText(unexpectedText).should(
      'not.exist',
    );
  }
  static verifySuccessBanner(
    message: string,
    options: BannerVerificationOptions = {},
  ): void {
    // Previous assertion:
    // BannerElement.findSuccessAlertByText(message)
    //   .should('be.visible')
    //   .invoke('text')
    //   .then((actualText) => {
    //     const normalizedActual = StringUtils.normalizeText(actualText);
    //     expect(normalizedActual).to.include(message);
    //   });
    BannerElement.findSuccessAlertByText(message)
      .should('be.visible')
      .then(($banner) => {
        const actualText = $banner.text();
        const normalizedActual = StringUtils.normalizeText(actualText);
        expect(normalizedActual).to.include(message);
        this.verifyBannerAbovePageHeader($banner, options);
      });
  }

  static verifyErrorBanner(
    unexpectedText: string,
    options: BannerVerificationOptions = {},
  ): void {
    // Previous assertion:
    // BannerElement.getErrorAlert()
    //   .should('be.visible')
    //   .invoke('text')
    //   .then((actualText) => {
    //     const normalizedActual = StringUtils.normalizeText(actualText);
    //     expect(normalizedActual).to.include(unexpectedText);
    //   });
    BannerElement.getErrorAlert()
      .should('be.visible')
      .then(($banner) => {
        const actualText = $banner.text();
        const normalizedActual = StringUtils.normalizeText(actualText);
        expect(normalizedActual).to.include(unexpectedText);
        this.verifyBannerAbovePageHeader($banner, options);
      });
  }

  static verifyErrorBannerNotPresent(unexpectedText: string): void {
    BannerElement.findErrorAlertByText(unexpectedText).should('not.exist');
  }

  static verifyWarningBanner(
    expectedText: string,
    options: BannerVerificationOptions = {},
  ): void {
    // Previous assertion:
    // BannerElement.findWarningRegionByText(expectedText).should('be.visible');
    BannerElement.findWarningRegionByText(expectedText)
      .should('be.visible')
      .then(($banner) => this.verifyBannerAbovePageHeader($banner, options));
  }

  static verifySuccessBannerContaining(
    heading: string,
    bodyText: string,
    options: BannerVerificationOptions = {},
  ): void {
    // Previous assertion:
    // BannerElement.findSuccessAlertWithBody(heading, bodyText).should(
    //   'be.visible',
    // );
    BannerElement.findSuccessAlertWithBody(heading, bodyText)
      .should('be.visible')
      .then(($banner) => this.verifyBannerAbovePageHeader($banner, options));
  }

  static verifyErrorBannerContaining(
    heading: string,
    bodyText: string,
    options: BannerVerificationOptions = {},
  ): void {
    // Previous assertion:
    // BannerElement.findErrorAlertWithBody(heading, bodyText).should(
    //   'be.visible',
    // );
    BannerElement.findErrorAlertWithBody(heading, bodyText)
      .should('be.visible')
      .then(($banner) => this.verifyBannerAbovePageHeader($banner, options));
  }
}
