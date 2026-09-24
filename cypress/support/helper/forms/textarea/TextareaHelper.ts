import { TextareaElement } from '../../../pageobjects/textarea/TextareaElement';

export class TextareaHelper {
  static clearTextarea(selector: string): void {
    TextareaElement.findTextarea(selector)
      .should('be.visible')
      .should('be.enabled')
      .scrollIntoView()
      .clear();
  }

  static typeInTextarea(selector: string, value: string): void {
    TextareaElement.findTextarea(selector)
      .should('be.visible')
      .should('be.enabled')
      .scrollIntoView()
      .clear()
      .type(value, { delay: 0 });
  }

  static verifyTextareaIsVisible(selector: string): void {
    TextareaElement.findTextarea(selector)
      .should('be.visible')
      .scrollIntoView();
  }

  static verifyValueInTextarea(selector: string, expectedValue: string): void {
    TextareaElement.findTextarea(selector)
      .should('be.visible')
      .scrollIntoView()
      .invoke('val')
      .then((actualValue) => {
        const normalizedActualValue = actualValue
          ? actualValue.toString().trim()
          : '';
        const normalizedExpectedValue = expectedValue.trim();
        expect(normalizedActualValue).to.equal(normalizedExpectedValue);
      });
  }
}
