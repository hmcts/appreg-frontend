import { AlertElement } from '../../../pageobjects/generic/alert/AlertElement';

export class AlertHelper {
  static verifyAlertExists(alertText: string): void {
    AlertElement.findAlert(alertText).should('exist');
  }

  static verifyAlertNotExists(alertText: string): void {
    AlertElement.findAlert(alertText).should('not.exist');
  }

  static verifyAlertVisible(alertText: string): void {
    AlertElement.findAlert(alertText).should('be.visible');
  }

  static verifyWarningAlertVisible(alertText: string): void {
    AlertElement.findWarningAlert(alertText).should('be.visible');
  }

  static verifyErrorAlertVisible(alertText: string): void {
    AlertElement.findErrorAlert(alertText).should('be.visible');
  }

  static verifySuccessAlertVisible(alertText: string): void {
    AlertElement.findSuccessAlert(alertText).should('be.visible');
  }

  static verifyInfoAlertVisible(alertText: string): void {
    AlertElement.findInfoAlert(alertText).should('be.visible');
  }

  static verifyAlertNotVisible(alertText: string): void {
    AlertElement.findAlert(alertText).should('not.be.visible');
  }

  static clickAlert(alertText: string): void {
    AlertElement.findAlert(alertText).click();
  }
  static verifyAlertContainsText(alertText: string): void {
    AlertElement.findAlert(alertText).should('contain.text', alertText);
  }
}
