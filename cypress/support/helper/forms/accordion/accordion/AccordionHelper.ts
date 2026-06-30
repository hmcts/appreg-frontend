/// <reference types="cypress" />

import { AccordionElement } from '../../../../pageobjects/generic/accordion/accordion/AccordionElement';
import { StringUtils } from '../../../../utils/StringUtils';

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
    AccordionElement.getAccordionContent(accordionTitle).should('be.visible');
  }

  static ensureAccordionCollapsed(accordionTitle: string): void {
    this.isAccordionExpanded(accordionTitle).then((isExpanded) => {
      if (isExpanded) {
        this.toggleAccordion(accordionTitle);
      }
    });
  }

  static verifyAccordionExpanded(accordionTitle: string): void {
    this.isAccordionExpanded(accordionTitle).should('eq', true);
  }

  static verifyAccordionCollapsed(accordionTitle: string): void {
    this.isAccordionExpanded(accordionTitle).should('eq', false);
  }

  static verifyAccordionContainsText(
    accordionTitle: string,
    expectedText: string,
  ): void {
    this.verifyAccordionContainsTexts(accordionTitle, [expectedText]);
  }

  static verifyAccordionContainsTexts(
    accordionTitle: string,
    expectedTexts: string[],
  ): void {
    this.verifyAccordionExpanded(accordionTitle);
    AccordionElement.getAccordionContent(accordionTitle)
      .should('be.visible')
      .invoke('text')
      .then((text) => {
        const normalizedText = StringUtils.normalizeText(text);

        expectedTexts.forEach((expectedText) => {
          expect(normalizedText).to.include(
            StringUtils.normalizeText(expectedText),
          );
        });
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
