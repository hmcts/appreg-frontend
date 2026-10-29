import { Then, When } from '@badeball/cypress-cucumber-preprocessor';

const reportGenerationAlias = 'reportGenerationRequests';

When('User Starts Monitoring Report Generation Requests', () => {
  cy.intercept('POST', '**/reports/*/jobs').as(reportGenerationAlias);
});

Then('No Report Generation Request Is Made', () => {
  cy.get(`@${reportGenerationAlias}.all`).should('have.length', 0);
});
