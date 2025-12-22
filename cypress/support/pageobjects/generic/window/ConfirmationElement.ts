export class ConfirmationElement {
  static findConfirmation(handler: (text: string) => boolean): void {
    cy.once('window:confirm', handler);
  }
}
