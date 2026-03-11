# Repository Guidelines

Owner: AppReg Frontend Team  
Last reviewed: 2026-03-10  
Applies to: AI coding agents and contributors in `appreg-frontend`

`appreg-frontend` is an Angular SSR web app with a Node/Express server that integrates with Azure SSO and AppReg APIs.

Contributors and agents MUST use Yarn 4 via Corepack (`corepack enable` + `yarn`).

Always:

- You MUST NOT add secrets, tokens, credentials, or PII to code, logs, comments, fixtures, or tests.
- You MUST keep API-generated artifacts in sync when API contracts change (`yarn api:all`).
- You MUST add or update tests when behavior changes.

For repo conventions and contribution rules, see:

- `docs/REPO_GUIDELINES.md`
- `docs/CONTRIBUTING.md`

For testing guidance, see:

- `docs/CYPRESS_COMPONENT_TESTING.md`
- `docs/CYPRESS_E2E_TESTING.md`

## Review guidelines

- You MUST prioritize findings by severity:
  - `P1`: auth/session bypass, secret leakage, broken SSR security/session handling, or critical user-flow breakage (`/login`, `/applications-list`, `/reports`).
  - `P2`: functional regressions, missing validation/error handling, route mismatches, or missing tests for changed behavior.
  - `P3`: maintainability/style concerns that do not change runtime behavior.
- You MUST flag PRs that modify API behavior without corresponding updates to generated clients (`src/generated/openapi`) and related mock data (`wiremock/`) when applicable.
- You SHOULD expect evidence via relevant suites (`test/unit`, `test/routes`, `test/a11y`, `test/smoke`, or Cypress E2E features).
