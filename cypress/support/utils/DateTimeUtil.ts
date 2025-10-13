/**
 * DateTimeUtil - Date/time utility for test automation
 *
 * DATE KEYWORDS:
 * - "today"           → Today's date in DD/MM/YYYY format
 * - "tomorrow"        → Tomorrow's date in DD/MM/YYYY format
 * - "yesterday"       → Yesterday's date in DD/MM/YYYY format
 * - "todayiso"        → Today's date in YYYY-MM-DD format
 * - "display"         → Today in DD MMM YYYY format (e.g., "30 Sep 2025")
 * - "displaypadded"   → Today in DD MMM YYYY format (padded)
 *
 * TIME KEYWORDS:
 * - "timenow"         → Current time in HH:mm:ss format
 * - "timestamp"       → Current GMT timestamp (ISO format)
 * - "numerictimestamp"→ Current numeric timestamp (milliseconds)
 * - "localtimestamp"  → Current local timestamp
 *
 * DATE ARITHMETIC (+ or -):
 * - "today+1d"        → Tomorrow
 * - "today-7d"        → 1 week ago
 * - "today+2w"        → 2 weeks from today
 * - "today+3m"        → 3 months from today
 * - "today+1y"        → 1 year from today
 *
 * TIME ARITHMETIC (+ or -):
 * - "timenow+2h"      → 2 hours from now
 * - "timenow-30m"     → 30 minutes ago
 * - "timenow+45s"     → 45 seconds from now
 *
 * TIMESTAMP ARITHMETIC:
 * - "timestamp+1d"    → Timestamp 1 day from now
 * - "timestamp-2h"    → Timestamp 2 hours ago
 *
 * STATIC VALUES:
 * - "22/7/2024"       → Fixed date (unchanged)
 * - "14:30:00"        → Fixed time (unchanged)
 *
 * UNITS SUPPORTED:
 * - d = days, w = weeks, m = months, y = years
 * - h = hours, m = minutes (in time context), s = seconds
 */
export class DateTimeUtil {
  private constructor() {}

  // Format constants
  static readonly DTF_DD_MM_YYYY = 'DD/MM/YYYY';
  static readonly DTF_DD_MMM_YYYY = 'DD MMM YYYY';
  static readonly DTF_YYYY_MM_DD = 'YYYY-MM-DD';
  static readonly DTF_GMT_TIMESTAMP = 'YYYY-MM-DDTHH:mm:ss.sssZ';
  static readonly DTF_TIME_ONLY = 'HH:mm:ss';

  /**
   * Converts dynamic date/time strings to actual values
   * @param dateValue Examples: "today", "today+7d", "today-3m", "timenow", "timestamp", "22/7/2024"
   * @returns Processed date/time string in appropriate format
   */
  static parseDateValue(dateValue: string): string {
    if (!dateValue || dateValue.trim() === '') {
      return this.formatDate(new Date());
    }

    const input = dateValue.toLowerCase().trim();

    // Handle basic keywords without arithmetic
    if (!input.includes('+') && !input.includes('-')) {
      return this.substituteDateValue(dateValue);
    }

    // Parse arithmetic expressions
    const arithmeticPattern =
      /(today|timenow|timestamp|numerictimestamp)([+-])(\d+)([dwmyhs])/i;
    const arithmeticMatch = input.match(arithmeticPattern);

    if (arithmeticMatch) {
      const baseKeyword = arithmeticMatch[1];
      const operator = arithmeticMatch[2];
      const amount = parseInt(arithmeticMatch[3]);
      const unit = arithmeticMatch[4].toLowerCase();

      const modifier = operator === '+' ? amount : -amount;

      // Calculate result
      return this.calculateArithmetic(baseKeyword, modifier, unit);
    }

    // If no pattern matches, treat as static date or return as-is
    const result = dateValue;

    // Validate date format if it looks like a date (contains /)
    if (result.includes('/') && !this.isValidDateFormat(result)) {
      throw new Error(
        `Invalid date format: ${result}. Expected DD/MM/YYYY format.`,
      );
    }

    return result;
  }

