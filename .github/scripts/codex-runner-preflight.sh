#!/usr/bin/env bash

set -euo pipefail

require_command() {
  local command_name="$1"

  if ! command -v "$command_name" >/dev/null 2>&1; then
    echo "Missing required command: $command_name" >&2
    exit 1
  fi
}

enable_corepack_local() {
  local corepack_bin="${RUNNER_TEMP:-/tmp}/corepack-bin"

  mkdir -p "${corepack_bin}"
  export PATH="${corepack_bin}:${PATH}"

  if [[ -n "${GITHUB_PATH:-}" ]]; then
    echo "${corepack_bin}" >>"${GITHUB_PATH}"
  fi

  corepack enable --install-directory "${corepack_bin}"
}

for command_name in git gh java node corepack python3 codex; do
  require_command "$command_name"
done

echo "Verifying installed tooling..."
git --version
gh --version
java -version
node --version
corepack --version
python3 --version
codex --version

enable_corepack_local
yarn --version

if command -v docker >/dev/null 2>&1; then
  docker --version
else
  echo "::warning::docker is not installed or not on PATH. Frontend unit/build checks do not require Docker, but Cypress or mock-service checks may need it."
fi

if [[ -z "${CODEX_API_KEY:-}" ]]; then
  echo "Missing runner-provisioned CODEX_API_KEY." >&2
  exit 1
fi

if [[ -z "${CODEX_OPENAI_BASE_URL:-}" ]]; then
  echo "Missing runner-provisioned CODEX_OPENAI_BASE_URL." >&2
  exit 1
fi

echo "Using runner-provisioned Codex API-key authentication."
