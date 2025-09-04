# Applications Register Frontend

This README contains a setup guide for setting up your dev environment (Copied from [Confluence](https://tools.hmcts.net/confluence/display/ARM/Frontend+development+setup+for+new+users)).

---

## Prerequisites

- HMCTS.NET account
- GitHub account with HMCTS.NET account linked
- Git installed
- Access to repos in GitHub (see GitHub page)
- Code editor/IDE of choice installed (Eclipse, VS Code, IntelliJ, etc.)

---

## Developing

### Code style

We use [ESLint](https://github.com/typescript-eslint/typescript-eslint)

Running the linting with auto fix:

```bash
yarn lint:fix
```

### Unit testing

This app uses [Jest](https://jestjs.io//) as the test engine for unit tests.

#### Run unit tests

```bash
yarn test
```

#### Run unit tests with coverage (consumed by SonarQube)

```bash
yarn test:coverage
```

#### Coverage

- **Target:** To meet **HMCTS ways of working**, overall test coverage must be **≥ 80%**.

- Ensure new and changed logic includes tests that keep the project at or above this threshold.

- Focus on:

  - Pure functions, utilities, and components

  - Happy paths, edge cases, and error handling

  - Modules with external dependencies (use mocks/stubs where appropriate)

Place tests under test/unit/**, and add/update tests whenever you introduce new code or significant changes.

### Route testing

This app uses [Jest](https://jestjs.io//) as the test engine for route-level tests.

#### Run the tests

```bash
yarn test:routes
```

#### Coverage

Ensure each HTTP route is exercised, including:

- Expected status codes, headers, and response bodies.

- Validation failures, error paths, and error handlers.

- Authentication/authorization checks, redirects, and cache/control behavior where relevant.

Place tests under test/routes/**, and add/update tests whenever you introduce new endpoints or make significant changes to existing routes.

### Accessibility (a11y) testing

This project includes automated accessibility checks using pa11y.

#### Run the tests

```bash
yarn test:a11y
```

#### Coverage

Make sure all the paths in your application are covered by accessibility tests (see a11y.ts at test/a11y/app.a11y.spec.ts). Add or update entries in that file whenever you introduce new pages or significant UI changes.

### Security

#### Helmet

This application uses [Helmet](https://helmetjs.github.io/), which adds various security-related HTTP headers
to the responses. Apart from default Helmet functions, following headers are set:

- [Referrer-Policy](https://helmetjs.github.io/docs/referrer-policy/)
- [Content-Security-Policy](https://helmetjs.github.io/docs/csp/)

There is a configuration section related with those headers, where you can specify:

- `referrerPolicy` - value of the `Referrer-Policy` header

Here's an example setup:

```json
    "security": {
"referrerPolicy": "origin",
}
```

Make sure you have those values set correctly for your application.

### Healthcheck

The application exposes a health endpoint (https://localhost:4000/health), created with the use of
[Nodejs Healthcheck](https://github.com/hmcts/nodejs-healthcheck) library. This endpoint is defined
in [health.ts](src/routes/health.ts) file. Make sure you adjust it correctly in your application.
In particular, remember to replace the sample check with checks specific to your frontend app,
e.g. the ones verifying the state of each service it depends on.

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
- **Option 2:** Install `nvm-windows` from [here](https://github.com/coreybutler/nvm-windows?tab=readme-ov-file)

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

#### Yarn

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

##### Cypress Frontend Automation Setup

## Folder Structure

cypress/
e2e/
features/
smoke/
smoke.feature
step_definitions/
elements/
navigation/
WhenNavigationSteps.ts
fixtures/
test-data.json
support/
e2e.js

## Configuration Files

- cypress.config.js: Cypress configuration
- cypress.env.json: (optional) Local environment variables

## Running Tests Locally

1. Install dependencies:
   npm install

2. Open Cypress UI:
   npx cypress open

   or run all tests headlessly:
   npx cypress run

## Generating Cucumber HTML Reports

After running your Cypress tests, you can generate a Cucumber HTML report using the following command:

yarn cucumber:report

Or, to run tests and generate the report in one step:

yarn cypress:run:cucumber

This will:

- Run your Cypress tests and generate a Cucumber JSON report in cypress/reports/cucumber-json/
- Create an HTML report in cypress/reports/cucumber-html/ with custom headings and run info

You can customize the report by editing cypress/scripts/generate-cucumber-report.js.

## Sample Test

A sample BDD feature file is provided at `cypress/e2e/features/smoke/smoke.feature` with step definitions in `cypress/e2e/step_definitions/elements/navigation/WhenNavigationSteps.ts`.