  /**
   * Validates that a string matches DD/MM/YYYY format
   * @param dateStr The date string to validate
   * @returns true if valid format
   */
  private static isValidDateFormat(dateStr: string): boolean {
    const dateRegex = /^\d{1,2}\/\d{1,2}\/\d{4}$/;
    return dateRegex.test(dateStr);
  }

  /**
   * Substitute special date/time keywords
   * @param pattern The pattern to substitute
   * @returns Substituted date/time string or original pattern
   */
  static substituteDateValue(pattern: string): string {
    if (!pattern || pattern.trim() === '') {
      return this.formatDate(new Date());
    }

    switch (pattern.toLowerCase().trim()) {
      // Date keywords
      case 'today':
        return this.formatDate(new Date());
      case 'tomorrow':
        return this.getDateWithOffset(1);
      case 'yesterday':
        return this.getDateWithOffset(-1);
      case 'todayiso':
        return this.formatToday('iso');
      case 'display':
        return this.formatToday('display');
      case 'displaypadded':
        return this.formatToday('padded');

      // Time keywords
      case 'timenow':
        return this.timeNow();
      case 'timestamp':
        return this.createTimestamp('iso');
      case 'numerictimestamp':
        return this.createTimestamp('numeric');
      case 'localtimestamp':
        return this.createTimestamp('local');

      // Fallback
      default:
        return pattern;
    }
  }

  /**
   * Unified arithmetic calculation for time, date, and timestamp
   * @param baseType The base type: 'time', 'date', 'timestamp', 'numerictimestamp'
   * @param modifier The amount to add/subtract
   * @param unit The time unit
   * @returns Modified value string
   */
  static calculateArithmetic(
    baseType: string,
    modifier: number,
    unit: string,
  ): string {
    const now = new Date();
    let effectiveUnit = unit;

    // Handle context-dependent 'm' unit:
    // 'm' = months for date contexts, minutes for time contexts
    if (unit === 'm') {
      const isTimeContext = [
        'timenow',
        'time',
        'timestamp',
        'numerictimestamp',
      ].includes(baseType.toLowerCase());
      effectiveUnit = isTimeContext ? 'min' : 'm'; // Use 'min' for minutes to avoid conflict
    }

    // Apply arithmetic
    const result = this.addToDateTime(now, modifier, effectiveUnit);

    // Return appropriate format based on base type
    switch (baseType.toLowerCase()) {
      case 'timenow':
      case 'time':
        return this.formatTime(result);
      case 'timestamp':
        return result.toISOString();
      case 'numerictimestamp':
        return result.getTime().toString();
      case 'today':
      case 'date':
      default:
        return this.formatDate(result);
    }
  }

  /**
   * Format time as HH:mm:ss with padded values
   * @param date Date object to format
   * @returns Time string in HH:mm:ss format
   */
  static formatTime(date: Date): string {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  }

  /**
   * Get current time in HH:mm:ss format
   */
  static timeNow(): string {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  }

  /**
   * Format today's date in different formats
   * @param format The format type: 'display', 'iso', or 'padded'
   * @returns Formatted date string
   */
  static formatToday(format: 'display' | 'iso' | 'padded' = 'display'): string {
    const date = new Date();

    switch (format) {
      case 'iso':
        return date.toISOString().split('T')[0]; // YYYY-MM-DD
      case 'display':
      case 'padded':
        return this.formatWithPattern(date, 'DD MMM YYYY'); // DD MMM YYYY
      default:
        return this.formatWithPattern(date, 'DD MMM YYYY');
    }
  }

  /**
   * Date arithmetic method
   * @param amount Amount to add (positive) or subtract (negative)
   * @param unit Time unit ('d', 'w', 'm', 'y')
   * @returns Date string in DD/MM/YYYY format
   */
  static dateArithmetic(amount: number, unit: string): string {
    return this.formatDate(this.addToDateTime(new Date(), amount, unit));
  }

