# Repo Guidelines

This document captures structure, commands, and coding conventions for `appreg-frontend`.

## Project structure

- Angular app code lives in `src/app/**` (core/shared/pages/components, guards, services, validators).
- SSR and server code live in `server/**` with route tests in `test/routes/**`.
- API-generated clients live in `src/generated/openapi/**`.
- WireMock mappings/fixtures live in `wiremock/**`.
- Helm/chart deployment config lives in `charts/**`.
- Repo automation (branch retention, workflows) lives in `.github/**`.

## Build, test, and development commands

- `corepack enable && yarn install`
- `yarn watch` for Angular dev server on port `4200`.
- `yarn start:dev` for SSR server with nodemon.
- `yarn dev:stub` to run WireMock + SSR + Angular watch together.
- `yarn dev:stg` to run against staging API base URL.
- `yarn build` for Angular build.
- `yarn build:ssr` for production SSR build.
- `yarn lint` / `yarn lint:fix` for formatting + linting.
- `yarn test:unit`, `yarn test:routes`, `yarn test:a11y`, `yarn test:smoke`.
- `yarn cypress:run` and related Cypress scripts for E2E.
- `yarn cichecks` for CI-equivalent checks.

## API and mock generation

- Regenerate OpenAPI clients with `yarn api:all`.
- Refresh WireMock mappings/errors with `yarn mock:sync`.
- Do not hand-edit generated OpenAPI output under `src/generated/openapi/**` unless regeneration tooling requires it.

## Coding style and naming

- Follow `.editorconfig`: UTF-8, spaces, 2-space indent, trimmed trailing whitespace.
- Follow `.prettierrc.json`: single quotes, semicolons, print width 120.
- Keep imports grouped and ordered to satisfy ESLint.
- Use existing path aliases and naming patterns already established under `src/app/**`.
- Keep browser-only behavior guarded for SSR compatibility (for example `isPlatformBrowser` checks).

## Code quality expectations

- Keep changes maintainable and minimize duplication.
- Behavior changes require relevant tests.
- Lint/type/test failures block merge.
- Preserve accessibility and GOV.UK/MoJ frontend patterns already in use.

## Testing basics

- Unit tests: `test/unit/**/*.spec.ts`.
- SSR route tests: `test/routes/**/*.spec.ts`.
- Accessibility tests: `test/a11y/**/*.a11y.spec.ts`.
- Smoke tests: `test/smoke/**/*.smoke.spec.ts`.
- Cypress E2E BDD tests: `cypress/e2e/features/**/*.feature`.

## Local environment and tooling

- Use Node version from `.nvmrc` (`20.20.0`).
- Use Yarn from `packageManager` in `package.json` (`yarn@4.10.3`) via Corepack.
- Java 21 is required for OpenAPI tooling.
- Store local credentials in untracked local config only; never commit secrets.
