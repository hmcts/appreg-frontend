export class CheckboxElement {
  static findInRowByIndex(
    rowIndex: number,
  ): Cypress.Chainable<JQuery<HTMLInputElement>> {
    return cy
      .get('tbody.govuk-table__body tr.govuk-table__row')
      .eq(rowIndex)
      .find('input[type="checkbox"].govuk-checkboxes__input');
  }
}