  /**
   * Format Date object to DD/MM/YYYY string
   * @param date The Date object to format
   * @returns Formatted date string
   */
  static formatDate(date: Date): string {
    const day = date.getDate();
    const month = date.getMonth() + 1; // Month is 0-indexed
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  }

  /**
   * Format date with custom pattern
   * @param date The Date object
   * @param pattern The pattern string
   * @returns Formatted date string
   */
  static formatWithPattern(date: Date, pattern: string): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString();
    const shortMonth = date.toLocaleDateString('en', { month: 'short' });
    const longMonth = date.toLocaleDateString('en', { month: 'long' });

    return pattern
      .replace('YYYY', year)
      .replace('YY', year.slice(-2))
      .replace('MM', month)
      .replace('M', (date.getMonth() + 1).toString())
      .replace('DD', day)
      .replace('D', date.getDate().toString())
      .replace('MMM', shortMonth)
      .replace('MMMM', longMonth);
  }

  /**
   * Create and format timestamps
   * @param type Type of timestamp: 'iso', 'numeric', 'local', or custom date/time
   * @param date Optional date string
   * @param time Optional time string
   * @returns Formatted timestamp
   */
  static createTimestamp(
    type: 'iso' | 'numeric' | 'local' = 'iso',
    date?: string,
    time?: string,
  ): string {
    const now = new Date();

    if (date || time) {
      const dateStr = date || this.formatToday('iso');
      const timeStr = time || this.timeNow();
      return `${dateStr}T${timeStr}.000Z`;
    }

    switch (type) {
      case 'iso':
        return now.toISOString();
      case 'numeric':
        return now.getTime().toString();
      case 'local':
        return now.toLocaleString();
      default:
        return now.toISOString();
    }
  }

  /**
   * Add/subtract time from date/time
   * @param date Base date/time
   * @param amount Amount to add (positive) or subtract (negative)
   * @param unit Time unit: d, w, m, y, h, min, s
   * @returns New Date object
   */
  static addToDateTime(date: Date, amount: number, unit: string): Date {
    const newDate = new Date(date);

    switch (unit) {
      case 'd':
        newDate.setDate(newDate.getDate() + amount);
        break;
      case 'w':
        newDate.setDate(newDate.getDate() + amount * 7);
        break;
      case 'm':
        newDate.setMonth(newDate.getMonth() + amount);
        break;
      case 'y':
        newDate.setFullYear(newDate.getFullYear() + amount);
        break;
      case 'h':
        newDate.setHours(newDate.getHours() + amount);
        break;
      case 'min':
        newDate.setMinutes(newDate.getMinutes() + amount);
        break;
      case 's':
        newDate.setSeconds(newDate.getSeconds() + amount);
        break;
      default:
        throw new Error(
          `Unsupported time unit: ${unit}. Use 'd', 'w', 'm', 'y' for dates or 'h', 'min', 's' for time.`,
        );
    }

    return newDate;
  }

  /**
   * Get date with offset
   * @param offset Days offset from today (0=today, 1=tomorrow, -1=yesterday)
   * @returns Date string in DD/MM/YYYY format
   */
  static getDateWithOffset(offset: number = 0): string {
    return this.formatDate(this.addToDateTime(new Date(), offset, 'd'));
  }

  /**
   * Add time to current time
   * @param amount Number to add (can be negative)
   * @param unit Time unit: 'h' (hours), 'min' (minutes), 's' (seconds)
   * @returns Time string in HH:mm:ss format
   */
  static getTimeWithOffset(amount: number, unit: string): string {
    const result = this.addToDateTime(new Date(), amount, unit);
    return this.formatTime(result);
  }

  /**
   * Add time to current timestamp
   * @param amount Number to add (can be negative)
   * @param unit Time unit: 'd', 'w', 'm', 'y', 'h', 'min', 's'
   * @returns ISO timestamp string
   */
  static getTimestampWithOffset(amount: number, unit: string): string {
    const result = this.addToDateTime(new Date(), amount, unit);
    return result.toISOString();
  }
}
