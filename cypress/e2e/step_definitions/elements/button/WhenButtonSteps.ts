/// <reference types="cypress" />

/// <reference types="cypress" />

import { When } from '@badeball/cypress-cucumber-preprocessor';

import { ButtonHelper } from '../../../../support/helper/forms/button/ButtonHelper';

When('User Clicks On The {string} Button', (buttonText: string) => {
  ButtonHelper.clickButton(buttonText);
});

When(
  'User clicks On The {string} Button In The Row With Description {string} DisplayDate {string} Time {string} Court {string} Entries {string} Status {string}',
  (
    buttonText: string,
    description: string,
    displayDate: string,
    time: string,
    court: string,
    entries: string,
    status: string,
  ) => {
    if (!description) {
      throw new Error('Description cannot be empty');
    }
    cy.get('tr').then(($rows) => {
      const matched = $rows.toArray().filter((el) => {
        const txt = (el as HTMLElement).innerText;
        return [
          description,
          displayDate,
          time,
          court,
          entries,
          status.toUpperCase(),
        ].every((v) => txt.includes(v));
      });

      if (!matched.length) {
        throw new Error('No table row found matching all provided values');
      }

      cy.wrap(matched[0]).within(() => {
        ButtonHelper.clickButton(buttonText);
      });
    });
  },
);
