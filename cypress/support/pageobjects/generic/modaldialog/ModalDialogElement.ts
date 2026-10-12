/// <reference types="cypress" />

import { StringUtils } from '../../../utils/StringUtils';

export class ModalDialogElement {
  static getButtonByText(
    buttonText: string,
  ): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy
      .get(this.modalDialogSelector)
      .find('button')
      .filter(
        (_, el) =>
          StringUtils.normalizeText(Cypress.$(el).text()) ===
          StringUtils.normalizeText(buttonText),
      )
      .first();
  }

  static findModalDialog(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get(this.modalDialogSelector);
  }

  static findModalDialogHeading(): Cypress.Chainable<JQuery<HTMLElement>> {
    return this.findModalDialog().find('#leave-page-title');
  }

  static findModalDialogCloseLink(): Cypress.Chainable<JQuery<HTMLElement>> {
    return this.findModalDialog().find('.dialog-close');
  }

  static findModalDialogCancelButton(): Cypress.Chainable<JQuery<HTMLElement>> {
    return this.getButtonByText('Stay on this page');
  }

  static findModalDialogConfirmButton(): Cypress.Chainable<
    JQuery<HTMLElement>
  > {
    return this.getButtonByText('Leave this page');
  }

  static findModalDialogContent(): Cypress.Chainable<JQuery<HTMLElement>> {
    return this.findModalDialog().find('.dialog-content');
  }

  private static readonly modalDialogSelector = 'dialog[open]';
}
