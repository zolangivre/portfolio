#!/bin/bash
# Opens the sweep PR against staging, or updates its description if it's
# already open. The body always comes from .security/pr-body.md: the CI
# agent may not pass --body-file itself (it could point it at any file), so
# this is the only way it publishes a description.
set -euo pipefail

body=.security/pr-body.md
branch=chore/security-sweep
[ -s "$body" ] || { echo "$body is missing or empty" >&2; exit 1; }

if [ "$(gh pr view "$branch" --json state -q .state 2>/dev/null || true)" = "OPEN" ]; then
  gh pr edit "$branch" --body-file "$body"
else
  gh pr create --base staging --head "$branch" --title "fix(deps): security sweep" --body-file "$body"
fi
