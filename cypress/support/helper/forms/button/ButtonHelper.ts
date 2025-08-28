export class ButtonHelper {
  /**
   * Clicks a button by its visible text
   * @param buttonText Visible text of the button
   */
  static clickButtonByText(buttonText: string) {
    cy.contains('button', buttonText).click();
  }
}
