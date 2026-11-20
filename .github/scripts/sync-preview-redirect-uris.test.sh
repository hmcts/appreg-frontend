#!/usr/bin/env bash
#
# Tests sync-preview-redirect-uris.sh against a fake `az` that keeps the
# redirect URI list in a file, a fake `gh` that lists PRs from files, and a
# fake `sleep` that only records the delay.
#
# Each case can script the fakes through files in its graph directory:
#   state           the list Graph holds
#   get-N           returned by the Nth GET instead of the list (a stale read)
#   after-get-N     replaces the list right after the Nth GET (another writer)
#   fail-get-N      makes the Nth GET fail
#   fail-patch-N    makes the Nth PATCH fail
#   after-patch-N   replaces the list right after the Nth PATCH (another writer)
#   after-patch-N-gh-open  replaces gh-open right after the Nth PATCH
#   gh-open         the repository's open PRs, as gh lists them
#   gh-closed       the repository's recently closed PRs, as gh lists them
#   fail-gh         makes gh fail

# The lists below are jq expressions over $others, so single quotes are meant.
# shellcheck disable=SC2016

set -uo pipefail

script="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/sync-preview-redirect-uris.sh"
work="$(mktemp -d)"
trap 'rm -rf "${work}"' EXIT

mkdir "${work}/bin"
cat >"${work}/bin/az" <<'FAKE_AZ'
#!/usr/bin/env bash
set -euo pipefail
method=""
body=""
while [ $# -gt 0 ]; do
  case "$1" in
    --method) method="$2"; shift 2 ;;
    --body) body="$2"; shift 2 ;;
    *) shift ;;
  esac
done
count() {
  local n
  n=$(($(cat "${FAKE_GRAPH}/$1" 2>/dev/null || echo 0) + 1))
  echo "${n}" >"${FAKE_GRAPH}/$1"
  echo "${n}"
}
case "${method}" in
  GET)
    n="$(count gets)"
    if [ -f "${FAKE_GRAPH}/fail-get-${n}" ]; then
      echo "ERROR: Too Many Requests" >&2
      exit 1
    fi
    if [ -f "${FAKE_GRAPH}/get-${n}" ]; then
      cat "${FAKE_GRAPH}/get-${n}"
    else
      cat "${FAKE_GRAPH}/state"
    fi
    if [ -f "${FAKE_GRAPH}/after-get-${n}" ]; then
      cp "${FAKE_GRAPH}/after-get-${n}" "${FAKE_GRAPH}/state"
    fi
    ;;
  PATCH)
    n="$(count patches)"
    if [ -f "${FAKE_GRAPH}/fail-patch-${n}" ]; then
      echo "ERROR: Service Unavailable" >&2
      exit 1
    fi
    jq -c '.web.redirectUris' <<<"${body}" >"${FAKE_GRAPH}/state"
    if [ -f "${FAKE_GRAPH}/after-patch-${n}" ]; then
      cp "${FAKE_GRAPH}/after-patch-${n}" "${FAKE_GRAPH}/state"
    fi
    if [ -f "${FAKE_GRAPH}/after-patch-${n}-gh-open" ]; then
      cp "${FAKE_GRAPH}/after-patch-${n}-gh-open" "${FAKE_GRAPH}/gh-open"
    fi
    ;;
  *)
    echo "fake az: unexpected arguments" >&2
    exit 2
    ;;
esac
FAKE_AZ
cat >"${work}/bin/gh" <<'FAKE_GH'
#!/usr/bin/env bash
set -euo pipefail
if [ -f "${FAKE_GRAPH}/fail-gh" ]; then
  echo "HTTP 502: Bad Gateway" >&2
  exit 1
fi
state=""
while [ $# -gt 0 ]; do
  case "$1" in
    --state) state="$2"; shift 2 ;;
    *) shift ;;
  esac
done
cat "${FAKE_GRAPH}/gh-${state}" 2>/dev/null || echo "[]"
FAKE_GH
cat >"${work}/bin/sleep" <<'FAKE_SLEEP'
#!/usr/bin/env bash
echo "$1" >>"${FAKE_GRAPH}/slept"
FAKE_SLEEP
chmod +x "${work}/bin/az" "${work}/bin/gh" "${work}/bin/sleep"

