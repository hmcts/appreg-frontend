#!/usr/bin/env bash

set -euo pipefail

usage() {
  cat <<'EOF'
Usage: bin/codex-local-pipeline.sh [checks-only|fast|full] [options]

Runs the checks that matter before a PR is opened. The shared Codex workflows
run fast mode to verify Codex changes without credentials.

Modes:
  checks-only  Validate workflow/script syntax and repository PR guardrails only.
  fast         Run checks-only plus yarn install and yarn cichecks. Default.
  full         Run fast mode plus Cypress smoke tests.

Options:
  --base <branch>              Base branch for PR-style diff checks. Default: master.
  --no-fetch                   Do not fetch origin/<base> before diff checks.
  -h, --help                   Show this help.

Environment:
  BASE_BRANCH                  Alternative way to set --base.
  FRONTEND_FAST_COMMAND        Verification command for fast mode.
                              Default: yarn cichecks.
  FRONTEND_FULL_COMMAND        Additional verification command for full mode.
                              Default: yarn test:functional.
EOF
}

log() {
  printf '\n==> %s\n' "$*"
}

warn() {
  printf 'Warning: %s\n' "$*" >&2
}

require_command() {
  local command_name="$1"

  if ! command -v "${command_name}" >/dev/null 2>&1; then
    printf 'Missing required command: %s\n' "${command_name}" >&2
    exit 1
  fi
}

enable_corepack_local() {
  local corepack_bin="${RUNNER_TEMP:-${TMPDIR:-/tmp}}/corepack-bin"

  mkdir -p "${corepack_bin}"
  export PATH="${corepack_bin}:${PATH}"
  corepack enable --install-directory "${corepack_bin}"
}

repo_root="$(git rev-parse --show-toplevel)"
cd "${repo_root}"

mode="fast"
if [[ $# -gt 0 && "$1" != -* ]]; then
  mode="$1"
  shift
fi

base_branch="${BASE_BRANCH:-master}"
fetch_base="true"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --base)
      if [[ $# -lt 2 ]]; then
        echo "--base requires a branch name" >&2
        exit 1
      fi
      base_branch="$2"
      shift 2
      ;;
    --no-fetch)
      fetch_base="false"
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

case "${mode}" in
  checks-only|fast|full)
    ;;
  *)
    echo "Unknown mode: ${mode}" >&2
    usage >&2
    exit 1
    ;;
esac

log "Checking required local tools"
for command_name in git bash find node corepack python3; do
  require_command "${command_name}"
done

log "Validating shell scripts"
bash -n bin/*.sh
if compgen -G ".github/scripts/*.sh" >/dev/null; then
  bash -n .github/scripts/*.sh
fi

log "Validating workflow YAML syntax"
if command -v ruby >/dev/null 2>&1; then
  ruby - <<'RUBY'
require "yaml"

errors = []
Dir[".github/workflows/*.yml", ".github/workflows/*.yaml"].each do |path|
  YAML.load_file(path)
rescue Psych::Exception => error
  errors << "#{path}: #{error.message}"
end

pr_tasks_source = File.read(".github/workflows/on-pr.yml")
if pr_tasks_source.match?(/^\s+workflow_dispatch:/) ||
   pr_tasks_source.include?("inputs.pr_number")
  errors << ".github/workflows/on-pr.yml must run only from pull_request events"
end

checks_workflow = YAML.load_file(".github/workflows/checks.yml")
unless checks_workflow.fetch("permissions", {}) == { "contents" => "read" }
  errors << ".github/workflows/checks.yml must use contents: read permissions"
end
checks_checkout = checks_workflow.fetch("jobs", {}).fetch("build", {}).fetch("steps", []).find do |step|
  step.is_a?(Hash) && step.fetch("uses", "").start_with?("actions/checkout@")
end
unless checks_checkout && checks_checkout.fetch("with", {}).fetch("persist-credentials", true) == false
  errors << ".github/workflows/checks.yml must disable persisted checkout credentials"
end

codeql_workflow = YAML.load_file(".github/workflows/codeql.yaml")
codeql_checkout = codeql_workflow.fetch("jobs", {}).fetch("analyze", {}).fetch("steps", []).find do |step|
  step.is_a?(Hash) && step.fetch("uses", "").start_with?("actions/checkout@")
end
unless codeql_checkout && codeql_checkout.fetch("with", {}).fetch("persist-credentials", true) == false
  errors << ".github/workflows/codeql.yaml must disable persisted checkout credentials"
end

abort(errors.join("\n")) unless errors.empty?
puts "workflow yaml and PR workflow guardrails ok"
RUBY
else
  warn "ruby is not installed; skipping workflow YAML and PR workflow validation"
fi

base_ref="origin/${base_branch}"
if [[ "${fetch_base}" == "true" ]]; then
  log "Fetching ${base_ref}"
  git fetch origin "${base_branch}" >/dev/null
fi

if git rev-parse --verify --quiet "${base_ref}" >/dev/null; then
  merge_base="$(git merge-base "${base_ref}" HEAD)"

  log "Changed files against ${base_ref}"
  changed_files="$(git diff --name-status "${merge_base}" -- || true)"
  if [[ -n "${changed_files}" ]]; then
    echo "${changed_files}"
  else
    echo "No changes detected against ${base_ref}."
  fi
else
  warn "Could not find ${base_ref}; skipping PR-style diff guardrails"
fi

if [[ "${mode}" == "checks-only" ]]; then
  log "Local pipeline checks completed"
  exit 0
fi

log "Preparing Yarn"
enable_corepack_local
yarn --version

log "Installing dependencies"
yarn install --immutable

fast_command="${FRONTEND_FAST_COMMAND:-yarn cichecks}"
log "Running frontend verification: ${fast_command}"
bash -c "${fast_command}"

if [[ "${mode}" == "full" ]]; then
  full_command="${FRONTEND_FULL_COMMAND:-yarn test:functional}"
  log "Running frontend full verification: ${full_command}"
  bash -c "${full_command}"
fi

log "Local pipeline completed"
