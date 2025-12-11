/// <reference types="cypress" />

const DATETIME_PATTERNS = {
  // Date fields - simple label-based
  day: { label: 'Day' },
  month: { label: 'Month' },
  year: { label: 'Year' },
  time: { label: 'Time' },

  // Time component fields - multiple strategies
  hour: { label: 'HH', semantic: 'hour', suffix: 'HH' },
  minute: { label: 'MM', semantic: 'minute', suffix: 'MM' },
  second: { label: 'SS', semantic: 'second', suffix: 'SS' },
} as const;

export class DateTimeElement {
  private static findInputByLabel(
    labelText: string,
    withinFieldLabel?: string,
  ): Cypress.Chainable {
    if (withinFieldLabel) {
      return cy
        .contains('label, legend', withinFieldLabel, { matchCase: false })
        .parent()
        .find('label')
        .contains(labelText, { matchCase: false })
        .then(($label) => this.getInputFromLabel($label));
    } else {
      // Global search
      return cy
        .contains('label', labelText, { matchCase: false })
        .then(($label) => this.getInputFromLabel($label));
    }
  }

  private static getInputFromLabel($label: JQuery): Cypress.Chainable {
    const forId = $label.attr('for');
    if (forId) {
      return cy.get(`#${forId}`);
    }
    // Label wrapping input or sibling input
    const nestedInput = $label.find('input');
    return nestedInput.length
      ? cy.wrap(nestedInput.first())
      : cy.wrap($label).siblings('input').first();
  }

  /* ---- Date parts ---- */
  static findDayInput(fieldLabel: string): Cypress.Chainable {
    return this.findInputByLabel(
      DATETIME_PATTERNS.day.label,
      fieldLabel,
    ).should('exist');
  }

  static findMonthInput(fieldLabel: string): Cypress.Chainable {
    return this.findInputByLabel(
      DATETIME_PATTERNS.month.label,
      fieldLabel,
    ).should('exist');
  }

  static findYearInput(fieldLabel: string): Cypress.Chainable {
    return this.findInputByLabel(
      DATETIME_PATTERNS.year.label,
      fieldLabel,
    ).should('exist');
  }

  /* ---- Time (single input) ---- */
  static findTimeInput(fieldLabel?: string): Cypress.Chainable {
    return this.findInputByLabel(
      DATETIME_PATTERNS.time.label,
      fieldLabel,
    ).should('exist');
  }

  /* ---- Time (HH/MM/SS split) ---- */
  private static findTimeComponentInput(
    timeKey: 'hour' | 'minute' | 'second',
    fieldLabel?: string,
  ): Cypress.Chainable {
    const pattern = DATETIME_PATTERNS[timeKey];

    if (fieldLabel) {
      return cy
        .contains('label, legend', fieldLabel, { matchCase: false })
        .parent()
        .find(
          `input[id*="${pattern.semantic}"], input[name*="${pattern.semantic}"]`,
        )
        .first()
        .then(($input) => {
          if ($input.length) {
            return cy.wrap($input);
          }
          // Fallback to label-based search within field
          return this.findInputByLabel(pattern.label, fieldLabel);
        });
    } else {
      return cy
        .get(
          `input[id*="${pattern.semantic}"], input[name*="${pattern.semantic}"]`,
        )
        .first()
        .then(($input) => {
          if ($input.length) {
            return cy.wrap($input);
          }
          // Fallback to label-based search globally
          return this.findInputByLabel(pattern.label);
        });
    }
  }

  static findHourInput(fieldLabel: string): Cypress.Chainable {
    return this.findTimeComponentInput('hour', fieldLabel);
  }

  static findMinuteInput(fieldLabel: string): Cypress.Chainable {
    return this.findTimeComponentInput('minute', fieldLabel);
  }

  static findSecondInput(fieldLabel: string): Cypress.Chainable {
    return this.findTimeComponentInput('second', fieldLabel);
  }

  /* ---- Helper methods ---- */
  /**
   * Checks if separate hour/minute inputs exist for the given field
   * @param fieldLabel The label/name of the time field
   * @returns true if both hour and minute inputs exist, false otherwise
   */
  static hasSeparateHourMinuteInputs(fieldLabel: string): boolean {
    try {
      this.findTimeComponentInput('hour', fieldLabel);
      this.findTimeComponentInput('minute', fieldLabel);
      return true;
    } catch {
      return false;
    }
  }

  static findDurationHourInput(fieldLabel: string): Cypress.Chainable {
    return this.findHourInput(fieldLabel);
  }

  static findDurationMinuteInput(fieldLabel: string): Cypress.Chainable {
    return this.findMinuteInput(fieldLabel);
  }
   

  static findDurationInputByLabel(fieldLabel: string): Cypress.Chainable[] {
    return [
      this.findDurationHourInput(fieldLabel),
      this.findDurationMinuteInput(fieldLabel)
    ];
  }
}
