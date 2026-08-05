#!/usr/bin/env bash

set -euo pipefail

required_env() {
  local name="$1"

  if [[ -z "${!name:-}" ]]; then
    echo "Missing required environment variable: ${name}" >&2
    exit 1
  fi
}

required_env "OUTPUT_DIR"
required_env "EXPECTED_BRANCH_NAME"
required_env "GH_TOKEN"
required_env "PLAN_DIR"

default_branch="${DEFAULT_BRANCH:-master}"
output_dir="${OUTPUT_DIR}"
metadata_path="${output_dir}/metadata.env"
patch_path="${output_dir}/changes.patch"
pr_body_path="${output_dir}/codex-pr-body.md"
verification_path="${output_dir}/verification.env"
guardrail_changes_path="${output_dir}/guardrail-changes.txt"
artifact_dir="${RUNNER_TEMP:-/tmp}/codex-jira-verify-${GITHUB_RUN_ID:-manual}-${GITHUB_RUN_ATTEMPT:-1}"
sanitized_home="${artifact_dir}/sanitized-home"
sanitized_tmp="${artifact_dir}/sanitized-tmp"
trusted_pipeline_path="${artifact_dir}/trusted-codex-local-pipeline.sh"
changed_paths_path="${artifact_dir}/changed-paths.bin"
rebuilt_patch_path="${artifact_dir}/changes.patch"
trusted_pipeline_sha=""
trusted_allowed_paths=""
guardrail_review_required="false"
allowed_paths=()
allowed_pathspecs=()
guardrail_pathspecs=(
  "bin/codex-local-pipeline.sh"
  ".github/scripts"
  ".github/workflows"
  "package.json"
  "yarn.lock"
  ".yarnrc.yml"
  ".yarn"
)
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# shellcheck source=.github/scripts/codex-action-runtime.sh
source "${script_dir}/codex-action-runtime.sh"

metadata_value() {
  local key="$1"
  awk -F= -v key="${key}" '$1 == key { sub(/^[^=]*=/, ""); print; exit }' "${metadata_path}"
}

run_sanitized() {
  env -i \
    "HOME=${sanitized_home}" \
    "PATH=${PATH:-/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin}" \
    "SHELL=${SHELL:-/bin/bash}" \
    "USER=${USER:-runner}" \
    "LOGNAME=${LOGNAME:-${USER:-runner}}" \
    "LANG=${LANG:-C.UTF-8}" \
    "LC_ALL=${LC_ALL:-${LANG:-C.UTF-8}}" \
    "TERM=${TERM:-xterm}" \
    "TMPDIR=${sanitized_tmp}" \
    "RUNNER_TEMP=${RUNNER_TEMP:-/tmp}" \
    "CI=${CI:-true}" \
    "GITHUB_ACTIONS=${GITHUB_ACTIONS:-true}" \
    "COREPACK_HOME=${sanitized_home}/.cache/corepack" \
    "FRONTEND_FAST_COMMAND=${FRONTEND_FAST_COMMAND:-}" \
    "FRONTEND_FULL_COMMAND=${FRONTEND_FULL_COMMAND:-}" \
    "GIT_CONFIG_GLOBAL=/dev/null" \
    "GIT_CONFIG_NOSYSTEM=1" \
    "GIT_TERMINAL_PROMPT=0" \
    "$@"
}

git_sanitized() {
  run_sanitized git \
    -c core.hooksPath=/dev/null \
    -c credential.helper= \
    -c protocol.file.allow=never \
    "$@"
}

git_read_authenticated() {
  env -i \
    "HOME=${sanitized_home}" \
    "PATH=${PATH:-/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin}" \
    "SHELL=${SHELL:-/bin/bash}" \
    "USER=${USER:-runner}" \
    "LOGNAME=${LOGNAME:-${USER:-runner}}" \
    "LANG=${LANG:-C.UTF-8}" \
    "LC_ALL=${LC_ALL:-${LANG:-C.UTF-8}}" \
    "TERM=${TERM:-xterm}" \
    "TMPDIR=${sanitized_tmp}" \
    "GIT_CONFIG_GLOBAL=/dev/null" \
    "GIT_CONFIG_NOSYSTEM=1" \
    "GIT_TERMINAL_PROMPT=0" \
    "GH_TOKEN=${GH_TOKEN}" \
    git \
    -c core.hooksPath=/dev/null \
    -c credential.helper= \
    -c credential.helper='!f() { test "$1" = get && echo username=x-access-token && echo "password=$GH_TOKEN"; }; f' \
    -c protocol.file.allow=never \
    "$@"
}

