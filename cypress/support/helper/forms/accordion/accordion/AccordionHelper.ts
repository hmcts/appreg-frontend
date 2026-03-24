import { AccordionElement } from '../../../../pageobjects/generic/accordion/accordion/AccordionElement';

export class AccordionHelper {
  static isAccordionVisible(
    accordionTitle: string,
  ): Cypress.Chainable<JQuery<HTMLElement>> {
    return AccordionElement.findAccordionSection(accordionTitle).should(
      'be.visible',
    );
  }

  static isAccordionExpanded(
    accordionTitle: string,
  ): Cypress.Chainable<boolean> {
    return AccordionElement.findAccordionSection(accordionTitle).then(
      ($section) => {
        if ($section.is('details')) {
          return cy.wrap($section.prop('open') === true);
        }
        return AccordionElement.findAccordionButton(accordionTitle)
          .invoke('attr', 'aria-expanded')
          .then((expanded) => expanded === 'true');
      },
    );
  }

  static toggleAccordion(accordionTitle: string): void {
    AccordionElement.findAccordionButton(accordionTitle).click();
  }

  static ensureAccordionExpanded(accordionTitle: string): void {
    this.isAccordionExpanded(accordionTitle).then((isExpanded) => {
      if (!isExpanded) {
        this.toggleAccordion(accordionTitle);
      }
    });
  }

  static ensureAccordionCollapsed(accordionTitle: string): void {
    this.isAccordionExpanded(accordionTitle).then((isExpanded) => {
      if (isExpanded) {
        this.toggleAccordion(accordionTitle);
      }
    });
  }

  /**
   * Generic method to verify the value of an accordion by its title
   */
  static verifyAccordionValue(
    accordionTitle: string,
    expectedValue: string,
  ): void {
    AccordionElement.getAccordionContent(accordionTitle).contains(
      expectedValue,
    );
  }

  /**
   * Generic method to verify the value of an accordion by its title
   */
  static verifyAccordionTextboxPlaceholder(
    accordionTitle: string,
    placeholder: string,
    value: string,
  ): void {
    AccordionElement.getAccordionContent(accordionTitle)
      .find('input')
      .should('have.attr', 'placeholder', placeholder)
      .type(value);
  }

  static scrollIntoViewAccordion(accordionTitle: string): void {
    AccordionElement.findAccordion(accordionTitle).scrollIntoView();
  }
}
