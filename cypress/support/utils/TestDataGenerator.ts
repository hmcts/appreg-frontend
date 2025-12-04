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
  static getRandomNumber(max: number = 100000): string {
    return Math.floor(Math.random() * max).toString();
  }

  /**
   * Generates a random ID with timestamp for extra uniqueness
   * @returns Unique ID string
   */
  static getUniqueId(): string {
    const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
    const random = Math.floor(Math.random() * 1000);
    return `${timestamp}${random}`;
  }

  /**
   * Generates a random string of given length
   * @param length Length of the string
   * @returns Random alphanumeric string
   */
  static getRandomString(length: number = 8): string {
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
  static getRandomEmail(): string {
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
    
    // First, replace date/time keywords
    let parsed = DateTimeUtil.parseDateValue(value);
    
    // Then, replace {RANDOM} placeholders
    parsed = this.replaceRandomPlaceholders(parsed);
    
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
    let processedValue = value;

    // Use the centralized parseValue method for date/time and {RANDOM} replacements
    processedValue = TestDataGenerator.parseValue(processedValue);

    // Optionally, handle other random keywords
    if (processedValue === 'randomnumber') {
      processedValue = TestDataGenerator.getRandomNumber();
    }
    if (processedValue === 'uniqueid') {
      processedValue = TestDataGenerator.getUniqueId();
    }
    if (processedValue === 'randomstring') {
      processedValue = TestDataGenerator.getRandomString();
    }
    if (processedValue === 'randomemail') {
      processedValue = TestDataGenerator.getRandomEmail();
    }

    result[key] = processedValue;
  }

  return result;
}
