#!/usr/bin/env bash
#
# Registers and removes the sign-in callbacks of PR preview environments on the
# AppReg app registration, then checks that Microsoft Graph keeps the change.
#
# Graph cannot add or remove a single redirect URI: every writer GETs
# web.redirectUris and PATCHes the whole list back. Its reads are eventually
# consistent, so a writer that reads soon after another's PATCH can write back
# the old list and drop the other's callbacks. That happened when several PRs
# opened within seconds of each other, and their sign-in tests then failed.
#
# Two things make this safe:
#   - With REPOSITORY set, every update also registers the callbacks of all of
#     the repository's open PRs and removes those of PRs closed in the last day,
#     as GitHub lists them just before the update. A stale read then cannot drop
#     another open PR's callbacks, however many runs overlap.
#   - After an update the script keeps re-reading the list for SETTLE_SECONDS.
#     If another run undid this run's own change (OPEN_PRS and CLOSED_PRS), it
#     applies it again, and it fails after MAX_WRITES updates that do not hold.
#     It does not wait for the other PRs, so two runs that briefly disagree
#     about a PR that has just opened or closed never fight over it.
#
# Environment:
#   OBJECT_ID       object ID of the app registration (required)
#   OPEN_PRS        JSON array of PR numbers whose callbacks must be registered
#   CLOSED_PRS      JSON array of PR numbers whose callbacks must not be
#   REPOSITORY      owner/name of the repository whose other PRs to include;
#                   needs gh and GH_TOKEN with pull-requests: read
#   SETTLE_SECONDS  how long a change must hold after a PATCH (default 90)
#   MAX_WRITES      updates to try before failing (default 5)
#
# Logs only callbacks it changes and the size of the list, never the list.

set -euo pipefail

OPEN_PRS="${OPEN_PRS:-[]}"
CLOSED_PRS="${CLOSED_PRS:-[]}"
SETTLE_SECONDS="${SETTLE_SECONDS:-90}"
MAX_WRITES="${MAX_WRITES:-5}"

# Seconds to wait between re-reads after a PATCH. The last one repeats.
DELAYS=(5 10 15 30)

fail() {
  echo "::error title=Preview sign-in callbacks::$*"
  exit 1
}

# Both sign-in callbacks of every PR number in a JSON array.
callbacks() {
  jq -c 'unique | [.[] | "https://appreg-frontend-pr-\(.).dev.platform.hmcts.net/sso/login-callback",
                         "https://appreg-frontend-pr-\(.).dev.platform.hmcts.net/sso/logout-callback"]' <<<"$1"
}

joined() {
  jq -r 'join(", ")' <<<"$1"
}

# Prints {"open": [...], "closed": [...]}: the numbers of the repository's open
# PRs and of those closed in the last day. PRs from forks get no preview.
list_prs() {
  local since open closed
  since="$(jq -rn 'now - 86400 | strftime("%Y-%m-%dT%H:%M:%SZ")')"
  open="$(gh pr list --repo "${REPOSITORY}" --state open --limit 200 \
    --json number,isCrossRepository)" || return 1
  closed="$(gh pr list --repo "${REPOSITORY}" --state closed --search "closed:>=${since}" --limit 200 \
    --json number,isCrossRepository)" || return 1
  jq -cn --argjson open "${open}" --argjson closed "${closed}" '
    def numbers: [.[] | select((.isCrossRepository | not) and (.number | type == "number")) | .number];
    {open: ($open | numbers), closed: ($closed | numbers)}'
}

# Sets all_wanted and all_unwanted to this run's callbacks plus those of the
# repository's other open and recently closed PRs. This run's own PRs win over
# what GitHub lists for them, which can lag. Keeps the previous lists if GitHub
# cannot list PRs.
include_other_prs() {
  local listed own other_open other_closed
  if [ -z "${REPOSITORY:-}" ]; then
    return 0
  fi
  if ! listed="$(list_prs)"; then
    echo "::warning title=Preview sign-in callbacks::Could not list the PRs of ${REPOSITORY}; updating only the callbacks already known."
    return 0
  fi
  own="$(jq -c --argjson closed "${CLOSED_PRS}" '. + $closed' <<<"${OPEN_PRS}")"
  other_open="$(jq -c --argjson own "${own}" '.open - $own' <<<"${listed}")"
  other_closed="$(jq -c --argjson own "${own}" '.closed - $own - .open' <<<"${listed}")"
  echo "Including $(jq length <<<"${other_open}") other open PRs and $(jq length <<<"${other_closed}") PRs closed in the last day."
  all_wanted="$(callbacks "$(jq -c --argjson other "${other_open}" '. + $other' <<<"${OPEN_PRS}")")"
  all_unwanted="$(callbacks "$(jq -c --argjson other "${other_closed}" '. + $other' <<<"${CLOSED_PRS}")")"
}

# Prints the current list as compact JSON, retrying failed requests.
read_uris() {
  local attempt raw
  for attempt in 1 2 3; do
    if raw="$(az rest --method GET --url "${APP_URL}" \
      --query "web.redirectUris" -o json --only-show-errors)"; then
      # An app with no web redirect URIs comes back as null or nothing.
      jq -ce 'if . == null then []
              elif type == "array" and all(.[]; type == "string") then .
              else error("not a list of redirect URIs") end' <<<"${raw:-null}" 2>/dev/null && return 0
      echo "Microsoft Graph returned something other than a list of redirect URIs." >&2
      return 1
    fi
    echo "Reading the redirect URIs failed (attempt ${attempt} of 3)." >&2
    if [ "${attempt}" -lt 3 ]; then
      sleep $((attempt * 5))
    fi
  done
  return 1
}