file_sha256() {
  local path="$1"

  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "${path}" | awk '{print $1}'
  else
    shasum -a 256 "${path}" | awk '{print $1}'
  fi
}

verify_trusted_file() {
  local path="$1"
  local expected_sha="$2"
  local label="$3"
  local actual_sha

  actual_sha="$(file_sha256 "${path}")"
  if [[ "${actual_sha}" != "${expected_sha}" ]]; then
    echo "::error::Trusted ${label} changed after capture; refusing to execute it." >&2
    exit 1
  fi
}

assert_path_file_within_plan() {
  local phase="$1"

  TRUSTED_ALLOWED_PATHS="${trusted_allowed_paths}" CHANGED_PATHS_FILE="${changed_paths_path}" PHASE="${phase}" \
    python3 -I - <<'PY'
import os
from pathlib import Path

allowed = set(os.environ["TRUSTED_ALLOWED_PATHS"].splitlines())
if not allowed:
    raise SystemExit("Validated Codex allowed-path set is empty")

raw_paths = Path(os.environ["CHANGED_PATHS_FILE"]).read_bytes()
try:
    changed = {
        value.decode("utf-8")
        for value in raw_paths.split(b"\0")
        if value
    }
except UnicodeDecodeError as error:
    raise SystemExit(f"Changed repository path is not UTF-8: {error}") from error

unexpected = sorted(changed - allowed)
if unexpected:
    detail = ", ".join(repr(path) for path in unexpected)
    raise SystemExit(
        f"Refusing to verify {os.environ['PHASE']} changes outside the validated plan: {detail}"
    )
PY
}

assert_worktree_within_plan() {
  local phase="$1"

  : >"${changed_paths_path}"
  git_sanitized diff \
    --cached \
    --name-only \
    -z \
    --no-renames \
    --no-ext-diff \
    HEAD \
    -- . >>"${changed_paths_path}"
  git_sanitized diff \
    --name-only \
    -z \
    --no-renames \
    --no-ext-diff \
    -- . >>"${changed_paths_path}"
  git_sanitized ls-files --others --exclude-standard -z -- . >>"${changed_paths_path}"
  assert_path_file_within_plan "${phase}"
}

assert_staged_patch_within_plan() {
  git_sanitized diff \
    --cached \
    --name-only \
    -z \
    --no-renames \
    --no-ext-diff \
    HEAD \
    -- . >"${changed_paths_path}"
  assert_path_file_within_plan "staged patch"
}

rebuild_verified_patch() {
  local path
  local pathspec

  assert_worktree_within_plan "post-verification"

  for path in "${allowed_paths[@]}"; do
    pathspec=":(top,literal)${path}"
    if [[ -e "${path}" || -L "${path}" ]] ||
      git_sanitized ls-files --error-unmatch -- "${pathspec}" >/dev/null 2>&1; then
      git_sanitized add -A -- "${pathspec}"
    fi
  done
  assert_worktree_within_plan "staged post-verification"
  assert_staged_patch_within_plan

  if git_sanitized diff --cached --quiet --no-ext-diff HEAD -- "${allowed_pathspecs[@]}"; then
    echo "Codex patch has no staged changes after verification." >&2
    exit 1
  fi

  git_sanitized diff \
    --cached \
    --binary \
    --full-index \
    --no-ext-diff \
    --no-textconv \
    --no-renames \
    HEAD \
    -- "${allowed_pathspecs[@]}" >"${rebuilt_patch_path}"
  if [[ ! -s "${rebuilt_patch_path}" ]]; then
    echo "Failed to rebuild the verified Codex patch." >&2
    exit 1
  fi

  mv "${rebuilt_patch_path}" "${patch_path}"
}

