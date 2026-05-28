#!/usr/bin/env bash

set -euo pipefail

usage() {
  cat <<'EOF'
Usage: bin/codex-local-pipeline.sh [checks-only|fast|codex|full] [options]

Runs a local approximation of the checks that matter before a Codex PR is opened.

Modes:
  checks-only  Validate workflow/script syntax and repository PR guardrails only.
  fast         Run checks-only plus yarn install and yarn cichecks. Default.
  codex        Run the Codex runner preflight plus fast mode.
  full         Run fast mode plus Cypress smoke tests.

Options:
  --base <branch>              Base branch for PR-style diff checks. Default: master.
  --no-fetch                   Do not fetch origin/<base> before diff checks.
  -h, --help                   Show this help.

Environment:
  BASE_BRANCH                  Alternative way to set --base.
  OPENAI_API_KEY               Used by codex mode if present; otherwise existing
                              Codex CLI login is used.
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
for command_name in git bash find node corepack; do
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

log "Validating workflow YAML syntax"
if command -v ruby >/dev/null 2>&1; then
  ruby -e 'require "yaml"; Dir[".github/workflows/*.yml", ".github/workflows/*.yaml"].each { |f| YAML.load_file(f) }; puts "workflow yaml ok"'
else
  warn "ruby is not installed; skipping workflow YAML parse"
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
corepack enable
yarn --version

log "Installing dependencies"
yarn install --immutable

log "Installing Puppeteer Chrome"
./node_modules/.bin/puppeteer browsers install chrome

fast_command="${FRONTEND_FAST_COMMAND:-yarn cichecks}"
log "Running frontend verification: ${fast_command}"
bash -lc "${fast_command}"

if [[ "${mode}" == "full" ]]; then
  full_command="${FRONTEND_FULL_COMMAND:-yarn test:functional}"
  log "Running frontend full verification: ${full_command}"
  bash -lc "${full_command}"
fi

log "Local pipeline completed"
