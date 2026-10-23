# Accessibility browser tests

Run from the repository root with the Node version in `.nvmrc` and Yarn 4 via Corepack:

```sh
yarn api:all
yarn build:ssr
yarn test:a11y
```

Finish the build before starting the tests: Angular replaces the output directory.
The server requires `dist/appreg-frontend/browser/index.csr.html`. These checks exercise
client-rendered pages from the production SSR build, not production SSR request handling.
No backend, real session or live application data is required. The script caps Jest at
two workers because each worker starts Chromium; this limits contention during browser
startup and navigation.

## Adding a scenario

Add a named scenario to `a11y.scenarios.ts` with its current route, exact heading and a
visible page-specific control. Use the synthetic UUIDs and response fixtures in
`a11y.fixtures.ts`. Payment-reference, deletion and selected-entry workflows also need
navigation state. Add explicit response overrides for failure scenarios and interactions
for validation scenarios; wait for the expected error before scanning.

Every scenario gets a fresh browser context and page, with caching disabled. The harness checks the document status, final
route, heading, visible control and unexpected visible error summaries before Pa11y scans
that same page. API requests without explicit fixtures, failed requests and uncaught
application errors fail the scenario. Do not replace these checks with sleeps or generic
empty responses. Harness regression tests cover unavailable documents and wrong pages.

The reports suites retain their real-browser keyboard and dialog checks and now load
documents from the shared server. The already-skipped browser Back test is owned by a
separate ticket and is unchanged by this repair.

## Component regressions covered

The scans cover the component defects exposed when page identity checks were added:

- Textarea and accordion IDs belong only to their inner elements, not their hosts.
- Multiple empty sortable tables render without repeating a fixed message ID.
- Application-code and official fieldsets have descriptive legends.
- Application-code search does not nest a form inside the entry form.
- The report selector uses a form-group container rather than an incomplete form.

The scan rules remain enabled, including for validation and entry-load-error states.

## VM Modules warnings

`yarn test:a11y` enables `--experimental-vm-modules` because Jest runs these tests
and the Pa11y/Puppeteer ESM dependencies using Node's VM module APIs. Node emits
an `ExperimentalWarning` in each Jest worker, so parallel runs repeat the message
with different process IDs. This warning is separate from accessibility violations
and does not fail a test. Keep the required flag and warnings visible; removing it
can prevent the ESM dependencies from loading.

See [Jest's ESM documentation](https://jestjs.io/docs/ecmascript-modules).
