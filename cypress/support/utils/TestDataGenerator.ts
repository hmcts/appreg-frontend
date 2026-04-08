import { DateTimeUtil } from './DateTimeUtil';

/**
 * Utility class for generating unique test data with scenario-level consistency
 */
export class TestDataGenerator {
  private static scenarioRandom: string | null = null;

  /**
   * Initializes a new random value for the current scenario
   */
  static initializeScenario(): void {
    this.scenarioRandom = Math.floor(Math.random() * 100000).toString();
  }

  /**
   * Resets the scenario random value (called between scenarios)
   */
  static resetScenario(): void {
    this.scenarioRandom = null;
  }

  /**
   * Replaces {RANDOM} placeholders with the same random number for the entire scenario
   * @param text The text containing {RANDOM} placeholders
   * @returns Text with {RANDOM} replaced by scenario-consistent random number
   */
  static replaceRandomPlaceholders(text: string): string {
    // Initialize scenario random value if not already set
    if (!this.scenarioRandom) {
      this.initializeScenario();
    }

    return text.replace(/{RANDOM}/g, this.scenarioRandom!);
  }

  /**
   * Generates a random number
   * @param max Maximum number (default: 100000)
   * @returns Random number as string
   */
  private static getRandomNumber(max: number = 100000): string {
    return Math.floor(Math.random() * max).toString();
  }

  /**
   * Generates a random ID with timestamp for extra uniqueness
   * @returns Unique ID string
   */
  private static getUniqueId(): string {
    const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
    const random = Math.floor(Math.random() * 1000);
    return `${timestamp}${random}`;
  }

  /**
   * Generates a random string of given length
   * @param length Length of the string
   * @returns Random alphanumeric string
   */
  private static getRandomString(length: number = 8): string {
    const chars =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Generates a random email address
   * @returns Random email string
   */
  private static getRandomEmail(): string {
    const user = this.getRandomString(6);
    const domain = this.getRandomString(5);
    return `${user}@${domain}.com`;
  }

  /**
   * Parses a value by replacing {RANDOM} placeholders and date/time keywords
   * This is the centralized method used by all helpers and step definitions
   * @param value The value to parse (can contain {RANDOM}, "today", "today+7d", etc.)
   * @returns Parsed value with replacements applied
   */
  static parseValue(value: string): string {
    if (!value) {
      return value;
    }

    // Allow callers to opt out of processing via sentinel
    if (value.trim() === '*SKIP*') {
      return '';
    }

    let parsed = value;

    // Only process date/time keywords if the value contains date/time-related patterns
    // This prevents issues when processing URLs or other strings that contain "/"
    const dateTimeKeywords =
      /\b(today|tomorrow|yesterday|timenow|timestamp|numerictimestamp|localtimestamp|todayiso|tomorrowiso|yesterdayiso|todaydisplay|todaydisplaylong|displaypadded|timenowhhmm)\b/i;
    const dateArithmetic =
      /(today|todayiso|timenow|timenowhhmm|timestamp|numerictimestamp)([+-])(\d+)([dwmyhs])/i;
    const isoDateSuffix = /_iso\b/i;

    if (
      dateTimeKeywords.test(value) ||
      dateArithmetic.test(value) ||
      isoDateSuffix.test(value)
    ) {
      // Only call DateTimeUtil if value contains date/time patterns
      parsed = DateTimeUtil.parseDateValue(value);
    }

    // Then, replace {RANDOM} placeholders
    parsed = this.replaceRandomPlaceholders(parsed);

    // Resolve standalone random keywords
    switch (parsed.trim().toLowerCase()) {
      case 'randomnumber':
        return this.getRandomNumber();
      case 'uniqueid':
        return this.getUniqueId();
      case 'randomstring':
        return this.getRandomString();
      case 'randomemail':
        return this.getRandomEmail();
    }

    return parsed;
  }
}

/**
 * Processes a datatable row, replacing date/time keywords and random placeholders.
 * @param row Object representing a datatable row (key-value pairs)
 * @returns New object with generated values
 */
export function processDatatableRow(
  row: Record<string, string>,
): Record<string, string> {
  const result: Record<string, string> = {};

  for (const [key, value] of Object.entries(row)) {
    // Explicitly drop skip sentinel entries
    if (value && value.trim() === '*SKIP*') {
      continue;
    }

    result[key] = TestDataGenerator.parseValue(value);
  }

  return result;
}
