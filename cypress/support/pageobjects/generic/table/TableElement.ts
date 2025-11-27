export class TableElement {
  /**
   * Finds a table by its caption text
   * @param caption The caption text of the table
   */
  static findTableByCaption(caption: string): Cypress.Chainable {
    return cy
      .contains('caption', caption, { matchCase: false })
      .parent('table');
  }

  /**
   * Gets table headers from a table
   * @param tableCaption The caption text of the table
   */
  static getTableHeaders(tableCaption: string): Cypress.Chainable {
    return this.findTableByCaption(tableCaption).find('thead th');
  }

  /**
   * Gets all rows from table body
   * @param tableCaption The caption text of the table
   */
  static getTableRows(tableCaption: string): Cypress.Chainable {
    return this.findTableByCaption(tableCaption).find('tbody tr');
  }
  static getButtonInRow(
    row: JQuery<HTMLElement>,
    buttonText: string,
  ): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy
      .wrap(row)
      .find('td')
      .last()
      .find('button')
      .filter((_, el) => Cypress.$(el).text().trim() === buttonText)
      .first();
  }

  static getMenuButtonInRow(
    row: JQuery<HTMLElement>,
    menuButtonText: string,
  ): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy
      .wrap(row)
      .find('td')
      .last()
      .find('ul[role="list"], ul[role="menu"], .dropdown-menu, .actions-menu')
      .should('be.visible')
      .find('button, a')
      .filter((_, el) => Cypress.$(el).text().trim() === menuButtonText)
      .first();
  }
}
