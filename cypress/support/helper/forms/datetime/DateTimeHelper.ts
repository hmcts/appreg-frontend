import { DateTimeElement } from '../../../pageobjects/generic/datetime/DateTimeElement';
import { DateTimeUtil } from '../../../utils/DateTimeUtil';

export class DateTimeHelper {
  /**
   * Sets a date using separate day, month, year inputs from a date string or dynamic date
   * @param fieldLabel The label/name of the date field group (used for error reporting)
   * @param dateValue The date value - supports static dates ("22/7/2024") and dynamic expressions ("today+7d", "yesterday", etc.)
   */
  static setDateValue(fieldLabel: string, dateValue: string): void {
    try {
      const parsedDate = DateTimeUtil.parseDateValue(dateValue);
      
      const dateParts = parsedDate.split('/');
      const day = dateParts[0];
      const month = dateParts[1];
      const year = dateParts[2];
      
      cy.log(`Setting date field "${fieldLabel}" to ${day}/${month}/${year} (from input: "${dateValue}")`);
      
      this.setDayValue(fieldLabel, day);
      this.setMonthValue(fieldLabel, month);
      this.setYearValue(fieldLabel, year);
      
    } catch (error) {
      throw new Error(`Failed to set date field "${fieldLabel}" with value "${dateValue}": ${error.message}`);
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

  // === TIME FIELD METHODS ===

  /**
   * Sets a time value - automatically detects single vs separate HH/MM inputs
   * @param fieldLabel The label/name of the time field
   * @param timeValue The time value - supports static times ("14:30") and dynamic expressions ("timenow+2h")
   */
  static setTimeValue(fieldLabel: string, timeValue: string): void {
    try {
      const parsedTime = DateTimeUtil.parseDateValue(timeValue);
      
      // Validate the parsed time format
      const timeParts = parsedTime.split(':');
      if (timeParts.length < 2) {
        throw new Error(`Invalid time format: ${parsedTime}. Expected HH:MM format.`);
      }
      
      const hours = timeParts[0].padStart(2, '0');
      const minutes = timeParts[1].padStart(2, '0');
      
      cy.log(`Setting time field "${fieldLabel}" to ${hours}:${minutes} (from input: "${timeValue}")`);
      
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
      throw new Error(`Failed to set time field "${fieldLabel}" with value "${timeValue}": ${error.message}`);
    }
  }

  /**
   * Sets the hour value for a time field with enhanced error handling
   * @param fieldLabel The label/name of the time field group (for error context)
   * @param hour The hour value to set (0-23)
   */
  static setHourValue(fieldLabel: string, hour: string): void {
    DateTimeElement.findHourInput(fieldLabel)
      .should('be.visible')
      .should('be.enabled')
      .clear()
      .type(hour)
      .should('have.value', hour);
  }

  /**
   * Sets the minute value for a time field with enhanced error handling
   * @param fieldLabel The label/name of the time field group (for error context)
   * @param minute The minute value to set (0-59)
   */
  static setMinuteValue(fieldLabel: string, minute: string): void {
    DateTimeElement.findMinuteInput(fieldLabel)
      .should('be.visible')
      .should('be.enabled')
      .clear()
      .type(minute)
      .should('have.value', minute);
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

  /**
   * Verifies that time field is not visible - handles both single and separate HH/MM inputs
   * @param fieldLabel The label/name of the time field
   */
  static verifyTimeFieldNotVisible(fieldLabel: string): void {
    cy.log(`Verifying time field "${fieldLabel}" is not visible`);
    
    // Check if separate HH/MM inputs exist, otherwise use single time input
    if (DateTimeElement.hasSeparateHourMinuteInputs(fieldLabel)) {
      // Both HH/MM inputs exist - verify they are not visible
      DateTimeElement.findHourInput(fieldLabel).should('not.be.visible');
      DateTimeElement.findMinuteInput(fieldLabel).should('not.be.visible');
    } else {
      // Use single time input
      DateTimeElement.findTimeInput(fieldLabel).should('not.be.visible');
    }
  }
}
