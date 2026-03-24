import { AccordionDateElement } from '../../../../pageobjects/generic/accordion/accordionDate/AccordionDateElement';
import { TestDataGenerator } from '../../../../utils/TestDataGenerator';
import { AccordionHelper } from '../accordion/AccordionHelper';

export class AccordionDateTimeHelper {
  static setDateInAccordion(
    accordionTitle: string,
    dateFieldLabel: string,
    dateValue: string,
  ): void {
    AccordionHelper.isAccordionVisible(accordionTitle);
    AccordionHelper.ensureAccordionExpanded(accordionTitle);

    try {
      const parsedDate = TestDataGenerator.parseValue(dateValue);
      const dateParts = parsedDate.split('/');
      const day = dateParts[0];
      const month = dateParts[1];
      const year = dateParts[2];

      cy.log(
        `Setting date in accordion "${accordionTitle}" to ${day}/${month}/${year}`,
      );

      this.setDayInAccordion(accordionTitle, day);
      this.setMonthInAccordion(accordionTitle, month);
      this.setYearInAccordion(accordionTitle, year);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(
        `Failed to set date in accordion "${accordionTitle}" with value "${dateValue}": ${errorMessage}`,
      );
    }
  }

  static setDayInAccordion(accordionTitle: string, day: string): void {
    AccordionDateElement.findDayInputInAccordion(accordionTitle)
      .should('be.visible')
      .should('be.enabled')
      .clear()
      .type(day)
      .should('have.value', day);
  }

  static setMonthInAccordion(accordionTitle: string, month: string): void {
    AccordionDateElement.findMonthInputInAccordion(accordionTitle)
      .should('be.visible')
      .should('be.enabled')
      .clear()
      .type(month)
      .should('have.value', month);
  }

  static setYearInAccordion(accordionTitle: string, year: string): void {
    AccordionDateElement.findYearInputInAccordion(accordionTitle)
      .should('be.visible')
      .should('be.enabled')
      .clear()
      .type(year)
      .should('have.value', year);
  }

  static verifyDateInAccordion(
    accordionTitle: string,
    dateFieldLabel: string,
    expectedDate: string,
  ): void {
    AccordionHelper.ensureAccordionExpanded(accordionTitle);

    const parsedDate = TestDataGenerator.parseValue(expectedDate);
    const dateParts = parsedDate.split('/');
    const day = dateParts[0];
    const month = dateParts[1];
    const year = dateParts[2];

    AccordionDateElement.findDayInputInAccordion(accordionTitle).should(
      'have.value',
      day,
    );

    AccordionDateElement.findMonthInputInAccordion(accordionTitle).should(
      'have.value',
      month,
    );

    AccordionDateElement.findYearInputInAccordion(accordionTitle).should(
      'have.value',
      year,
    );
  }
}
