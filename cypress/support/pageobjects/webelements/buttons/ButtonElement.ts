
export class ButtonElement {

  static findButton(name: string) {
    return cy.contains('button, input[type="button"], input[type="submit"], [role="button"]', name);
  }

}
