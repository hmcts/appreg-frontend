# AppregFrontend

This README contains a setup guide for setting up your dev environment (Copied from [Confluence](https://tools.hmcts.net/confluence/display/ARM/Frontend+development+setup+for+new+users)).

---

## Prerequisites

- HMCTS.NET account
- GitHub account with HMCTS.NET account linked
- Git installed
- Access to repos in GitHub (see GitHub page)
- Code editor/IDE of choice installed (Eclipse, VS Code, IntelliJ, etc.)

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
   yarn cypress open

   or run all tests headlessly:
   yarn cypress run

4. For all tests: yarn test:functional
   For smoke tests: yarn test:functional --cypress-args=\"--env TAGS=@smoke\"
   For any tags: yarn test:functional --cypress-args=\"--env TAGS=@yourtag\"

### Sample Test

A sample BDD feature file is provided at `cypress/e2e/features/smoke/smoke.feature` with step definitions in `cypress/e2e/step_definitions/elements/navigation/WhenNavigationSteps.ts`.

## OpenAPI

In this section, we will document how you generate the required services and models using [@openapitools/openapi-generator-cli](https://www.npmjs.com/package/@openapitools/openapi-generator-cli/v/2.9.0?activeTab=readme).

### Scripts

These are the scripts needed:

- `yarn api:validate` - Validates the OpenAPI spec (`tools/openapi/openapi.yaml`)
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
protectedPatterns:
  - 'master'
  - 'develop'
  - 'release/*'
doNotDelete:
label: 'do-not-delete'   # if an open PR has this label, branch is skipped
namePatterns: ['do-not-delete/*', '*[do-not-delete]*']  # name-based skip
notify:
githubIssueLabel: 'branch-cleanup'
# (optional) markerLabels: ['dry-run','run','pending']  # accepted markers
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
