# Contributing

## Commit and Pull Request Guidelines

- Prefer Conventional Commits; Jira keys are optional prefixes (example: `ARCPOC-1151 feat: add duration input validation`).
- Keep commit subjects at or below 72 characters.
- Reference the Jira ticket and PR number where possible (example: `ARCPOC-1151 fix: ... (#643)`).
- Include concise change summary, testing evidence, and risk notes in PRs.
- Attach Cypress artifacts (screenshots/reports) when diagnosing flaky E2E failures.
- Do not include secrets, credentials, tokens, or PII in commit history, PR text, screenshots, or logs.

## Pull Request Template

Use the repository template at `.github/pull_request_template.md`.

Copy/paste version:

```md
### Jira link

<!-- Replace ARCPOC-XXXX with your Jira key. Remove this section if not applicable. -->

See [ARCPOC-XXXX](JIRA_LINK)

### Change description

<!-- Describe what changed and why. -->

### Testing done

<!--
List automated and/or manual testing performed.
Include enough detail to show changed lines were exercised.
For UI changes, include before/after screenshots where useful.
-->

### Security Vulnerability Assessment

<!--
If Yes below, include:
- CVE ID(s)
- Reason for suppression/ignoring
- Mitigations/compensating controls
-->

**CVE Suppression:** Are there any CVEs present in the codebase (new or pre-existing) that are intentionally suppressed or ignored by this commit?

- [ ] Yes
- [ ] No

### Checklist

- [ ] commit messages are meaningful
- [ ] documentation has been updated (if needed)
- [ ] tests have been updated/added (if needed)
- [ ] this PR introduces a breaking change
```
