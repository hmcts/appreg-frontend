# Cypress E2E Testing

Use this guide when writing or updating Cypress E2E tests and Cucumber feature files in `appreg-frontend`.

## Feature layout and tags

- Feature files live under `cypress/e2e/features/**` (for example: `smoke`, `regression`, `apiTests`).
- Step definitions live under `cypress/e2e/step_definitions/**`.
- Tag scenarios for targeting suites (`@smoke`, `@regression`, `@api`) and ticket traceability (`@ARCPOC-XXXX`).
- Use `@ignore`/`@broken` only for known defects with clear tracking.

## Step definitions

- Keep step definitions thin; delegate behavior to helpers in `cypress/support/helper/**`.
- Shared interactions and assertions should be centralized rather than duplicated across steps.

## Actions, helpers, and selectors

- Prefer reusable helpers (navigation, auth, table, form helpers) under `cypress/support/helper/**`.
- Keep selectors in page object classes under `cypress/support/pageobjects/**`.
- Avoid brittle positional selectors and inline repeated `cy.get(...)` chains when an existing helper/page object can be extended.

## Running tests

Run one feature:

```bash
yarn cypress run --browser chrome --spec 'cypress/e2e/features/smoke/smoke.feature'
```

Run common suites:

```bash
yarn cypress:run:smoke:chrome
yarn cypress:run:regression:chrome
yarn cypress:run
```

Run with explicit tag filter:

```bash
CYPRESS_TAGS='@regression and not @ignore and not @broken' yarn cypress:run
```

## Reporting artifacts

- Cypress outputs reports/screenshots under `cypress/reports/**`.
- Generated functional outputs for CI/nightly are written to `functional-output/**` by the test scripts.

## Handling real product bugs

- If a test fails because of a real product defect, do not patch app logic solely to pass the test.
- Skip/mark with defect context only when unavoidable, and record details in the PR/task update.
