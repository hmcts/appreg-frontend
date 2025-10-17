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
}
