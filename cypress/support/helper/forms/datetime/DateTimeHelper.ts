import { DateTimeElement } from '../../../pageobjects/generic/datetime/DateTimeElement';
import { DateTimeUtil } from '../../../utils/DateTimeUtil';
import { TestDataGenerator } from '../../../utils/TestDataGenerator';

export class DateTimeHelper {
  /**
   * Sets a date using separate day, month, year inputs from a date string or dynamic date
   * @param fieldLabel The label/name of the date field group (used for error reporting)
   * @param dateValue The date value - supports static dates ("22/7/2024"), ISO dates with _iso suffix ("2025-07-24_iso"), and dynamic expressions ("today+7d", "yesterday", etc.)
   */
  static setDateValue(fieldLabel: string, dateValue: string): void {
    try {
      const parsedDate = TestDataGenerator.parseValue(dateValue);

      const dateParts = parsedDate.split('/');
      const day = dateParts[0];
      const month = dateParts[1];
      const year = dateParts[2];

      cy.log(
        `Setting date field "${fieldLabel}" to ${day}/${month}/${year} (from input: "${dateValue}")`,
      );

      this.setDayValue(fieldLabel, day);
      this.setMonthValue(fieldLabel, month);
      this.setYearValue(fieldLabel, year);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(
        `Failed to set date field "${fieldLabel}" with value "${dateValue}": ${errorMessage}`,
      );
    }
  }

  /**
   * Sets the day value for a date field with enhanced error handling
   * @param fieldLabel The label/name of the date field group (for context)
   * @param day The day value to set (1-31)
   */
  static setDayValue(fieldLabel: string, day: string): void {
    DateTimeElement.findDayInput(fieldLabel)
      .should('be.visible')
      .should('be.enabled')
      .clear()
      .type(day)
      .should('have.value', day);
  }

  /**
   * Sets the month value for a date field with enhanced error handling
   * @param fieldLabel The label/name of the date field group (for context)
   * @param month The month value to set (1-12)
   */
  static setMonthValue(fieldLabel: string, month: string): void {
    DateTimeElement.findMonthInput(fieldLabel)
      .should('be.visible')
      .should('be.enabled')
      .clear()
      .type(month)
      .should('have.value', month);
  }

  /**
   * Sets the year value for a date field with enhanced error handling
   * @param fieldLabel The label/name of the date field group (for context)
   * @param year The year value to set (YYYY format)
   */
  static setYearValue(fieldLabel: string, year: string): void {
    DateTimeElement.findYearInput(fieldLabel)
      .should('be.visible')
      .should('be.enabled')
      .clear()
      .type(year)
      .should('have.value', year);
  }

  static clearDateField(fieldLabel: string): void {
    DateTimeElement.findDayInput(fieldLabel)
      .should('be.visible')
      .should('be.enabled')
      .clear()
      .should('have.value', '');

    DateTimeElement.findMonthInput(fieldLabel)
      .should('be.visible')
      .should('be.enabled')
      .clear()
      .should('have.value', '');

    DateTimeElement.findYearInput(fieldLabel)
      .should('be.visible')
      .should('be.enabled')
      .clear()
      .should('have.value', '');
  }

  // === DURATION FIELD METHODS ===

  /**
   * Clears the duration field (hours and minutes) for a given field label
   * @param fieldLabel The label/name of the duration field group (for context)
   */
  static clearDurationField(fieldLabel: string): void {
    DateTimeElement.findHourInput(fieldLabel)
      .should('be.visible')
      .should('be.enabled')
      .clear()
      .should('have.value', '');

    DateTimeElement.findMinuteInput(fieldLabel)
      .should('be.visible')
      .should('be.enabled')
      .clear()
      .should('have.value', '');
  }

  // === TIME FIELD METHODS ===

