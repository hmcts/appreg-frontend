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
  static clickButtonInRow(row: JQuery<HTMLElement>, buttonText: string): void {
    cy.wrap(row)
      .find('td')
      .last()
      .within(() => {
        cy.contains('button', buttonText).click();
      });
  }

  static clickMenuButtonInRow(row: JQuery<HTMLElement>, menuButtonText: string): void {
    cy.wrap(row)
      .find('td')
      .last()
      .within(() => {
        cy.get('ul[role="list"], ul[role="menu"], .dropdown-menu, .actions-menu').should('be.visible')
          .contains('button, a', menuButtonText)
          .should('be.visible')
          .click();
      });
  }
}
