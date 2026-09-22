import { SummaryCardElement } from '../../../pageobjects/generic/summarycard/SummaryCardElement';
import { TestDataGenerator } from '../../../utils/TestDataGenerator';

export class SummaryCardHelper {
  /**
   * Verify summary card exists and is visible
   */
  static verifySummaryCardVisible(cardTitle: string): void {
    SummaryCardElement.assertSummaryCardVisible(cardTitle);
  }

  /**
   * Verify tag text in summary card
   */
  static verifyTagInCard(cardTitle: string, tagText: string): void {
    SummaryCardElement.assertTagInCardContains(cardTitle, tagText);
  }

  /**
   * Verify link exists in summary card
   */
  static verifyLinkInCard(cardTitle: string, linkText: string): void {
    SummaryCardElement.assertLinkInCardVisible(cardTitle, linkText);
  }

  /**
   * Click a link in summary card
   */
  static clickLinkInCard(cardTitle: string, linkText: string): void {
    SummaryCardElement.clickLinkInCard(cardTitle, linkText);
  }

  /**
   * Verify summary card has textbox with placeholder and enter value
   */
  static verifySummaryCardTextboxPlaceholder(
    cardTitle: string,
    placeholder: string,
    value: string,
  ): void {
    SummaryCardElement.fillInputByPlaceholderInCard(
      cardTitle,
      placeholder,
      value,
    );
  }

  /**
   * Verify text exists in summary card
   */
  static verifyTextInCard(cardTitle: string, expectedText: string): void {
    const expectedTexts = [TestDataGenerator.parseValue(expectedText)];

    const currentMinutePattern = /\btimenowhhmm\b(?![+-]\d)/i;
    if (currentMinutePattern.test(expectedText)) {
      expectedTexts.push(
        TestDataGenerator.parseValue(
          expectedText.replace(/\btimenowhhmm\b(?![+-]\d)/gi, 'timenowhhmm-1m'),
        ),
      );
    }

    SummaryCardElement.assertTextInCardMatchingAny(cardTitle, expectedTexts);
  }
}
