/// <reference types="cypress" />

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
}