  /**
   * Sets a time value - automatically detects single vs separate HH/MM inputs
   * @param fieldLabel The label/name of the time field
   * @param timeValue The time value - supports static times ("14:30") and dynamic expressions ("timenow+2h")
   */
  static setTimeValue(fieldLabel: string, timeValue: string): void {
    try {
      const parsedTime = TestDataGenerator.parseValue(timeValue);

      const timeParts = parsedTime.split(':');
      if (timeParts.length < 2) {
        throw new Error(
          `Invalid time format: ${parsedTime}. Expected HH:MM format.`,
        );
      }

      const hours = timeParts[0].padStart(2, '0');
      const minutes = timeParts[1].padStart(2, '0');

      cy.log(
        `Setting time field "${fieldLabel}" to ${hours}:${minutes} (from input: "${timeValue}")`,
      );

      // Try HH/MM inputs first, fallback to single input if not found
      try {
        // Check if separate HH/MM inputs exist
        DateTimeElement.findHourInput(fieldLabel).should('exist');
        DateTimeElement.findMinuteInput(fieldLabel).should('exist');

        // Both found - use separate methods
        this.setHourValue(fieldLabel, hours);
        this.setMinuteValue(fieldLabel, minutes);
      } catch {
        // HH/MM inputs not found - use single time input
        this.setTimeInputValue(fieldLabel, parsedTime);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(
        `Failed to set time field "${fieldLabel}" with value "${timeValue}": ${errorMessage}`,
      );
    }
  }

  /**
   * Sets the hour value for a time field with enhanced error handling
   * @param fieldLabel The label/name of the time field group (for error context)
   * @param hour The hour value to set (0-23)
   */
  static setHourValue(fieldLabel: string, hour: string): void {
    if (!hour || hour.toLowerCase() === '*skip*') {
      // Intentionally skip hour entry
      return;
    }

    DateTimeElement.findHourInput(fieldLabel)
      .should('be.visible')
      .should('be.enabled')
      .clear()
      .type(hour)
      .should(($input) => {
        const actualValue = $input.val() as string;
        // Accept either with or without leading zeros
        const normalizedActual = actualValue.replace(/^0+/, '') || '0';
        const normalizedExpected = hour.replace(/^0+/, '') || '0';
        expect(normalizedActual).to.equal(normalizedExpected);
      });
  }

  /**
   * Sets the minute value for a time field with enhanced error handling
   * @param fieldLabel The label/name of the time field group (for error context)
   * @param minute The minute value to set (0-59)
   */
  static setMinuteValue(fieldLabel: string, minute: string): void {
    if (!minute || minute.toLowerCase() === '*skip*') {
      // Intentionally skip minute entry
      return;
    }
    DateTimeElement.findMinuteInput(fieldLabel)
      .should('be.visible')
      .should('be.enabled')
      .clear()
      .type(minute)
      .should(($input) => {
        const actualValue = $input.val() as string;
        // Accept either with or without leading zeros
        const normalizedActual = actualValue.replace(/^0+/, '') || '0';
        const normalizedExpected = minute.replace(/^0+/, '') || '0';
        expect(normalizedActual).to.equal(normalizedExpected);
      });
  }

  /**
   * Sets the second value for a time field with enhanced error handling
   * @param fieldLabel The label/name of the time field group (for error context)
   * @param second The second value to set (0-59)
   */
  static setSecondValue(fieldLabel: string, second: string): void {
    DateTimeElement.findSecondInput(fieldLabel)
      .should('be.visible')
      .should('be.enabled')
      .clear()
      .type(second)
      .should(($input) => {
        const actualValue = $input.val() as string;
        // Accept either with or without leading zeros
        const normalizedActual = actualValue.replace(/^0+/, '') || '0';
        const normalizedExpected = second.replace(/^0+/, '') || '0';
        expect(normalizedActual).to.equal(normalizedExpected);
      });
  }

  /**
   * Sets the time value for a single time input field with enhanced error handling
   * @param fieldLabel The label/name of the time field (for error context)
   * @param time The time value to set in HH:MM format
   */
  static setTimeInputValue(fieldLabel: string, time: string): void {
    DateTimeElement.findTimeInput(fieldLabel)
      .should('be.visible')
      .should('be.enabled')
      .clear()
      .type(time)
      .should('have.value', time);
  }

  static clearTimeField(fieldLabel: string): void {
    // Check if separate HH/MM inputs exist, otherwise use single time input
    if (DateTimeElement.hasSeparateHourMinuteInputs(fieldLabel)) {
      // Clear both HH and MM inputs
      DateTimeElement.findHourInput(fieldLabel)
        .should('be.visible')
        .should('be.enabled')
        .clear()
        .should('have.value', '');

      DateTimeElement.findMinuteInput(fieldLabel)
        .should('be.visible')
        .should('be.enabled')
        .clear()
        .should('have.value', '');
    } else {
      // Clear single time input
      DateTimeElement.findTimeInput(fieldLabel)
        .should('be.visible')
        .should('be.enabled')
        .clear()
        .should('have.value', '');
    }
  }

  // === FIELD VISIBILITY VERIFICATION ===

  /**
   * Verifies that all date input fields are visible
   * @param fieldLabel The label/name of the date field group
   */
  static verifyDateFieldVisible(fieldLabel: string): void {
    cy.log(`Verifying date field "${fieldLabel}" is visible`);
    DateTimeElement.findDayInput(fieldLabel).should('be.visible');
    DateTimeElement.findMonthInput(fieldLabel).should('be.visible');
    DateTimeElement.findYearInput(fieldLabel).should('be.visible');
  }

  /**
   * Verifies that all date input fields are not visible
   * @param fieldLabel The label/name of the date field group
   */
  static verifyDateFieldNotVisible(fieldLabel: string): void {
    cy.log(`Verifying date field "${fieldLabel}" is not visible`);
    DateTimeElement.findDayInput(fieldLabel).should('not.be.visible');
    DateTimeElement.findMonthInput(fieldLabel).should('not.be.visible');
    DateTimeElement.findYearInput(fieldLabel).should('not.be.visible');
  }

  /**
   * Verifies that time field is visible - handles both single and separate HH/MM inputs
   * @param fieldLabel The label/name of the time field
   */
  static verifyTimeFieldVisible(fieldLabel: string): void {
    cy.log(`Verifying time field "${fieldLabel}" is visible`);

    // Check if separate HH/MM inputs exist, otherwise use single time input
    if (DateTimeElement.hasSeparateHourMinuteInputs(fieldLabel)) {
      // Both HH/MM inputs exist - verify them
      DateTimeElement.findHourInput(fieldLabel).should('be.visible');
      DateTimeElement.findMinuteInput(fieldLabel).should('be.visible');
    } else {
      // Use single time input
      DateTimeElement.findTimeInput(fieldLabel).should('be.visible');
    }
  }

  static verifyTimeFieldNotVisible(fieldLabel: string): void {
    cy.log(`Verifying time field "${fieldLabel}" is not visible`);

    // Check if separate HH/MM inputs exist, otherwise use single time input
    if (DateTimeElement.hasSeparateHourMinuteInputs(fieldLabel)) {
      // Both HH/MM inputs exist - verify them
      DateTimeElement.findHourInput(fieldLabel).should('not.be.visible');
      DateTimeElement.findMinuteInput(fieldLabel).should('not.be.visible');
    } else {
      // Use single time input
      DateTimeElement.findTimeInput(fieldLabel).should('not.be.visible');
    }
  }

  static verifyDateFieldValue(fieldLabel: string, dateValue: string): void {
    // Resolve dynamic keywords like today, today+1d, *_iso, etc.
    const resolvedDate = DateTimeUtil.parseDateValue(dateValue);

    // Validate final format (DD/MM/YYYY)
    if (!resolvedDate.includes('/')) {
      throw new Error(
        `Invalid date format: ${resolvedDate}. Expected DD/MM/YYYY format.`,
      );
    }

    // Build Date object from resolved date
    const [dayStr, monthStr, yearStr] = resolvedDate.split('/');
    const expectedDate = new Date(
      parseInt(yearStr, 10),
      parseInt(monthStr, 10) - 1,
      parseInt(dayStr, 10),
    );

    // Normalised expected values using DateTimeUtil
    const formattedExpected = DateTimeUtil.formatDate(expectedDate);
    const [expDay, expMonth, expYear] = formattedExpected.split('/');

    // Verify Day
    DateTimeElement.findDayInput(fieldLabel).should(($input) => {
      const actualValue = ($input.val() as string) || '0';
      const actualNum = parseInt(actualValue, 10) || 0;

      const normalizedActual = actualNum.toString();
      const normalizedExpected = parseInt(expDay, 10).toString();

      expect(normalizedActual).to.equal(normalizedExpected);
    });

    // Verify Month
    DateTimeElement.findMonthInput(fieldLabel).should(($input) => {
      const actualValue = ($input.val() as string) || '0';
      const actualNum = parseInt(actualValue, 10) || 0;

      const normalizedActual = actualNum.toString();
      const normalizedExpected = parseInt(expMonth, 10).toString();

      expect(normalizedActual).to.equal(normalizedExpected);
    });

    // Verify Year
    DateTimeElement.findYearInput(fieldLabel).should('have.value', expYear);
  }

  static verifyTimeFieldValue(fieldLabel: string, timeValue: string): void {
    // Resolve dynamic keywords like today, today+1d, *_iso, etc.
    const resolvedTime = DateTimeUtil.parseDateValue(timeValue);

    const timeParts = resolvedTime.split(':');
    if (timeParts.length < 2) {
      throw new Error(
        `Invalid time format: ${timeValue}. Expected HH:MM format.`,
      );
    }

    const expectedHours = timeParts[0].padStart(2, '0');
    const expectedMinutes = timeParts[1].padStart(2, '0');
    const expectedTime = `${expectedHours}:${expectedMinutes}`;

    cy.log(
      `Verifying time field "${fieldLabel}" is within ±2 minutes of ${expectedTime}`,
    );

    // Check if separate HH/MM inputs exist, otherwise use single time input
    if (DateTimeElement.hasSeparateHourMinuteInputs(fieldLabel)) {
      // Get both hour and minute values and verify with tolerance
      DateTimeElement.findHourInput(fieldLabel)
        .invoke('val')
        .then((hourVal) => {
          return DateTimeElement.findMinuteInput(fieldLabel)
            .invoke('val')
            .then((minuteVal) => {
              const actualHour = (hourVal as string) || '0';
              const actualMinute = (minuteVal as string) || '0';
              const actualTime = `${actualHour.padStart(2, '0')}:${actualMinute.padStart(2, '0')}`;

              // Use time tolerance validation (±2 minutes)
              const isWithinTolerance = DateTimeUtil.isTimeWithinTolerance(
                actualTime,
                expectedTime,
                2,
              );

              expect(
                isWithinTolerance,
                `Time field "${fieldLabel}" should be within ±2 minutes of ${expectedTime}, but found ${actualTime}`,
              ).to.equal(true);
            });
        });
    } else {
      // Verify single time input with tolerance
      DateTimeElement.findTimeInput(fieldLabel).should(($input) => {
        const timeStr = ($input.val() as string) || '';

        // Use time tolerance validation (±2 minutes)
        const isWithinTolerance = DateTimeUtil.isTimeWithinTolerance(
          timeStr,
          expectedTime,
          2,
        );

        expect(
          isWithinTolerance,
          `Time field "${fieldLabel}" should be within ±2 minutes of ${expectedTime}, but found ${timeStr}`,
        ).to.equal(true);
      });
    }
  }

  static verifyDurationFieldValuesByLabel(
    fieldLabel: string,
    hours: string,
    minutes: string,
  ): void {
    cy.log(
      `Verifying duration field "${fieldLabel}" has hours: "${hours}" and minutes: "${minutes}"`,
    );

    DateTimeElement.findDurationHourInput(fieldLabel)
      .should('be.visible')
      .should('have.value', hours);

    DateTimeElement.findDurationMinuteInput(fieldLabel)
      .should('be.visible')
      .should('have.value', minutes);
  }
  static clearDurationFieldsByLabel(
    hoursFieldLabel: string,
    minutesFieldLabel: string,
    durationFieldLabel: string,
  ): void {
    cy.log(`Clearing duration fields in "${durationFieldLabel}"`);

    DateTimeElement.findDurationHourInput(hoursFieldLabel)
      .should('be.visible')
      .should('be.enabled')
      .clear()
      .should('have.value', '');

    DateTimeElement.findDurationMinuteInput(minutesFieldLabel)
      .should('be.visible')
      .should('be.enabled')
      .clear()
      .should('have.value', '');
  }

  static setDurationFieldValuesByLabel(
    fieldLabel: string,
    hours: string,
    minutes: string,
  ): void {
    cy.log(
      `Setting duration field "${fieldLabel}" to hours: "${hours}" and minutes: "${minutes}"`,
    );

    DateTimeElement.findDurationHourInput(fieldLabel)
      .should('be.visible')
      .should('be.enabled')
      .clear()
      .type(hours)
      .should('have.value', hours);

    DateTimeElement.findDurationMinuteInput(fieldLabel)
      .should('be.visible')
      .should('be.enabled')
      .clear()
      .type(minutes)
      .should('have.value', minutes);
  }
}