detect_guardrail_changes() {
  local guardrail_changes

  guardrail_changes="$(
    {
      git_sanitized diff --cached --name-status -- "${guardrail_pathspecs[@]}" || true
      git_sanitized status --short --untracked-files=normal -- "${guardrail_pathspecs[@]}" || true
    } | sed '/^[[:space:]]*$/d'
  )"

  printf '%s\n' "${guardrail_changes}" >"${guardrail_changes_path}"
  if [[ -n "${guardrail_changes}" ]]; then
    guardrail_review_required="true"
    echo "::warning::Codex changed workflow, runner, package, or verification files. Manual verification is required."
    printf '%s\n' "${guardrail_changes}"
  fi
}

append_guardrail_warning() {
  if [[ "${guardrail_review_required}" != "true" ]]; then
    return
  fi

  {
    echo
    echo "### Manual verification required"
    echo
    echo "Codex changed workflow, runner, package, or verification files. These changes can affect how checks execute and must be reviewed manually."
    echo
    echo "Changed verification-sensitive files:"
    echo
    sed 's/^/- /' "${guardrail_changes_path}"
  } >>"${pr_body_path}"
}

block_sonar_for_guardrail_changes() {
  if [[ "${guardrail_review_required}" != "true" ]]; then
    return
  fi

  echo "::error::Refusing to run Sonar with SONAR_TOKEN because Codex changed verification-sensitive files." >&2
  echo "Manual review is required before exposing Sonar credentials to changed package, workflow, runner, or verification tooling." >&2
  sed 's/^/- /' "${guardrail_changes_path}" >&2
  exit 1
}

ensure_frontend_formatter() {
  if [[ -x "node_modules/.bin/prettier" ]]; then
    return
  fi

  echo "Installing frontend dependencies for pre-verification formatting."
  run_sanitized node .yarn/releases/yarn-4.10.3.cjs install --immutable --mode=skip-build
}

format_verified_patch() {
  local changed_files=()

  while IFS= read -r path; do
    changed_files+=("${path}")
  done < <(git_sanitized diff --cached --name-only --diff-filter=ACMR | sort -u)

  if [[ "${#changed_files[@]}" -eq 0 ]]; then
    return
  fi

  ensure_frontend_formatter
  echo "Applying Prettier before verifying and publishing the Codex patch."
  run_sanitized node .yarn/releases/yarn-4.10.3.cjs prettier --write --ignore-unknown -- "${changed_files[@]}"
  assert_worktree_within_plan "formatter"
}

run_frontend_sonar_analysis() {
  if [[ "${RUN_SONAR:-true}" != "true" ]]; then
    echo "Skipping Sonar analysis because RUN_SONAR is not true."
    return
  fi

  block_sonar_for_guardrail_changes

  if [[ -z "${SONAR_TOKEN:-}" ]]; then
    echo "::error::SONAR_TOKEN is required for Codex verification Sonar analysis." >&2
    exit 1
  fi

  local sonar_host_url="${SONAR_HOST_URL:-https://sonarcloud.io}"
  local sonar_organization="${SONAR_ORGANIZATION:-hmcts}"
  local sonar_branch_name="${SONAR_BRANCH_NAME:-${branch_name}}"
  local sonar_pr_number="${SONAR_PR_NUMBER:-}"
  local sonar_pr_base="${SONAR_PR_BASE:-${default_branch}}"
  local sonar_quality_gate_timeout="${SONAR_QUALITY_GATE_TIMEOUT_SECONDS:-300}"
  local sonar_args=(
    -Dproject.settings=sonar-project.properties
    "-Dsonar.host.url=${sonar_host_url}"
    "-Dsonar.qualitygate.wait=true"
    "-Dsonar.qualitygate.timeout=${sonar_quality_gate_timeout}"
  )

  if [[ -n "${sonar_pr_number}" ]]; then
    sonar_args+=(
      "-Dsonar.pullrequest.key=${sonar_pr_number}"
      "-Dsonar.pullrequest.branch=${sonar_branch_name}"
      "-Dsonar.pullrequest.base=${sonar_pr_base}"
    )
  else
    sonar_args+=("-Dsonar.branch.name=${sonar_branch_name}")
  fi

  if [[ -n "${sonar_organization}" ]]; then
    sonar_args+=("-Dsonar.organization=${sonar_organization}")
  fi

  ensure_frontend_formatter
  echo "Generating frontend coverage for Sonar analysis."
  run_sanitized node .yarn/releases/yarn-4.10.3.cjs test:coverage --runInBand

  if [[ -n "${sonar_pr_number}" ]]; then
    echo "Running Sonar PR analysis for Codex PR #${sonar_pr_number} (${sonar_branch_name} -> ${sonar_pr_base})."
  else
    echo "Running Sonar analysis for Codex branch ${sonar_branch_name}."
  fi
  run_sanitized env "SONAR_TOKEN=${SONAR_TOKEN}" \
    node .yarn/releases/yarn-4.10.3.cjs \
    dlx -p sonarqube-scanner sonar-scanner "${sonar_args[@]}"
}

