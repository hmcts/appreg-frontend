import { ModalDialogElement } from '../../../pageobjects/generic/modaldialog/ModalDialogElement';

export class ModalDialogHelper {
  static verifyModalDialogVisibleWithHeading(heading: string): void {
    ModalDialogElement.findModalDialog().should('be.visible');
    ModalDialogElement.findModalDialogHeading().should('contain.text', heading);
  }

  static verifyModalDialogNotVisible(): void {
    cy.get('dialog').should('not.be.visible');
  }

  static clickModalDialogCloseLink(): void {
    ModalDialogElement.findModalDialogCloseLink().click();
  }

  static clickModalDialogCancelButton(): void {
    ModalDialogElement.findModalDialogCancelButton().click();
  }

  static clickModalDialogConfirmButton(): void {
    ModalDialogElement.findModalDialogConfirmButton().click();
  }

  static verifyTextInModalDialog(text: string): void {
    ModalDialogElement.findModalDialogContent().should('contain.text', text);
  }

  static verifyModalDialogButtonVisible(buttonText: string): void {
    ModalDialogElement.getButtonByText(buttonText).should('be.visible');
  }
}
