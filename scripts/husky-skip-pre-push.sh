#!/bin/sh

# Script that is run in .husky/pre-push which skips the tests/build that wouldn't be affected
# by the changes made in commits that have not been pushed yet

UPSTREAM_REF=$(git rev-parse --abbrev-ref --symbolic-full-name '@{upstream}' 2>/dev/null)

# If remote doesn't exist, run full suite
if [ -z "$UPSTREAM_REF" ]; then
    exit 1
fi

CHANGED_FILES=$(git --no-pager diff --name-only "$UPSTREAM_REF"...HEAD)

# Skip suite only when all changed files are under cypress/
if [ -n "$CHANGED_FILES" ] && ! printf '%s\n' "$CHANGED_FILES" | grep -qv '^cypress/'; then
    exit 0
fi

exit 1
