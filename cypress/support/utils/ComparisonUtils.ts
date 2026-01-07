/// <reference types="cypress" />
import { DateTimeUtil } from './DateTimeUtil';

/**
 * Utility class for comparing values with different matching strategies
 */
export class ComparisonUtils {
  /**
   * Compares two values with multiple matching strategies:
   * 1. Exact match
   * 2. Time tolerance match (for HH:mm format)
   * 3. Case-insensitive match
   *
   * @param actual The actual value found
   * @param expected The expected value
   * @param toleranceMinutes Time tolerance in minutes (default: 2)
   * @returns Object with match result and match type
   */
  static matchesWithTolerance(
    actual: string,
    expected: string,
    toleranceMinutes: number = 2,
  ): {
    matches: boolean;
    matchType: 'exact' | 'time-tolerance' | 'case-insensitive' | 'none';
  } {
    // Exact match
    if (actual === expected) {
      return { matches: true, matchType: 'exact' };
    }

    // Time tolerance match
    if (
      DateTimeUtil.isTimeWithinTolerance(actual, expected, toleranceMinutes)
    ) {
      return { matches: true, matchType: 'time-tolerance' };
    }

    // Case-insensitive match
    if (actual.toLowerCase() === expected.toLowerCase()) {
      return { matches: true, matchType: 'case-insensitive' };
    }

    // No match
    return { matches: false, matchType: 'none' };
  }

  /**
   * Simple boolean version - just returns true/false
   * @param actual The actual value found
   * @param expected The expected value
   * @param toleranceMinutes Time tolerance in minutes (default: 2)
   * @returns True if values match (exact, time tolerance, or case-insensitive)
   */
  static matches(
    actual: string,
    expected: string,
    toleranceMinutes: number = 2,
  ): boolean {
    return this.matchesWithTolerance(actual, expected, toleranceMinutes)
      .matches;
  }

  /**
   * Checks if text contains a time value that matches the expected time within tolerance
   * @param text The text to search in (e.g., PDF text)
   * @param expectedTime The expected time in HH:mm format
   * @param toleranceMinutes Time tolerance in minutes (default: 2)
   * @returns True if any time in text matches expected time within tolerance
   */
  static textContainsTimeWithTolerance(
    text: string,
    expectedTime: string,
    toleranceMinutes: number = 2,
  ): boolean {
    const timeRegex = /\d{1,2}:\d{2}/g;
    const timesInText = text.match(timeRegex) || [];

    return timesInText.some((time) =>
      DateTimeUtil.isTimeWithinTolerance(time, expectedTime, toleranceMinutes),
    );
  }
}
