#!/usr/bin/env bash

set -euo pipefail

required_env() {
  local name="$1"
  if [[ -z "${!name:-}" ]]; then
    echo "Missing required environment variable: ${name}" >&2
    exit 1
  fi
}

for name in OUTPUT_DIR INPUT_DIR FINAL_MESSAGE_PATH REPAIR_ATTEMPT PR_NUMBER HEAD_REF BASE_REF COMMENT_AUTHOR COMMENT_URL; do
  required_env "${name}"
done

output_dir="${OUTPUT_DIR}"
input_comment_body_path="${INPUT_DIR}/codex-comment.md"
final_message_path="${FINAL_MESSAGE_PATH}"
comment_body_path="${output_dir}/codex-comment.md"
patch_path="${output_dir}/changes.patch"
metadata_path="${output_dir}/metadata.env"
sanitized_home="${RUNNER_TEMP:-/tmp}/codex-review-repair-collect-home"
sanitized_tmp="${RUNNER_TEMP:-/tmp}/codex-review-repair-collect-tmp"

run_sanitized() {
  env -i \
    "HOME=${sanitized_home}" \
    "PATH=${PATH:-/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin}" \
    "LANG=${LANG:-C.UTF-8}" \
    "LC_ALL=${LC_ALL:-${LANG:-C.UTF-8}}" \
    "TMPDIR=${sanitized_tmp}" \
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

mkdir -p "${output_dir}" "${sanitized_home}" "${sanitized_tmp}"
if [[ ! -s "${final_message_path}" ]]; then
  echo "Codex review repair completed without writing a final message." >"${final_message_path}"
fi

if [[ -s "${input_comment_body_path}" ]]; then
  cp "${input_comment_body_path}" "${comment_body_path}"
else
  {
    echo "Codex addressed review feedback for PR #${PR_NUMBER}."
    echo
    echo "Feedback from @${COMMENT_AUTHOR}: ${COMMENT_URL}"
  } >"${comment_body_path}"
fi

{
  echo
  echo "## Codex Review Repair Attempt ${REPAIR_ATTEMPT}"
  echo
  sed -n '1,200p' "${final_message_path}"
} >>"${comment_body_path}"

if [[ -z "$(git_sanitized status --short --untracked-files=normal)" ]]; then
  echo "Codex review repair left no committable changes." >&2
  exit 1
fi

git_sanitized add -A
if git_sanitized diff --cached --quiet; then
  echo "Codex review repair produced no staged patch output." >&2
  exit 1
fi
git_sanitized diff --cached --binary >"${patch_path}"

{
  echo "has_changes=true"
  echo "pr_number=${PR_NUMBER}"
  echo "head_ref=${HEAD_REF}"
  echo "base_ref=${BASE_REF}"
  echo "comment_author=${COMMENT_AUTHOR}"
  echo "comment_url=${COMMENT_URL}"
  echo "repair_attempt=${REPAIR_ATTEMPT}"
} >"${metadata_path}"

if [[ -n "${GITHUB_OUTPUT:-}" ]]; then
  {
    echo "has_changes=true"
    echo "pr_number=${PR_NUMBER}"
    echo "head_ref=${HEAD_REF}"
  } >>"${GITHUB_OUTPUT}"
fi
