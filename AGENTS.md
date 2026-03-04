# Repository Guidelines

`appreg-frontend` is an Angular SSR web app with a Node/Express server that integrates with Azure SSO and AppReg APIs.

Package manager: Yarn 4 via Corepack (`corepack enable` + `yarn`).

Always:
- Do not add secrets, tokens, credentials, or PII to code, logs, comments, fixtures, or tests.
- Keep API-generated artifacts in sync when API contracts change (`yarn api:all`).
- Add or update tests when behavior changes.

For repo conventions and contribution rules, see:
- `docs/REPO_GUIDELINES.md`
- `docs/CONTRIBUTING.md`

For testing guidance, see:
- `docs/CYPRESS_COMPONENT_TESTING.md`
- `docs/CYPRESS_E2E_TESTING.md`

## Review guidelines

- Prioritize findings by severity:
  - `P1`: auth/session bypass, secret leakage, broken SSR security/session handling, or critical user-flow breakage (`/login`, `/applications-list`, `/reports`).
  - `P2`: functional regressions, missing validation/error handling, route mismatches, or missing tests for changed behavior.
  - `P3`: maintainability/style concerns that do not change runtime behavior.
- Flag PRs that modify API behavior without corresponding updates to generated clients (`src/generated/openapi`) and related mock data (`wiremock/`) when applicable.
- For fixes and feature work, expect evidence via relevant suites (`test/unit`, `test/routes`, `test/a11y`, `test/smoke`, or Cypress E2E features).
