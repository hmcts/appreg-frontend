import { Then } from '@badeball/cypress-cucumber-preprocessor';

import { ButtonHelper } from '../../../../support/helper/forms/button/ButtonHelper';

Then('User Should See The Button {string}', (buttonText: string) => {
  ButtonHelper.isButtonVisible(buttonText);
});

Then('User Should Not See The Button {string}', (buttonText: string) => {
  ButtonHelper.isButtonNotVisible(buttonText);
});

Then(
  'User Should Not See The Button {string} In The Page Header',
  (buttonText: string) => {
    cy.get('.moj-page-header-actions')
      .contains('button.moj-button-menu__toggle-button', buttonText)
      .should('not.exist');
  },
);

Then('User Should See The Button {string} Is Enabled', (buttonText: string) => {
  ButtonHelper.isButtonEnabled(buttonText);
});

Then(
  'User Should See The Button {string} Is Disabled',
  (buttonText: string) => {
    ButtonHelper.isButtonDisabled(buttonText);
  },
);
