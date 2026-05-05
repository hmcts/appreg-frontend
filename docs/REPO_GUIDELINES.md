# Repo Guidelines

Owner: AppReg Frontend Team  
Last reviewed: 2026-03-10  
Applies to: All contributors and AI coding agents working in `appreg-frontend`

This document captures structure, commands, and coding conventions for `appreg-frontend`.

## Project structure

- Angular app code MUST live in `src/app/**` (core/shared/pages/components, guards, services, validators).
- SSR and server code MUST live in `server/**` with route tests in `test/routes/**`.
- API-generated clients MUST live in `src/generated/openapi/**`.
- WireMock mappings/fixtures MUST live in `wiremock/**`.
- Helm/chart deployment config SHOULD live in `charts/**`.
- Repo automation (branch retention, workflows) MUST live in `.github/**`.

## Build, test, and development commands

- You MUST run `corepack enable && yarn install` before local development if dependencies are not installed.
- You SHOULD use `yarn watch` for Angular dev server on port `4200`.
- You SHOULD use `yarn start:dev` for SSR server with nodemon.
- You MAY use `yarn dev:stub` to run WireMock + SSR + Angular watch together.
- You MAY use `yarn dev:stg` to run against staging API base URL.
- You SHOULD use `yarn build` for Angular build validation.
- You SHOULD use `yarn build:ssr` for production SSR build validation.
- You MUST use `yarn lint` / `yarn lint:fix` for formatting + linting compliance.
- You SHOULD run `yarn test:unit`, `yarn test:routes`, `yarn test:a11y`, and `yarn test:smoke` when behavior changes.
- You MAY run `yarn cypress:run` and related Cypress scripts for E2E validation.
- You SHOULD run `yarn cichecks` before opening or merging a PR.

## API and mock generation

- You MUST regenerate OpenAPI clients with `yarn api:all` when API contracts change.
- You SHOULD refresh WireMock mappings/errors with `yarn mock:sync` when API behavior changes.
- You MUST NOT hand-edit generated OpenAPI output under `src/generated/openapi/**` unless regeneration tooling requires it.

## Coding style and naming

- You MUST follow `.editorconfig`: UTF-8, spaces, 2-space indent, trimmed trailing whitespace.
- You MUST follow `.prettierrc.json`: single quotes, semicolons, print width 120.
- You MUST keep imports grouped and ordered to satisfy ESLint.
- You SHOULD use existing path aliases and naming patterns already established under `src/app/**`.
- You MUST keep browser-only behavior guarded for SSR compatibility (for example `isPlatformBrowser` checks).

## Code quality expectations

- You SHOULD keep changes maintainable and minimize duplication.
- You MUST add relevant tests for behavior changes.
- You MUST treat lint/type/test failures as merge blockers.
- You MUST preserve accessibility and GOV.UK/MoJ frontend patterns already in use.

## Testing basics

- Unit tests SHOULD be placed at `test/unit/**/*.spec.ts`.
- SSR route tests SHOULD be placed at `test/routes/**/*.spec.ts`.
- Accessibility tests SHOULD be placed at `test/a11y/**/*.a11y.spec.ts`.
- Smoke tests SHOULD be placed at `test/smoke/**/*.smoke.spec.ts`.
- Cypress E2E BDD tests SHOULD be placed at `cypress/e2e/features/**/*.feature`.

## Local environment and tooling

- You MUST use the Node version from `.nvmrc` (`24.15.0`).
- You MUST use Yarn from `packageManager` in `package.json` (`yarn@4.10.3`) via Corepack.
- You MUST use Java 21 for OpenAPI tooling.
- You MUST store local credentials in untracked local config only; you MUST NOT commit secrets.
