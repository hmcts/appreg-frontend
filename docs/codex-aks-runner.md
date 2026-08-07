# Codex AKS Runner

This repository runs the Applications Register Codex workflows on the
`codex-frontend-azure-aks` ARC scale set.

## Codex Action authentication

The API key is stored as the GitHub Actions secret `CODEX_OPENAI_API_KEY` and
is supplied only to the pinned official `openai/codex-action`. The action keeps
the real key behind a local Responses API proxy; Codex runs as the dedicated
unprivileged `codex` user and never receives the key in its environment. All
invocations pin the Codex CLI and proxy to `0.146.0` and use the regional
Responses endpoint `https://eu.api.openai.com/v1/responses`.

## Planning and eligibility

Each Jira dispatch starts with a separate read-only Codex invocation. Planning
uses `gpt-5.6-sol` with `ultra` effort, while the Action commit, CLI version,
regional endpoint, unprivileged user and `:read-only` permission profile also
remain pinned. The planner returns structured JSON containing the root cause,
scope decision, alternatives, implementation paths, tests, acceptance criteria, risks,
assumptions and blockers.

A fresh GitHub-hosted job validates and size-limits the untrusted JSON, rejects
protected automation paths, and emits a canonical plan plus its SHA-256 hash as
a bounded private job output. Raw plan content is not uploaded as an artefact,
written to a workflow summary, or copied into the generated PR body. Tickets
that are not ready produce an explicit terminal `codex-plan-blocked` failure
before any workspace-writing model invocation.

Eligible validated plans marked ready proceed automatically to implementation;
no GitHub environment approval is required. High-risk and cross-system plans
are normalised to a blocked result and stop before implementation, as do plans
that the planner marks not ready. This keeps the small-bug workflow moving
without silently extending it into broader or higher-risk work.

Planning uses `gpt-5.6-sol` with `ultra` effort. Implementation checks out the
exact commit inspected by the planner and uses `gpt-5.6-sol` with `medium`
effort; repair, PR-feedback, and conflict-resolution invocations use the same
implementation configuration. The validated plan is included only in the
implementation and repair prompts. Its exact file paths constrain both the
captured patch exporter and every fresh trusted collector; any other changed
path is rejected. Verification repairs reuse the original plan and stop for a
new planning run when repository evidence invalidates its scope.

The workflow rejects plans that target package-manager, runner, workflow or
verification tooling. A trusted preparation job archives the exact planned
repository revision without executing it. Patch application, formatting, Yarn
and all repository tests then run from that archive in jobs with
`permissions: {}` and no GitHub or Sonar credentials. Authenticated
publication and status/Sonar API checks run later in separate trusted jobs that
never apply or execute the model-generated patch.

The current Azure Function implementation callback accepts only genuine
PR-created payloads and transitions Jira to Dev Review. It has no blocker or
failure result contract, so a blocked plan cannot truthfully notify Jira from
this workflow; the failed job and audit hash are the terminal result until that
external API and Jira Automation rule are extended.

## Trusted GitHub publication

Codex branches, pull requests, review updates and conflict-resolution commits
are published by an HMCTS-owned GitHub App. Each trusted publication job mints
a short-lived installation token restricted to `appreg-frontend`, with explicit
write access to Contents, Pull requests, Issues and Workflows. The App is used
for branch pushes, pull requests, comments and workflow-file changes; it does
not receive Actions administration permission. The default GitHub Actions
identity is not used for publication.

Publisher credentials are exposed only to the trusted identity-verification and
publication steps. Before each push, `.github/scripts/codex-verify-publisher.py`
checks the App slug, installation ID, HMCTS installation owner, explicit
permissions, bot identity and push access to this exact repository. The bot
login and noreply email are derived from the verified App identity rather than
stored as repository configuration. Model-facing, verification and PR-check
jobs never receive the App private key or installation token, and their checkout
credentials are not persisted.

Every workspace-writing Codex job ends with the official Action. Codex returns
a schema-validated, size-bounded gzip/base64 patch through the Action's
`final-message` job output; no privileged collector, Git command, or artifact
action runs against the model-writable checkout afterward. A fresh dependent
job checks out the exact trusted commit recorded by the Action job, validates
and materialises that untrusted patch, and passes it to the existing
credential-free verification and trusted publication stages. Before loading
untrusted repository content, the runner captures a read-only patch exporter;
it builds the patch with a temporary Git index and object store because the
`:workspace` profile keeps the real `.git` metadata read-only. The report-only
parity workflow follows the same final-step boundary and gives its Jira
notification secret only to a fresh dependent job.

## Cost and usage monitoring

The official Action does not expose its token event stream to trusted workflow
collectors. Empty per-run token artefacts are therefore not emitted: a file with
`usageAvailable=false` is not cost telemetry and must not be used for reporting.
This is an accepted limitation of the credential-proxy migration.

Cost governance uses the OpenAI provider control plane instead:

- Run the Apps Reg agent from a dedicated OpenAI project. Use separate project
  API keys for each repository when repository-level attribution is required.
- Keep the organisation Admin API key in the CGI AI team's central monitoring
  service or Key Vault. It must not be stored in these repositories, GitHub
  Actions, or AKS.
- Export daily usage from
  `GET /v1/organization/usage/completions`, filtered by project or API key and
  grouped by model. Export daily spend from
  `GET /v1/organization/costs`, filtered by the same project.
- Retain the raw daily buckets, publish a monthly cost report, and alert against
  the agreed project budget. GitHub run history remains the source for run counts
  and operational failures; provider data is the source for tokens and cost.

Before production rollout, record the OpenAI project ID, reporting owner,
collection location, retention period, and spend-alert threshold. Until the
central export is operational, the named owner must review the OpenAI
organisation usage dashboard at least weekly. See OpenAI's
[Usage and Costs API guide](https://developers.openai.com/cookbook/examples/completions_usage_api)
and [organisation usage dashboard](https://platform.openai.com/settings/organization/usage).

## Required repository secrets

- `CODEX_OPENAI_API_KEY`: OpenAI API key used only by the official Codex Action proxy.
- `CODEX_GITHUB_APP_PRIVATE_KEY`: private key for the HMCTS-owned Codex GitHub App, used only to mint repository-scoped installation tokens in trusted jobs.
- `CODEX_JIRA_PR_NOTIFY_URL`: Azure Function URL, including its function key, for PR-created notifications.
- `CODEX_JIRA_PARITY_NOTIFY_URL`: Azure Function URL, including its function key, for parity-result notifications.

## Required repository variables

- `CODEX_GITHUB_APP_CLIENT_ID`: client ID of the HMCTS-owned Codex GitHub App.

## Optional repository variables

- `CODEX_REVIEWER`: GitHub username to request for review on Codex PRs.
- `CODEX_JIRA_PR_NOTIFY_TIMEOUT_SECONDS`: PR notification timeout. Defaults to `10`.
- `CODEX_JIRA_PARITY_NOTIFY_TIMEOUT_SECONDS`: parity notification timeout. Defaults to `10`.