# Other redirect URIs on the app registration. They must survive every update
# and never appear in the log.
others='["https://keep.example.test/sso/login-callback","https://keep.example.test/sso/logout-callback"]'

pr() {
  jq -c '[.[] | "https://appreg-frontend-pr-\(.).dev.platform.hmcts.net/sso/login-callback",
                "https://appreg-frontend-pr-\(.).dev.platform.hmcts.net/sso/logout-callback"]' <<<"$1"
}

graph=""
cases=0
failures=0
case_failures=0
current_case=""

start() {
  cases=$((cases + 1))
  current_case="$1"
  case_failures=0
  graph="${work}/case-${cases}"
  mkdir "${graph}"
}

# Writes a JSON list to a file in the graph directory: given <file> <jq expr>.
given() {
  jq -cn --argjson others "${others}" "$2" >"${graph}/$1"
}

run_sync() {
  env PATH="${work}/bin:${PATH}" FAKE_GRAPH="${graph}" OBJECT_ID="${OBJECT_ID-test-object-id}" \
    SETTLE_SECONDS=90 "$@" bash "${script}" >"${graph}/out" 2>&1
  echo "$?" >"${graph}/status"
}

check() {
  local description="$1"
  shift
  if ! "$@"; then
    echo "not ok - ${current_case}: ${description}"
    sed 's/^/    | /' "${graph}/out"
    failures=$((failures + 1))
    case_failures=$((case_failures + 1))
  fi
}

status_is() { [ "$(cat "${graph}/status")" = "$1" ]; }
count_is() { [ "$(cat "${graph}/$1" 2>/dev/null || echo 0)" = "$2" ]; }
state_is() { [ "$(jq -c . "${graph}/state")" = "$(jq -cn --argjson others "${others}" "$1")" ]; }
output_has() { grep -qF -- "$1" "${graph}/out"; }
quiet_about_others() { ! grep -qF "keep.example.test" "${graph}/out"; }
never_slept() { [ ! -s "${graph}/slept" ]; }
waited_at_least() { [ "$(awk '{ total += $1 } END { print total + 0 }' "${graph}/slept" 2>/dev/null || echo 0)" -ge "$1" ]; }

finish() {
  check "never logs the rest of the list" quiet_about_others
  if [ "${case_failures}" -eq 0 ]; then
    echo "ok - ${current_case}"
  fi
}

# PRs as gh lists them: given numbers from this repository and from forks.
listed() {
  jq -cn --argjson own "$1" --argjson forks "${2:-[]}" \
    '[($own[] | {number: ., isCrossRepository: false}), ($forks[] | {number: ., isCrossRepository: true})]'
}

pr1="$(pr '[1]')"
pr2="$(pr '[2]')"
pr3="$(pr '[3]')"

start "adds both callbacks and waits for the change to hold"
given state '$others'
run_sync OPEN_PRS='[1]'
check "succeeds" status_is 0
check "reports the change" output_has "CHANGED"
check "keeps the other URIs and adds the callbacks" state_is "\$others + ${pr1}"
check "updates once" count_is patches 1
check "watches for the whole settle time" waited_at_least 90
check "logs the callbacks it adds" output_has "Adding: https://appreg-frontend-pr-1.dev.platform.hmcts.net/sso/login-callback"
finish

start "leaves a list that already has the callbacks alone"
given state "\$others + ${pr1}"
run_sync OPEN_PRS='[1]'
check "succeeds" status_is 0
check "reports no change" output_has "NO_CHANGES"
check "does not update" count_is patches 0
check "reads once" count_is gets 1
check "does not wait" never_slept
finish

start "treats a missing list as empty"
echo null >"${graph}/state"
run_sync OPEN_PRS='[1]'
check "succeeds" status_is 0
check "registers the callbacks" state_is "${pr1}"
finish

start "reads a pretty-printed list"
jq -n --argjson others "${others}" '$others' >"${graph}/state"
run_sync OPEN_PRS='[1]'
check "succeeds" status_is 0
check "registers the callbacks" state_is "\$others + ${pr1}"
finish

