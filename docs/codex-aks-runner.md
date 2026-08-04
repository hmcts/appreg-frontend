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

Generation and repair jobs use trusted preparation and collectors captured
before generated content is loaded. Repository formatters, tests, publishing,
and other repository-controlled executables run only in separate jobs where
neither the API key nor the proxy is available. The report-only parity workflow
is stricter: the Codex Action is the final step on its runner, and a fresh
dependent job validates the structured result and receives the Jira
notification secret.

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
- `CODEX_JIRA_PR_NOTIFY_URL`: Azure Function URL, including its function key, for PR-created notifications.
- `CODEX_JIRA_PARITY_NOTIFY_URL`: Azure Function URL, including its function key, for parity-result notifications.

## Optional repository variables

- `CODEX_REVIEWER`: GitHub username to request for review on Codex PRs.
- `CODEX_JIRA_PR_NOTIFY_TIMEOUT_SECONDS`: PR notification timeout. Defaults to `10`.
- `CODEX_JIRA_PARITY_NOTIFY_TIMEOUT_SECONDS`: parity notification timeout. Defaults to `10`.
