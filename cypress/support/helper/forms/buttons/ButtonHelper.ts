export class ButtonHelper {
  /**
   * Clicks a button by its visible text
   * @param buttonText Visible text of the button
   */
  static clickByText(buttonText: string) {
    cy.contains('button', buttonText).click();
  }
}