write_uris() {
  az rest --method PATCH --url "${APP_URL}" \
    --headers "Content-Type=application/json" \
    --body "$(jq -cn --argjson uris "$1" '{web: {redirectUris: $uris}}')" \
    -o none --only-show-errors
}

test -n "${OBJECT_ID:-}" || fail "Missing APPREG_OBJECT_ID"
for prs in "${OPEN_PRS}" "${CLOSED_PRS}"; do
  jq -e 'type == "array" and all(.[]; type == "number" and . > 0 and . == floor)' <<<"${prs}" >/dev/null 2>&1 ||
    fail "OPEN_PRS and CLOSED_PRS must be JSON arrays of PR numbers."
done
jq -e --argjson closed "${CLOSED_PRS}" '. - (. - $closed) == []' <<<"${OPEN_PRS}" >/dev/null ||
  fail "A PR cannot be in both OPEN_PRS and CLOSED_PRS."
for setting in SETTLE_SECONDS MAX_WRITES; do
  [[ "${!setting}" =~ ^[0-9]+$ ]] || fail "${setting} must be a whole number of seconds or updates."
done

APP_URL="https://graph.microsoft.com/v1.0/applications/${OBJECT_ID}"

# This run's own callbacks, which it waits for.
wanted="$(callbacks "${OPEN_PRS}")"
unwanted="$(callbacks "${CLOSED_PRS}")"
# Every callback an update applies, including other PRs'.
all_wanted="${wanted}"
all_unwanted="${unwanted}"
include_other_prs
own_change="$(jq -c --argjson unwanted "${unwanted}" '. + $unwanted | length > 0' <<<"${wanted}")"

writes=0 # updates tried
since=0  # seconds waited since the last update
step=0   # re-reads since the last update
misses=0 # re-reads in a row that found this run's change undone

while :; do
  current="$(read_uris)" || fail "Could not read the redirect URIs from Microsoft Graph."
  missing="$(jq -c --argjson wanted "${wanted}" '$wanted - .' <<<"${current}")"
  leftover="$(jq -c --argjson unwanted "${unwanted}" '[.[] | select(IN($unwanted[]))] | unique' <<<"${current}")"
  update=false

  if [ "${writes}" -eq 0 ]; then
    if [ "$(jq -c --argjson wanted "${all_wanted}" --argjson unwanted "${all_unwanted}" \
      '($wanted - .) + [.[] | select(IN($unwanted[]))]' <<<"${current}")" = "[]" ]; then
      echo "NO_CHANGES"
      exit 0
    fi
    update=true
  elif [ "${missing}" = "[]" ] && [ "${leftover}" = "[]" ]; then
    misses=0
    if [ "${since}" -ge "${SETTLE_SECONDS}" ]; then
      echo "The change has held for ${since}s."
      echo "CHANGED"
      exit 0
    fi
    echo "After ${since}s: in place."
  else
    misses=$((misses + 1))
    # One read can come from a replica that has not caught up with the PATCH
    # yet. Two in a row mean another writer has undone it.
    if [ "${misses}" -lt 2 ]; then
      echo "After ${since}s: not visible yet."
    else
      if [ "${writes}" -ge "${MAX_WRITES}" ]; then
        fail "The redirect URIs did not settle after ${writes} updates." \
          "Missing: $(joined "${missing}")." \
          "Still registered: $(joined "${leftover}")." \
          "Re-run this job."
      fi
      echo "After ${since}s: another update has undone this one. Applying it again."
      # PRs may have opened or closed since the last update. List them again,
      # and read the list again just before writing it.
      include_other_prs
      current="$(read_uris)" || fail "Could not read the redirect URIs from Microsoft Graph."
      update=true
    fi
  fi

  if [ "${update}" = true ]; then
    adding="$(jq -c --argjson wanted "${all_wanted}" '$wanted - .' <<<"${current}")"
    removing="$(jq -c --argjson unwanted "${all_unwanted}" '[.[] | select(IN($unwanted[]))] | unique' <<<"${current}")"
    if [ "${adding}" != "[]" ]; then
      echo "Adding: $(joined "${adding}")"
    fi
    if [ "${removing}" != "[]" ]; then
      echo "Removing: $(joined "${removing}")"
    fi

    updated="$(jq -c --argjson wanted "${all_wanted}" --argjson unwanted "${all_unwanted}" \
      '(. - $unwanted) + ($wanted - .)' <<<"${current}")"
    writes=$((writes + 1))
    if write_uris "${updated}"; then
      echo "Update ${writes} of at most ${MAX_WRITES} sent; the list now has $(jq length <<<"${updated}") redirect URIs."
      if [ "${own_change}" = false ]; then
        # Only other PRs' callbacks changed, and this run does not wait for those.
        echo "CHANGED"
        exit 0
      fi
    elif [ "${own_change}" = false ]; then
      fail "Could not update the redirect URIs."
    else
      echo "Update ${writes} of at most ${MAX_WRITES} failed."
    fi
    since=0
    step=0
    misses=0
  fi

  delay="${DELAYS[$((step < ${#DELAYS[@]} ? step : ${#DELAYS[@]} - 1))]}"
  # Jitter keeps runs that started together from re-reading in lockstep.
  delay=$((delay + RANDOM % 4))
  sleep "${delay}"
  since=$((since + delay))
  step=$((step + 1))
done
