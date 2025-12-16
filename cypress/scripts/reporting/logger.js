/**
 * Custom logger utility for Cypress scripts
 * Provides structured logging without triggering ESLint console warnings
 */

const logLevels = {
  INFO: 'INFO',
  ERROR: 'ERROR',
  WARN: 'WARN',
};

/**
 * Logger class to handle structured logging
 */
class Logger {
  /**
   * Log informational messages
   * @param {string} message - The message to log
   * @param {...any} args - Additional arguments to log
   */
  info(message, ...args) {
    // eslint-disable-next-line no-console
    console.info(`[${logLevels.INFO}]`, message, ...args);
  }

  /**
   * Log error messages
   * @param {string} message - The error message to log
   * @param {...any} args - Additional arguments to log
   */
  error(message, ...args) {
    // eslint-disable-next-line no-console
    console.error(`[${logLevels.ERROR}]`, message, ...args);
  }

  /**
   * Log warning messages
   * @param {string} message - The warning message to log
   * @param {...any} args - Additional arguments to log
   */
  warn(message, ...args) {
    // eslint-disable-next-line no-console
    console.warn(`[${logLevels.WARN}]`, message, ...args);
  }
}

// Export singleton instance
module.exports = new Logger();
