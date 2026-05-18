import { RadioElement } from '../../../pageobjects/generic/radio/radioElement';

export class RadioHelper {
  static select(labelText: string): Cypress.Chainable<JQuery<HTMLInputElement>> {
    return RadioElement.findRadio(labelText).check({ force: true });
  }

  static verifySelected(labelText: string): void {
    RadioElement.findRadio(labelText).should('be.checked');
  }

  static verifyNotSelected(labelText: string): void {
    RadioElement.findRadio(labelText).should('not.be.checked');
  }
}
