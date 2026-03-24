import { AccordionButtonElement } from '../../../../pageobjects/generic/accordion/accordionButton/AccordionButtonElement';
import { AccordionHelper } from '../accordion/AccordionHelper';

export class AccordionButtonHelper {
  /**
   * Clicks a button within an accordion
   * @param accordionTitle - Title of the accordion section
   * @param buttonText - Text of the button to click
   */
  static clickButtonInAccordion(
    accordionTitle: string,
    buttonText: string,
  ): void {
    AccordionHelper.ensureAccordionExpanded(accordionTitle);

    cy.log(
      `Clicking button: "${buttonText}" within accordion: "${accordionTitle}"`,
    );

    AccordionButtonElement.findButtonInAccordion(
      accordionTitle,
      buttonText,
    ).click();
  }

  /**
   * Verify a button is visible within an accordion
   */
  static verifyButtonVisible(accordionTitle: string, buttonText: string): void {
    AccordionHelper.ensureAccordionExpanded(accordionTitle);

    AccordionButtonElement.findButtonInAccordion(
      accordionTitle,
      buttonText,
    ).should('be.visible');
  }
}
