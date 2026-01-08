/// <reference types="cypress" />

export class StringUtils {
  /**
   * Normalizes text by removing extra whitespace and special characters
   * @param text The text to normalize
   * @returns Normalized text with single spaces and trimmed
   */
  static normalizeText(text: string): string {
    return text
      .replaceAll('&nbsp;', ' ')
      .replace(/[–—]/g, '-')
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Builds a regex that matches numbered entries like "1. Applicant"
   * @param entryType Entry label to match
   */
  static buildNumberedEntryPattern(entryType: string): RegExp {
    const normalizedEntryType = this.normalizeText(entryType);
    const escapedEntryType = normalizedEntryType.replaceAll(
      /[.*+?^${}()|[\]\\]/g,
      String.raw`\$&`,
    );
    return new RegExp(String.raw`\d+\.\s+${escapedEntryType}`, 'g');
  }
}
