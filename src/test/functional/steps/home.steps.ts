<<<<<<< HEAD
import { Given, Then, When } from "@badeball/cypress-cucumber-preprocessor";

Given("the app is running at {string}", (url: string) => {
  const base =
    url === "<BASE_URL>"
      ? (Cypress.env("BASE_URL") as string) || Cypress.config("baseUrl")
      : url;
  cy.wrap(base).as("baseUrl");
});

When("I visit the {string} route", (route: string) => {
  cy.get<string>("@baseUrl").then((base) => {
=======
import { Given, Then, When } from '@badeball/cypress-cucumber-preprocessor';

Given('the app is running at {string}', (url: string) => {
  const base =
    url === '<BASE_URL>'
      ? (Cypress.env('BASE_URL') as string) || Cypress.config('baseUrl')
      : url;
  cy.wrap(base).as('baseUrl');
});

When('I visit the {string} route', (route: string) => {
  cy.get<string>('@baseUrl').then((base) => {
>>>>>>> 38048e2 (Rebasing Code)
    cy.visit(`${base}${route}`);
  });
});

<<<<<<< HEAD
Then("I should see the {string} heading", (heading: string) => {
  cy.get("#main-content h1").should("contain.text", heading);
});

Then("I should see the {string} element", (selector: string) => {
  cy.get(selector).should("exist");
});

Then("I should see the header and footer components", () => {
  cy.get("app-header").should("exist");
  cy.get("app-footer").should("exist");
=======
Then('I should see the {string} heading', (heading: string) => {
  cy.get('#main-content h1').should('contain.text', heading);
});

Then('I should see the {string} element', (selector: string) => {
  cy.get(selector).should('exist');
});

Then('I should see the header and footer components', () => {
  cy.get('app-header').should('exist');
  cy.get('app-footer').should('exist');
>>>>>>> 38048e2 (Rebasing Code)
});
