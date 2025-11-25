export class ButtonElement {
  static findButton(name: string): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.contains(
      'button, input[type="button"], input[type="submit"], [role="button"]',
      name,
    );
  }

  static findButtonInTableRow(
    buttonText: string,
    rowData: { [key: string]: string },
  ): Cypress.Chainable<JQuery<HTMLElement>> {
    let rowSelector = 'tr';

    for (const value of Object.values(rowData)) {
      rowSelector += `:has(td:contains("${value}"), th:contains("${value}"), [role="cell"]:contains("${value}"))`;
    }

    return cy
      .get(rowSelector)
      .contains(
        'button, input[type="button"], input[type="submit"], [role="button"]',
        buttonText,
      );
  }
}
