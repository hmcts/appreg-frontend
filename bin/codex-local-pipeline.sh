#!/usr/bin/env bash

set -euo pipefail

usage() {
  cat <<'EOF'
Usage: bin/codex-local-pipeline.sh [checks-only|fast|codex|full] [options]

Runs a local approximation of the checks that matter before a Codex PR is opened.

Modes:
  checks-only  Validate workflow/script syntax and repository PR guardrails only.
  fast         Run checks-only plus yarn install and yarn cichecks. Default.
  codex        Run the runner toolchain preflight plus fast mode.
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
  checks-only|fast|codex|full)
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

if [[ "${mode}" == "codex" ]]; then
  log "Running Codex runner preflight"
  ./.github/scripts/codex-runner-preflight.sh
fi

log "Validating shell scripts"
bash -n \
  .github/scripts/*.sh \
  bin/*.sh

log "Validating parity result collector"
python_cache="${RUNNER_TEMP:-${TMPDIR:-/tmp}}/codex-pycache"
mkdir -p "${python_cache}"
PYTHONPYCACHEPREFIX="${python_cache}" python3 -m py_compile .github/scripts/*.py
PYTHONPYCACHEPREFIX="${python_cache}" python3 .github/scripts/test-collect-parity-result.py

log "Validating workflow YAML syntax"
if command -v ruby >/dev/null 2>&1; then
  ruby - <<'RUBY'
require "yaml"

expected_codex_version = "0.146.0"
errors = []

Dir[".github/workflows/*.yml", ".github/workflows/*.yaml"].each do |path|
  workflow = YAML.load_file(path)
  workflow_env = workflow.fetch("env", {}) || {}
  workflow.fetch("jobs", {}).each do |job_name, job|
    steps = job.fetch("steps", [])
    codex_steps = steps.select do |step|
      step.is_a?(Hash) && step.fetch("uses", "").start_with?("openai/codex-action@")
    end
    next if codex_steps.empty?

    job_env = job.fetch("env", {}) || {}
    action_exposes_token = codex_steps.any? do |step|
      (step.fetch("env", {}) || {}).key?("GH_TOKEN")
    end
    if workflow_env.key?("GH_TOKEN") || job_env.key?("GH_TOKEN") || action_exposes_token
      errors << "#{path}:#{job_name} exposes GH_TOKEN to the Codex Action"
    end

    codex_steps.each do |step|
      version = step.fetch("with", {}).fetch("codex-version", "")
      errors << "#{path}:#{job_name} must pin codex-version to #{expected_codex_version}" unless version == expected_codex_version

      next unless File.basename(path) == "codex_runner_smoke.yml"

      inputs = step.fetch("with", {})
      unless inputs.fetch("model", "") == "gpt-5.6-sol" && inputs.fetch("effort", "") == "ultra"
        errors << "#{path}:#{job_name} must smoke-test gpt-5.6-sol with ultra effort"
      end
    end
  end

  next unless File.basename(path) == "appreg_parity_check.yml"

  parity_job = workflow.fetch("jobs", {}).fetch("parity-check", {})
  parity_steps = parity_job.fetch("steps", [])
  action_index = parity_steps.index do |step|
    step.is_a?(Hash) && step.fetch("uses", "").start_with?("openai/codex-action@")
  end
  unless action_index == parity_steps.length - 1
    errors << "#{path}:parity-check must end with the Codex Action"
  end
  if parity_job.inspect.include?("CODEX_JIRA_PARITY_NOTIFY_URL")
    errors << "#{path}:parity-check must not receive the Jira notification secret"
  end

  notify_job = workflow.fetch("jobs", {}).fetch("parity-notify", {})
  unless notify_job.fetch("needs", "") == "parity-check"
    errors << "#{path}:parity-notify must depend on parity-check"
  end
  unless notify_job.inspect.include?("CODEX_JIRA_PARITY_NOTIFY_URL")
    errors << "#{path}:parity-notify must own the Jira notification secret"
  end
end

if File.exist?(".github/scripts/codex-usage-metrics.sh")
  errors << ".github/scripts/codex-usage-metrics.sh must not emit empty compatibility telemetry"
end
Dir[".github/**/*"].select { |path| File.file?(path) }.each do |path|
  if File.read(path).include?("codex-usage-summary")
    errors << "#{path} still references the removed empty token-usage artefact"
  end
end

collector_order_checks = {
  ".github/scripts/codex-jira-repair.sh" => /git_sanitized apply --binary/,
  ".github/scripts/codex-merge-conflict-implement.sh" => /git_sanitized checkout -B/,
  ".github/scripts/codex-pr-review-repair.sh" => /git_sanitized checkout -B/,
}

collector_order_checks.each do |path, untrusted_operation|
  next unless File.exist?(path)

  lines = File.readlines(path)
  capture_index = lines.index { |line| line.include?("capture_codex_collector") }
  untrusted_index = lines.index { |line| line.match?(untrusted_operation) }
  if capture_index.nil? || untrusted_index.nil? || capture_index >= untrusted_index
    errors << "#{path} must capture its collector before loading untrusted repository content"
  end
end

abort(errors.join("\n")) unless errors.empty?
puts "workflow yaml and Codex security invariants ok"
RUBY
else
  warn "ruby is not installed; skipping workflow YAML and Codex security validation"
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
