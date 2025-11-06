/// <reference types="cypress" />

export class StringUtils {
  /**
   * Normalizes text by removing extra whitespace and special characters
   * @param text The text to normalize
   * @returns Normalized text with single spaces and trimmed
   */
  static normalizeText(text: string): string {
    return text
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