start "applies the callbacks again when another run drops them"
given state '$others'
# Another PR's run read the list before this run's update and wrote it back.
given after-patch-1 "\$others + ${pr2}"
run_sync OPEN_PRS='[1]'
check "succeeds" status_is 0
check "keeps both runs' callbacks" state_is "\$others + ${pr2} + ${pr1}"
check "updates twice" count_is patches 2
check "says why it updated again" output_has "another update has undone this one"
finish

start "applies the callbacks again when another run drops them late"
given state '$others'
# Reads 2 to 4 see the callbacks; then another run writes back an older list.
given after-get-4 "\$others + ${pr2}"
run_sync OPEN_PRS='[1]'
check "succeeds" status_is 0
check "keeps both runs' callbacks" state_is "\$others + ${pr2} + ${pr1}"
check "updates twice" count_is patches 2
finish

start "waits out a read that has not caught up with the update"
given state '$others'
given get-2 '$others'
run_sync OPEN_PRS='[1]'
check "succeeds" status_is 0
check "does not update again" count_is patches 1
check "says it is waiting" output_has "not visible yet"
finish

start "fails when the callbacks keep disappearing"
given state '$others'
for n in 1 2 3 4 5; do
  given "after-patch-${n}" '$others'
done
run_sync OPEN_PRS='[1]'
check "fails" status_is 1
check "stops after five updates" count_is patches 5
check "raises an error annotation" output_has "::error title=Preview sign-in callbacks::"
check "names the missing callbacks" output_has "Missing: https://appreg-frontend-pr-1.dev.platform.hmcts.net/sso/login-callback"
finish

start "honours MAX_WRITES"
given state '$others'
for n in 1 2; do
  given "after-patch-${n}" '$others'
done
run_sync OPEN_PRS='[1]' MAX_WRITES=2
check "fails" status_is 1
check "stops after two updates" count_is patches 2
finish

start "also registers other open PRs and removes recently closed ones"
given state "\$others + ${pr3}"
listed '[1,2]' '[5]' >"${graph}/gh-open"
listed '[3]' >"${graph}/gh-closed"
run_sync OPEN_PRS='[1]' REPOSITORY=hmcts/appreg-frontend
check "succeeds" status_is 0
check "registers open PRs, but not forks, and removes closed ones" state_is "\$others + ${pr1} + ${pr2}"
check "updates once" count_is patches 1
check "says how many other PRs it includes" output_has "Including 1 other open PRs and 1 PRs closed in the last day."
finish

start "keeps other open PRs when a stale update drops them"
given state '$others'
listed '[1,2]' >"${graph}/gh-open"
given after-patch-1 '$others'
run_sync OPEN_PRS='[1]' REPOSITORY=hmcts/appreg-frontend
check "succeeds" status_is 0
check "applies both PRs again" state_is "\$others + ${pr1} + ${pr2}"
check "updates twice" count_is patches 2
finish

start "lists PRs again before applying an update again"
given state '$others'
listed '[1]' >"${graph}/gh-open"
# PR 2 opens and its callbacks are dropped along with this run's.
given after-patch-1 '$others'
listed '[1,2]' >"${graph}/after-patch-1-gh-open"
run_sync OPEN_PRS='[1]' REPOSITORY=hmcts/appreg-frontend
check "succeeds" status_is 0
check "includes the PR that opened since" state_is "\$others + ${pr1} + ${pr2}"
check "updates twice" count_is patches 2
finish

start "does not wait for other PRs' callbacks"
given state '$others'
listed '[1,2]' >"${graph}/gh-open"
# Another run that has not seen PR 2 yet drops its callbacks, but not PR 1's.
given after-patch-1 "\$others + ${pr1}"
run_sync OPEN_PRS='[1]' REPOSITORY=hmcts/appreg-frontend
check "succeeds" status_is 0
check "leaves PR 2 to its own run" state_is "\$others + ${pr1}"
check "updates once" count_is patches 1
finish

start "repairs other PRs when its own callbacks are in place"
given state "\$others + ${pr1}"
listed '[1,2]' >"${graph}/gh-open"
run_sync OPEN_PRS='[1]' REPOSITORY=hmcts/appreg-frontend
check "succeeds" status_is 0
check "registers the other PR" state_is "\$others + ${pr1} + ${pr2}"
check "updates once" count_is patches 1
finish