mkdir -p "${artifact_dir}" "${sanitized_home}" "${sanitized_tmp}"

validated_codex_plan_path "${PLAN_DIR}" >/dev/null
trusted_allowed_paths="$(<"${PLAN_DIR}/allowed-paths.txt")"
while IFS= read -r path; do
  [[ -n "${path}" ]] || continue
  allowed_paths+=("${path}")
  allowed_pathspecs+=(":(top,literal)${path}")
done <<<"${trusted_allowed_paths}"
if [[ "${#allowed_pathspecs[@]}" -eq 0 ]]; then
  echo "Validated Codex plan contains no allowed paths." >&2
  exit 1
fi
unset PLAN_DIR

branch_name="$(metadata_value branch_name)"
if [[ "${branch_name}" != "${EXPECTED_BRANCH_NAME}" || "${branch_name}" != codex/* ]]; then
  echo "Refusing to verify unexpected Codex branch name: ${branch_name}" >&2
  exit 1
fi

if [[ ! -s "${patch_path}" ]]; then
  echo "Missing or empty Codex patch artifact: ${patch_path}" >&2
  exit 1
fi

cp bin/codex-local-pipeline.sh "${trusted_pipeline_path}"
chmod +x "${trusted_pipeline_path}"
trusted_pipeline_sha="$(file_sha256 "${trusted_pipeline_path}")"

git_read_authenticated fetch origin "${default_branch}:refs/remotes/origin/${default_branch}"
unset GH_TOKEN
git_sanitized checkout -B "${default_branch}" "origin/${default_branch}"
git_sanitized apply --index --binary "${patch_path}"
assert_worktree_within_plan "applied patch"

format_verified_patch

detect_guardrail_changes
append_guardrail_warning

local_pipeline_mode="${LOCAL_PIPELINE_MODE:-checks-only}"
if [[ "${SKIP_LOCAL_PIPELINE:-false}" == "true" ]]; then
  echo "Skipping local pipeline because SKIP_LOCAL_PIPELINE=true"
else
  verify_trusted_file "${trusted_pipeline_path}" "${trusted_pipeline_sha}" "pipeline wrapper"
  run_sanitized "${trusted_pipeline_path}" "${local_pipeline_mode}" --base "${default_branch}" --no-fetch
  assert_worktree_within_plan "local verification"
fi

run_frontend_sonar_analysis
assert_worktree_within_plan "Sonar verification"
rebuild_verified_patch
patch_sha="$(file_sha256 "${patch_path}")"

{
  echo "branch_name=${branch_name}"
  echo "patch_sha=${patch_sha}"
  echo "guardrail_review_required=${guardrail_review_required}"
} >"${verification_path}"

if [[ -n "${GITHUB_OUTPUT:-}" ]]; then
  {
    echo "branch_name=${branch_name}"
    echo "patch_sha=${patch_sha}"
  } >>"${GITHUB_OUTPUT}"
fi
