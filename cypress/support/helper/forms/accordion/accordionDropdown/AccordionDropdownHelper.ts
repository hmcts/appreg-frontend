import { AccordionDropdownElement } from '../../../../pageobjects/generic/accordion/accordionDropdown/AccordionDropdownElement';
import { AccordionHelper } from '../accordion/AccordionHelper';

export class AccordionDropdownHelper {
  /**
   * Select an option from a dropdown within a specific accordion
   */
  static selectDropdownInAccordion(
    accordionTitle: string,
    dropdownLabel: string,
    optionText: string,
  ): void {
    AccordionHelper.isAccordionVisible(accordionTitle);
    AccordionHelper.ensureAccordionExpanded(accordionTitle);
    AccordionDropdownElement.findDropdownInAccordion(
      accordionTitle,
      dropdownLabel,
    ).then(($dropdown) => {
      cy.wrap($dropdown)
        .find('option')
        .then(($options) => {
          const match = [...$options].find(
            (o) =>
              o.textContent?.trim().toLowerCase() === optionText.toLowerCase(),
          );

          if (!match) {
            throw new Error(
              `Option "${optionText}" not found in dropdown "${dropdownLabel}" within accordion "${accordionTitle}"`,
            );
          }

          cy.wrap($dropdown).select(match.value);
        });
    });
  }

  /**
   * Verify selected value in a dropdown within an accordion
   */
  static verifyDropdownValue(
    accordionTitle: string,
    dropdownLabel: string,
    expectedValue: string,
  ): void {
    AccordionHelper.ensureAccordionExpanded(accordionTitle);
    AccordionDropdownElement.findDropdownInAccordion(
      accordionTitle,
      dropdownLabel,
    )
      .find('option:selected')
      .should('contain.text', expectedValue);
  }

  /**
   * Verify selected value in a dropdown within an accordion
   */
  static verifyDropdownDisabled(
    accordionTitle: string,
    dropdownLabel: string,
  ): void {
    AccordionHelper.ensureAccordionExpanded(accordionTitle);
    AccordionDropdownElement.findDropdownInAccordion(
      accordionTitle,
      dropdownLabel,
    ).should('be.disabled');
  }
}
