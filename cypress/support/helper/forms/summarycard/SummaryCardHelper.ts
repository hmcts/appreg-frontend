import { SummaryCardElement } from '../../../pageobjects/generic/summarycard/SummaryCardElement';

export class SummaryCardHelper {
  /**
   * Verify summary card exists and is visible
   */
  static verifySummaryCardVisible(cardTitle: string): void {
    SummaryCardElement.findSummaryCard(cardTitle).should('be.visible');
  }

  /**
   * Verify tag text in summary card
   */
  static verifyTagInCard(cardTitle: string, tagText: string): void {
    SummaryCardElement.findTagInCard(cardTitle).should('contain.text', tagText);
  }

  /**
   * Verify link exists in summary card
   */
  static verifyLinkInCard(cardTitle: string, linkText: string): void {
    SummaryCardElement.findLinkInCard(cardTitle, linkText).should('be.visible');
  }

  /**
   * Click a link in summary card
   */
  static clickLinkInCard(cardTitle: string, linkText: string): void {
    SummaryCardElement.findLinkInCard(cardTitle, linkText).click();
  }

  /**
   * Verify summary card has textbox with placeholder and enter value
   */
  static verifySummaryCardTextboxPlaceholder(
    cardTitle: string,
    placeholder: string,
    value: string,
  ): void {
    SummaryCardElement.findInputByPlaceholderInCard(cardTitle, placeholder)
      .first()
      .should('be.visible')
      .and('have.attr', 'placeholder', placeholder)
      .clear()
      .type(value);
  }

  /**
   * Verify text exists in summary card
   */
  static verifyTextInCard(cardTitle: string, expectedText: string): void {
    SummaryCardElement.getSummaryCardContent(cardTitle).should(
      'contain.text',
      expectedText,
    );
  }
}
