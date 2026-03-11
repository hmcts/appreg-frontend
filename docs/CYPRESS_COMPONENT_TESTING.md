# Cypress Component Testing

Use this guide when adding or updating Cypress component tests in `appreg-frontend`.

## Current status

- There are currently no committed Cypress component specs under `cypress/component/**`.
- `cypress.config.js` defines component settings, but the configured support file `cypress/support/component.js` does not currently exist.
- There is no dedicated component-test script in `package.json`; component runs are currently ad hoc via direct Cypress CLI.
- Component-level coverage in this repo is primarily via Jest specs in `test/unit/**`.

## Structure and setup

- Add specs under `cypress/component/**` grouped by feature.
- Reuse shared helpers/page objects in `cypress/support/helper/**` and `cypress/support/pageobjects/**` where practical.
- Prefer stable hooks and semantic selectors; avoid brittle positional selectors.

## Page object and helper usage

- Keep step/spec logic thin and delegate interactions to reusable helpers.
- If no helper exists, add one in `cypress/support/helper/**` and keep selector ownership in page objects.

## Mocks and fixtures

- Keep fixtures near the owning feature in `cypress/fixtures/**` or feature-local folders.
- Keep scenarios isolated; avoid cross-spec fixture coupling.

## Running a single component spec

```bash
yarn cypress run --browser chrome --component --spec 'cypress/component/<feature>/<name>.cy.ts'
```

## Handling real product bugs

- If a component test exposes a real product bug, do not alter application behavior only to force green tests.
- Mark/skip temporarily only when necessary and record the linked defect in task/PR notes.
