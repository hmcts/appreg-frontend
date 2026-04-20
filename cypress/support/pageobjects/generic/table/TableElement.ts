import { TableSearch } from '../../../../support/helper/table/TableSearch';
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
      .filter(
        (_, el) =>
          StringUtils.normalizeText(Cypress.$(el).text()) ===
          StringUtils.normalizeText(buttonText),
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
      .filter(
        (_, el) =>
          StringUtils.normalizeText(Cypress.$(el).text()) ===
          StringUtils.normalizeText(menuButtonText),
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
   * Gets the toggle button for the Actions menu in the table caption
   * @param tableCaption Caption of the table
   * @param toggleButtonText Text of the toggle button (e.g. "Actions")
   */
  static getCaptionMenuToggle(
    tableCaption: string,
    toggleButtonText: string,
  ): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy
      .contains('caption', tableCaption, { matchCase: false })
      .find('.moj-button-menu__toggle-button')
      .filter((_, el) =>
        StringUtils.normalizeText(Cypress.$(el).text()).includes(
          StringUtils.normalizeText(toggleButtonText),
        ),
      )
      .first();
  }

  /**
   * Gets a menu item button from the open caption Actions menu
   * @param tableCaption Caption of the table
   * @param menuItemText Text of the menu item to find (e.g. "Result selected")
   */
  static getCaptionMenuItem(
    tableCaption: string,
    menuItemText: string,
  ): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy
      .contains('caption', tableCaption, { matchCase: false })
      .find('.moj-button-menu__item')
      .filter(
        (_, el) =>
          StringUtils.normalizeText(Cypress.$(el).text()) ===
          StringUtils.normalizeText(menuItemText),
      )
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

  /**
   * Gets the currently active pagination link (aria-current="page")
   * @returns Cypress chainable of the active page anchor
   */
  static getActivePageLink(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get('a[aria-current="page"][aria-label^="Page "]');
  }

  /**
   * Gets the pagination link for a specific page number
   * @param pageNumber The 1-based page number
   * @returns Cypress chainable of the page anchor
   */
  static getPageLinkByNumber(
    pageNumber: number,
  ): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get(`a[aria-label="Page ${pageNumber}"]`);
  }

  /**
   * Gets the last page link from pagination
   * @param $body The body element to search within
   * @returns JQuery element of the last page link
   */
  static verifyButtonInTableRows(
    tableCaption: string,
    buttonText: string,
  ): Cypress.Chainable<void> {
    return this.findTable(tableCaption)
      .find('tbody tr')
      .find('td')
      .last()
      .find('button')
      .should('contain', buttonText)
      .click() as unknown as Cypress.Chainable<void>;
  }

  /**
   * Verifies that a checkbox in a table row exists and checks it.
   * The table row is searched by the given column values.
   * @param columnValues The column values to search for
   * @returns JQuery element of the checkbox
   */
  static verifyCheckboxInTableRows(
    columnValues: Record<string, string>,
  ): Cypress.Chainable<boolean> {
    return TableSearch.searchWithPagination(
      columnValues,
      undefined,
      true,
      (row: JQuery<HTMLElement>): Cypress.Chainable<void> => {
        // Ensure the callback returns a Chainable<void> to satisfy typing
        return TableElement.getCheckboxInRow(row).then((checkbox) => {
          cy.wrap(checkbox)
            .scrollIntoView()
            .should('exist')
            .and('not.be.disabled')
            .check({ force: true });
        }) as unknown as Cypress.Chainable<void>;
      },
    );
  }

  static findLinkInRowOfTable(
    linkText: string,
    tableName?: string,
    rowData: Record<string, string> = {},
  ): Cypress.Chainable {
    return TableElement.findTable(tableName)
      .contains('tr', Object.values(rowData)[0] ?? '')
      .find('a, button[role="link"]')
      .contains(linkText);
  }

  static findButtonInRowOfTable(
    text: string,
    tableName?: string,
    rowData: Record<string, string> = {},
  ): Cypress.Chainable {
    return TableElement.findTable(tableName)
      .contains('tr', Object.values(rowData)[0] ?? '')
      .find('a, button')
      .contains(text);
  }

  static getLinkInRow(
    row: JQuery<HTMLElement>,
    linkText: string,
  ): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy
      .wrap(row)
      .find('a, button[role="link"]')
      .filter((_, el) =>
        StringUtils.normalizeText(Cypress.$(el).text()).includes(
          StringUtils.normalizeText(linkText),
        ),
      )
      .first();
  }

  static verifyLinkInTableRows(
    columnValues: Record<string, string>,
    linkText: string,
  ): Cypress.Chainable<boolean> {
    return TableSearch.searchWithPagination(
      columnValues,
      undefined,
      true,
      (row: JQuery<HTMLElement>): Cypress.Chainable<void> => {
        return TableElement.getLinkInRow(row, linkText).should(
          'exist',
        ) as unknown as Cypress.Chainable<void>;
      },
    );
  }

  static verifyLinkIsNotVisibleInTableRows(
    columnValues: Record<string, string>,
    linkText: string,
  ): void {
    TableSearch.searchWithPagination(
      columnValues,
      undefined,
      true,
      (row: JQuery<HTMLElement>): Cypress.Chainable<void> => {
        return TableElement.getLinkInRow(row, linkText).should(
          'not.exist',
        ) as unknown as Cypress.Chainable<void>;
      },
    );
  }
}
