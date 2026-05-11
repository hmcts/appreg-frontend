/// <reference types="cypress" />
import { When } from '@badeball/cypress-cucumber-preprocessor';

When('User Uploads The File {string}', (fileName: string) => {
  cy.get('input[type="file"]').selectFile(`cypress/fixtures/${fileName}`, {
    force: true,
  });
  cy.screenshot(`uploaded-file-${fileName}`);
});
