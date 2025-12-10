# AppregFrontend

This README contains a setup guide for setting up your dev environment (Copied from [Confluence](https://tools.hmcts.net/confluence/display/ARM/Frontend+development+setup+for+new+users)).

---

## Prerequisites

- HMCTS.NET account
- GitHub account with HMCTS.NET account linked
- Git installed
- Access to repos in GitHub (see GitHub page)
- Code editor/IDE of choice installed (Eclipse, VS Code, IntelliJ, etc.)
- OpenJDK 21 (for this setup example we used Adoptium Temurin as our source but most JDKs should work)
- Azure CLI
- Certificate store in NPM (for ZScaler to work with yarn install)

---

## MacOS & Linux

You can either run a provided script or install manually.

### Script installation

1. Clone the Git repo
2. Run the `appreg-env-setup.sh` script in your terminal (ensure you are in the root directory of the repo)

- This script runs through the steps of the manual installation
- If the script fails, attempt installation manually
- If you get `permission denied` errors, run:

```bash
sudo chmod +x appreg-env-setup.sh
```

### Manual Installation

1. Ensure Git repo is cloned
2. Install **NVM** from: <https://github.com/nvm-sh/nvm>
3. After installation, add to your shell config:

   ```bash
   export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && printf %s "${HOME}/.nvm" || printf %s "${XDG_CONFIG_HOME}/nvm")"
   [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" # This loads nvm
   ```

4. Verify installation:

   ```bash
   nvm --version
   ```

5. Install Node.js version 20.19.4 and set it:

   ```bash
   nvm install 20.19.4
   nvm use 20.19.4
   ```

6. Check Node.js version:

   ```bash
   node --version  # should be v20.19.4
   ```

7. Navigate to root of `appreg-frontend` directory and run:

   ```bash
   corepack enable
   yarn install
   yarn build
   ```

8. Run a local dev version:

   ```bash
   yarn start:dev
   ```

---

## Troubleshooting

### Curl not found

- Curl should come preinstalled on Linux and MacOS
- Verify with:

  ```bash
  which curl
  ```

  It should return `/usr/bin/curl`. If missing, install manually:

  **Linux:**

  ```bash
  sudo apt-get update && sudo apt-get upgrade
  sudo apt-get install curl
  ```

  **MacOS:**
  - Install Homebrew from [brew.sh](https://brew.sh/)
  - Run:

    ```bash
    brew install curl
    echo 'export PATH="$(brew --prefix)/opt/curl/bin:$PATH"' >> ~/.zshrc
    source ~/.zshrc
    ```

### NVM or Node issues

- Restart terminal:

  ```bash
  exec $SHELL
  ```

- See troubleshooting: <https://github.com/nvm-sh/nvm>

### Yarn

- Ensure you are inside the `appreg-frontend` directory
- Restart terminal, then:

  ```bash
  exec $SHELL
  corepack enable
  ```

- If `node_modules` and `yarn.lock` exist, delete them and run:

  ```bash
  yarn cache clear
  yarn install && yarn build
  ```

---

## Windows

### Using WSL

- Follow the **MacOS & Linux** steps (since WSL is a Linux environment)

### Native Windows

1. Clone Git repo
2. Install Node.js version 20.19.4:

- **Option 1 (simpler):** Install from [Node.js site](https://nodejs.org/en/download)
- **Option 2:** Install `nvm-windows` from [nvm-windows Github](https://github.com/coreybutler/nvm-windows?tab=readme-ov-file)

```powershell
nvm install 20.19.4
nvm use 20.19.4
```

3. Verify installation:

   ```powershell
   node --version
   ```

4. In the `appreg-frontend` directory, run:

   ```powershell
   corepack enable
   yarn install && yarn build
   ```

---

### Quick start guide

Once yarn/node has been installed, run below to generate openapi files

```powershell
yarn api:all
```

Run below to run code using Wiremock/Stub

```powershell
yarn dev:stub
```

Run below to run code using Staging connectivity (VPN required)

```powershell
yarn dev:stg
```

### Troubleshooting (Windows)

#### Node

- Restart PowerShell
- Verify install:

  ```powershell
  node --version && npm --version
  ```

- If not found, add Node.js install path to PATH (usually `C:\Program Files\nodejs\`):
  - Press `Win + R`, type `sysdm.cpl`, press Enter
  - Go to **Advanced → Environment Variables**
  - Under **System variables**, edit `Path` → Add new entry: `C:\Program Files\nodejs\`
  - Restart PowerShell

#### Yarn (Windows)

- Ensure you are inside `appreg-frontend` directory
- Restart PowerShell, then:

  ```powershell
  corepack enable
  ```

- If `node_modules` and `yarn.lock` exist, delete them and run:

  ```powershell
  yarn cache clear
  yarn install && yarn build
  ```

## WireMock Service

This mock service simulates the AppReg API so you can run the UI and SSR server without a live backend.
It ships with hand-crafted fixtures and generated mappings, plus easy ways to force specific error codes for each endpoint.

### Start & stop the container

```bash
yarn start:mock
```

```bash
yarn stop:mock
```

- **Start:** `yarn start:mock` (exposes WireMock at http://localhost:4550)
- **Stop:** `yarn stop:mock`

### Where fixtures live

Curated JSON & CSV fixtures used by mappings are under:

```
wiremock/__files/fixtures/**        # JSON bodies per endpoint/status
wiremock/__files/reports/sample.csv # CSV used by report download endpoint
wiremock/__files/errors/**
```

Fixture files are named:

```
wiremock/__files/fixtures/<group>/<kebab(operationId)>-<status>.json
```

Mappings will automatically use these when available. Feel free to update or add new ones as needed.

### Scripts that generate stuff

#### Generate error bodies (shared JSON payloads for 4xx/5xx)

```bash
yarn mock:gen:errors
# -> runs: node scripts/gen-error-bodies.cjs
# Writes wiremock/__files/errors/*.json (hard-coded JSON, no templating)
```

#### Generate endpoint mappings (success + error scenarios)

```bash
yarn mock:gen
# -> runs: node scripts/gen-wiremock-mappings.cjs
# Reads the OpenAPI spec, creates one 2xx mapping per endpoint,
# and one mapping per error code (401/403/404/… as defined).
# If a curated fixture exists, it’s used via "bodyFileName".
# Error mappings are emitted as WireMock "scenarios" for forcing errors.
```

#### Keep everything in sync (pull spec, build errors, then mappings)

```bash
yarn mock:sync
# -> runs: yarn api:fetch-unpack && yarn mock:gen:errors && yarn mock:gen
```

### How the generator scripts work

- **OpenAPI ingest:** `gen-wiremock-mappings.cjs` reads `tools/openapi/vendor/openapi/openapi.yaml` (and local `$refs`).
- **Grouping:** Each operation is grouped by its first OpenAPI tag (e.g., `court-locations`).
- **One success mapping per endpoint:**
  - Prefers the curated fixture at `wiremock/__files/fixtures/<group>/<opId-kebab>-<2xx>.json`.
  - Otherwise, generates a JSON body from the response schema.
  - Special-case: if the OpenAPI `content-type` is `text/csv`, it serves `wiremock/__files/reports/sample.csv`.
- **Error mappings:**
  - For each 4xx/5xx listed in the spec, a mapping is emitted with a scenario named after the operationId (or a readable fallback) and a `requiredScenarioState` like `FORCE_401`, `FORCE_403`, `FORCE_500`, etc.
  - Body payloads are reused from `wiremock/__files/errors/*.json`.

### Increase (mocked) load times

Two options:

1. Global delay at generation time

Set `STUB_DELAY_MS` before running `yarn mock:gen`:

```bash
STUB_DELAY_MS=250 yarn mock:gen
```

This adds `fixedDelayMilliseconds: 250` to all generated mappings.

2. Per-mapping tweak

Manually add `"fixedDelayMilliseconds"`: <ms> to any mapping JSON under `wiremock/mappings/**`.

### Forcing errors with scenarios

Every endpoint’s error mappings are part of a WireMock scenario. To make a specific endpoint return (say) HTTP 500, set the scenario state to `FORCE_500`.

#### Example (GET /court-locations):

```bash
Put scenario into a 500 state
curl -i -X PUT http://localhost:4550/__admin/scenarios/getCourtLocations/state \
-H 'Content-Type: application/json' \
-d '{"state":"FORCE_500"}'
```

Verify it took:

```bash
curl -s http://localhost:4550/__admin/scenarios \
| jq '.scenarios[] | select(.id=="getCourtLocations" or .name=="getCourtLocations") | {id, name, state, possibleStates}'
```

Now any request that matches that mapping (correct method, path, and headers) will return 500 until you reset the scenario.

### Resetting to normal

- **Reset a single scenario to Started:**

```bash
curl -i -X PUT http://localhost:4550/__admin/scenarios/<ScenarioName>/state \
  -H 'Content-Type: application/json' \
  -d '{"state":"Started"}'
```

- **Reset all scenarios:**

```bash
curl -i -X POST http://localhost:4550/__admin/scenarios/reset
```

- **Full reset:**

```bash
curl -i -X POST http://localhost:4550/__admin/reset
```

## Testing

This section documents all test types, how to run them, and how to add new cases.  
Tests live under `test/` and are split by purpose to keep suites fast and focused.

### Scripts Overview

| Script               | What it runs                                                                                                           | Config                     |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| `yarn test`          | Alias for unit tests locally. In CI (`CI=true`) this script no-ops (exits 0) because CI jobs invoke suites explicitly. | —                          |
| `yarn test:unit`     | Jest unit tests under `test/unit`. Fast, isolated.                                                                     | `jest.config.js` (default) |
| `yarn test:coverage` | Same as unit, with coverage output.                                                                                    | `jest.config.js`           |
| `yarn test:routes`   | Route-render checks under `test/routes`.                                                                               | `jest.routes.config.js`    |
| `yarn test:a11y`     | Accessibility tests with Pa11y under `test/a11y`. Spins up a temp HTTP server.                                         | `jest.a11y.config.js`      |
| `yarn test:smoke`    | High-level smoke tests under `test/smoke`. Disables TLS verification for test envs that use self-signed certs.         | `jest.smoke.config.js`     |

### Unit Tests

- **Location:** `test/unit/`
- **Purpose:** Validate functions, components, and services in isolation.
- **Run:**
  ```bash
  yarn test:unit
  ```
- **With coverage:**
- ```bash
  yarn test:coverage
  ```
- **Tips:**
  - Prefer pure tests without network or timers.

  - Use jest.mock(...) for dependencies.

  - Keep them fast (<100ms each).

### Route Tests

- **Location:** `test/routes/`
- **Purpose:** Verifies that key application routes **function correctly** within the **Server-Side Rendering (SSR)** layer.
- **Run:**

```bash
  yarn test:routes
```

### Accessibility Tests

Accessibility checks run against the built app served via a temporary local server. This is required to support Angular’s client-side routing (e.g., /applications-list/:id).

- **Location:** `test/a11y/`
- **Key files:**
  - `a11y.server.ts` – starts a static SPA server that:
  - serves `dist/appreg-frontend/browser`
  - falls back to index.html for unknown paths
  - `a11y.spec.ts` – defines the list of routes and Pa11y expectations
- **Run:**
  ```bash
  yarn build
  yarn test:a11y
  ```

#### Add/Update Routes

Edit `test/a11y/a11y.spec.ts` and append routes:

```jest
  describe('Accessibility', () => {
    testAccessibility('/login');
    testAccessibility('/applications-list');
    testAccessibility('/applications-list/123'); // dynamic route example (use a stable test ID)
  });
```

### Smoke Tests

- **Location:** `test/smoke/`
- **Purpose:** High-level end-to-end tests simulating user journeys.
- **Run:**

```bash
  yarn test:smoke
```

- **Note:** `NODE_TLS_REJECT_UNAUTHORIZED=0` is set in the script to allow self-signed local certs; do not rely on this outside test environments.

## Cypress Frontend Automation Setup

### Folder Structure

- cypress/
- e2e/
- features/
- smoke/
- smoke.feature
- step_definitions/
- elements/
- navigation/
- WhenNavigationSteps.ts
- fixtures/
- test-data.json
- support/
- e2e.js

### Configuration Files

- cypress.config.js: Cypress configuration

### Running Tests Locally

1. Install dependencies:
   yarn install

2. Add users to development.json add your actual test credentials:

#### User credentials

- TEST_USER1_EMAIL=<your-user1@hmcts.net>
- TEST_USER1_PASSWORD=your-actual-password

#### Admin credentials

- TEST_ADMIN1_EMAIL=<your-admin1@hmcts.net>
- TEST_ADMIN1_PASSWORD=your-actual-admin-password

#### ... fill in all other credentials

3. Run Cypress tests:

#### Open Cypress UI:

yarn cypress:open

#### Open Cypress UI with specific tag:

CYPRESS_TAGS="@ARCPOC-660" yarn cypress:open

#### Run all tests headlessly:

yarn cypress:run

### Sample Test

A sample BDD feature file is provided at `cypress/e2e/features/smoke/smoke.feature` with step definitions in `cypress/e2e/step_definitions/elements/navigation/WhenNavigationSteps.ts`.

## OpenAPI

In this section, we will document how you generate the required services and models using [@openapitools/openapi-generator-cli](https://www.npmjs.com/package/@openapitools/openapi-generator-cli/v/2.9.0?activeTab=readme).

### Scripts

These are the scripts needed:

- `yarn api:fetch-unpack` - Fetches and decompresses OpenAPI spec held in Azure Artifacts (`scripts/fetch-unpack-openapi.cjs`)
- `yarn api:validate` - Validates the OpenAPI spec (`tools/openapi/vendor/openapi/openapi.yaml`)
- `yarn api:clear` - Recursively deletes current OpenAPI generated files held at `src/generated/openapi`
- `yarn api:generate` - Generates files based on the OpenAPI spec and the config file at `tools/openapi/generator-config.yaml`
- `yarn api:bundle` - Bundles the OpenAPI spec, schemas, responses into `tools/dist/openapi.bundled.yaml`
- `yarn api:all` - Runs all API scripts (api:validate -> api:clear -> api:bundle -> api:generate)

## Branch Retention (auto-cleanup)

This repository includes an automated policy to keep old/inactive branches tidy. It runs in two stages:

1. **Dry Run:** scans branches and opens a GitHub Issue with candidates, no deletions.
2. **Enforce:** re-checks eligibility and deletes branches that still qualify; then comments on and closes the Issue.

### How it works (high level)

- A Node script scans via the GitHub API, excluding protected names and branches with open PRs or a “do-not-delete” marker.
- **Run** creates an Issue labeled `branch-cleanup` + a marker label (default `dry-run`) containing a table and a machine-readable ```json block.
- **Enforce** reads that Issue’s JSON (not the runner artifacts), applies the grace period and re-checks exclusions, then deletes eligible branches and posts a deletion summary.

### Files & paths

- **Policy (config):** `.github/branch-retention/branch-retention.yml`
- **Script:** `.github/branch-retention/branch-retention.mjs`
- **Workflow:** `.github/workflows/branch-retention.yml`
- **Artifacts (optional, for download):** `.github/branch-retention/out/*.json`

### Configuring the policy

Edit `.github/branch-retention/branch-retention.yml`:

```json
# Example production-ish values (adjust to taste)
inactivityDays: 60         # candidates must be inactive for >= this many days
graceDays: 7               # wait this many days after “Run” before deletion
protectedPatterns: - 'master'
- 'develop'
- 'release/*'
doNotDelete: label: 'do-not-delete'   # if an open PR has this label, branch is skipped
namePatterns: ['do-not-delete/*', '*[do-not-delete]*']  # name-based skip
notify: githubIssueLabel: 'branch-cleanup'
# (optional) markerLabels: ['dry-run', 'run', 'pending']  # accepted markers
```

### Developer commands (local)

```bash
# Authenticate with GitHub CLI (if not already done):
gh auth login

# Preview run (creates batch Issue):
yarn branch:run

# Enforce (deletes eligible branches for the latest batch):
yarn branch:enforce
```
