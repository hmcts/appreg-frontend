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
    AccordionElement.findAccordionButton(accordionTitle).then(($button) => {
      const button = $button.get(0);

      if (!button) {
        throw new Error(`Accordion "${accordionTitle}" button not found`);
      }

      button.scrollIntoView();
      button.click();
    });
  }

  static ensureAccordionExpanded(accordionTitle: string): void {
    AccordionElement.findAccordionSection(accordionTitle).then(($section) => {
      if ($section.is('details')) {
        if (!$section.prop('open')) {
          const summary = $section.find('.govuk-details__summary').get(0);

          if (!summary) {
            throw new Error(`Accordion "${accordionTitle}" summary not found`);
          }

          summary.scrollIntoView();
          summary.click();
        }

        return AccordionElement.findAccordionSection(accordionTitle)
          .should(($details) => {
            expect($details.prop('open')).to.eq(true);
          })
          .then(($details) => {
            return cy
              .wrap($details.find('.govuk-details__text').first())
              .should('be.visible');
          });
      }

      const button = $section.find('.govuk-accordion__section-button').get(0);

      if (!button) {
        throw new Error(`Accordion "${accordionTitle}" button not found`);
      }

      if (button.getAttribute('aria-expanded') !== 'true') {
        button.scrollIntoView();
        button.click();
      }

      return AccordionElement.getAccordionContent(accordionTitle).should(
        'be.visible',
      );
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
   * Ensures the accordion is expanded then runs the provided function scoped
   * inside the accordion content via cy.within()
   */
  static within(accordionTitle: string, fn: () => void): void {
    this.ensureAccordionExpanded(accordionTitle);
    AccordionElement.getAccordionContent(accordionTitle).within(fn);
  }
}
