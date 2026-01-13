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

  /**
   * Gets a button in a table row by its text
   * @param row The table row element
   * @param buttonText The text of the button to find
   */
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

  /**
   * Gets a menu button in a table row by its text
   * @param row The table row element
   * @param menuButtonText The text of the menu button to find
   */
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

  /**
   * Gets the next pagination button if it exists
   * @param $body The body element to search within
   * @returns JQuery element of the next button, or empty if not found
   */
  static getNextPaginationButton(
    $body: JQuery<HTMLElement>,
  ): JQuery<HTMLElement> {
    let $nextButton = $body.find('a[rel="next"]');
    if ($nextButton.length === 0) {
      $nextButton = $body.find('a:contains("Next")');
    }
    if ($nextButton.length === 0) {
      $nextButton = $body.find('button:contains("Next")');
    }
    return $nextButton;
  }

  /**
   * Gets the enabled next pagination button (filters out disabled buttons)
   * @param $body The body element to search within
   * @returns JQuery element of the enabled next button
   */
  static getEnabledNextPaginationButton(
    $body: JQuery<HTMLElement>,
  ): JQuery<HTMLElement> {
    const $nextButton = this.getNextPaginationButton($body);
    return $nextButton.filter((_, el) => {
      const $el = Cypress.$(el);
      return (
        !$el.hasClass('disabled') &&
        !$el.attr('disabled') &&
        !$el.parent().hasClass('disabled')
      );
    });
  }
}