start "removes its own PR even while GitHub still lists it as open"
given state "\$others + ${pr1} + ${pr2}"
listed '[1,2]' >"${graph}/gh-open"
run_sync CLOSED_PRS='[1]' REPOSITORY=hmcts/appreg-frontend
check "succeeds" status_is 0
check "removes only its own PR" state_is "\$others + ${pr2}"
finish

start "with no PRs of its own, updates once without waiting"
given state "\$others + ${pr3}"
listed '[2]' >"${graph}/gh-open"
listed '[3]' >"${graph}/gh-closed"
run_sync REPOSITORY=hmcts/appreg-frontend
check "succeeds" status_is 0
check "applies the other PRs" state_is "\$others + ${pr2}"
check "updates once" count_is patches 1
check "does not wait" never_slept
finish

start "carries on with its own PR when GitHub cannot list PRs"
given state '$others'
listed '[2]' >"${graph}/gh-open"
touch "${graph}/fail-gh"
run_sync OPEN_PRS='[1]' REPOSITORY=hmcts/appreg-frontend
check "succeeds" status_is 0
check "registers its own PR only" state_is "\$others + ${pr1}"
check "warns" output_has "::warning title=Preview sign-in callbacks::Could not list the PRs of hmcts/appreg-frontend"
finish

start "removes a closed PR's callbacks"
given state "\$others + ${pr1} + ${pr2}"
run_sync CLOSED_PRS='[1]'
check "succeeds" status_is 0
check "keeps everything else" state_is "\$others + ${pr2}"
check "logs the callbacks it removes" output_has "Removing: https://appreg-frontend-pr-1.dev.platform.hmcts.net/sso/login-callback"
check "watches for the whole settle time" waited_at_least 90
finish

start "removes the callbacks again when another run restores them"
given state "\$others + ${pr1}"
given after-patch-1 "\$others + ${pr1}"
run_sync CLOSED_PRS='[1]'
check "succeeds" status_is 0
check "removes them" state_is '$others'
check "updates twice" count_is patches 2
finish

start "reconciles several PRs in one update"
given state "\$others + ${pr3}"
run_sync OPEN_PRS='[2,1]' CLOSED_PRS='[3,4]'
check "succeeds" status_is 0
check "adds the open PRs' callbacks and removes the closed PR's" state_is "\$others + ${pr1} + ${pr2}"
check "updates once" count_is patches 1
finish

start "retries a failed read"
given state '$others'
touch "${graph}/fail-get-1"
run_sync OPEN_PRS='[1]'
check "succeeds" status_is 0
check "registers the callbacks" state_is "\$others + ${pr1}"
finish

start "fails after three failed reads"
given state '$others'
touch "${graph}/fail-get-1" "${graph}/fail-get-2" "${graph}/fail-get-3"
run_sync OPEN_PRS='[1]'
check "fails" status_is 1
check "does not update" count_is patches 0
finish

start "retries a failed update"
given state '$others'
touch "${graph}/fail-patch-1"
run_sync OPEN_PRS='[1]'
check "succeeds" status_is 0
check "registers the callbacks" state_is "\$others + ${pr1}"
check "updates twice" count_is patches 2
finish

start "fails without logging an unexpected Graph response"
echo '<html>keep.example.test</html>' >"${graph}/state"
run_sync OPEN_PRS='[1]'
check "fails" status_is 1
check "does not update" count_is patches 0
finish

start "rejects PR numbers that are not numbers"
given state '$others'
run_sync OPEN_PRS='["1"]'
check "fails" status_is 1
check "does not call Graph" count_is gets 0
finish

start "rejects a PR that is both open and closed"
given state '$others'
run_sync OPEN_PRS='[1,2]' CLOSED_PRS='[2]'
check "fails" status_is 1
check "does not call Graph" count_is gets 0
finish

start "requires the object ID"
given state '$others'
OBJECT_ID="" run_sync OPEN_PRS='[1]'
check "fails" status_is 1
check "does not call Graph" count_is gets 0
finish

if [ "${failures}" -gt 0 ]; then
  echo "${failures} check(s) failed"
  exit 1
fi
echo "All ${cases} cases passed"
