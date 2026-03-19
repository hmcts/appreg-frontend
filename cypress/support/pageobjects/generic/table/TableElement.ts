import { StringUtils } from '../../../utils/StringUtils';

export class TableElement {
  /**
   * Finds a table by its caption text or returns the first table if no caption provided
   * @param caption Optional caption text of the table
   */
  static findTable(
    caption?: string,
  ): Cypress.Chainable<JQuery<HTMLTableElement>> {
    if (caption) {
      return cy
        .contains('caption', caption, { matchCase: false })
        .parent('table');
    }
    return cy.get('table').first();
  }

  /**
   * @deprecated Use findTable() instead
   */
  static findTableByCaption(
    caption: string,
  ): Cypress.Chainable<JQuery<HTMLTableElement>> {
    return this.findTable(caption);
  }

  /**
   * Gets table headers from a table
   * @param tableCaption Optional caption text of the table. If not provided, uses first table.
   */
  static getTableHeaders(
    tableCaption?: string,
  ): Cypress.Chainable<JQuery<HTMLElement>> {
    return this.findTable(tableCaption).find('thead th');
  }

  /**
   * Gets all rows from table body
   * @param tableCaption Optional caption text of the table. If not provided, uses first table.
   */
  static getTableRows(
    tableCaption?: string,
  ): Cypress.Chainable<JQuery<HTMLTableRowElement>> {
    return this.findTable(tableCaption).find('tbody tr');
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
      .filter((_, el) => 
        StringUtils.normalizeText(Cypress.$(el).text()) === StringUtils.normalizeText(buttonText)
      )
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
      .filter((_, el) => 
        StringUtils.normalizeText(Cypress.$(el).text()) === StringUtils.normalizeText(menuButtonText)
      )
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

  static getCheckboxInRow(
    row: JQuery<HTMLElement>,
  ): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.wrap(row).find('td').first().find('input[type="checkbox"]');
  }

  /**
   * Gets the "Select all" checkbox in the table header
   * @param tableCaption Optional caption of the table. If not provided, uses first table.
   */
  static getSelectAllCheckbox(
    tableCaption?: string,
  ): Cypress.Chainable<JQuery<HTMLElement>> {
    return this.findTable(tableCaption)
      .find('thead')
      .find('input[type="checkbox"]')
      .first();
  }

  /**
   * Gets the first page link (Page 1) from pagination
   * @param $body The body element to search within
   * @returns JQuery element of the first page link
   */
  static getFirstPageLink($body: JQuery<HTMLElement>): JQuery<HTMLElement> {
    return $body.find('a[aria-label="Page 1"]');
  }

  /**
   * Gets the pagination container
   * @param $body The body element to search within
   * @returns JQuery element of the pagination container
   */
  static getPaginationContainer(
    $body: JQuery<HTMLElement>,
  ): JQuery<HTMLElement> {
    // Try multiple selectors to be framework-agnostic
    let $pagination = $body.find(
      'nav[role="navigation"][aria-label*="agination"]',
    );
    if ($pagination.length === 0) {
      $pagination = $body.find('.pagination, [class*="pagination"]');
    }
    return $pagination;
  }

  /**
   * Gets all page links from pagination
   * @param $body The body element to search within
   * @returns JQuery element of all page links
   */
  static getPageLinks($body: JQuery<HTMLElement>): JQuery<HTMLElement> {
    const $pagination = this.getPaginationContainer($body);
    if ($pagination.length === 0) {
      return Cypress.$();
    }
    return $pagination.find('a[aria-label^="Page "]');
  }

  /**
   * Gets the current page number from pagination
   * @param $body The body element to search within
   * @returns The current page number, or 1 if not found
   */
  static getCurrentPageNumber($body: JQuery<HTMLElement>): number {
    const $currentPage = $body.find(
      'a[aria-current="page"][aria-label^="Page "]',
    );
    if ($currentPage.length > 0) {
      const ariaLabel = $currentPage.attr('aria-label') || '';
      const match = ariaLabel.match(/Page (\d+)/);
      if (match) {
        return parseInt(match[1], 10);
      }
    }
    return 1;
  }
}
