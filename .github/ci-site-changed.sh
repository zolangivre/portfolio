#!/usr/bin/env bash
# Decides whether a pull request needs the integration and e2e tests, the two
# slow jobs of ci.yml. Writes `site=true|false` to $GITHUB_OUTPUT.
#
# Lists what is safe to skip, not what is risky: the tests are skipped only
# when every changed file is one that can't change the site (docs, Markdown,
# Claude Code config, GitHub config other than CI itself). Anything else —
# src/, tests/, package.json, the lockfile, a config file, a migration, a file
# nobody thought of — runs everything.
#
# Usage: ci-site-changed.sh <base ref>, e.g. origin/staging
set -euo pipefail

base="$1"
out="${GITHUB_OUTPUT:-/dev/stdout}"
summary="${GITHUB_STEP_SUMMARY:-/dev/stderr}"

decide() {
  echo "site=$1" >> "$out"
  echo "$2" >> "$summary"
  exit 0
}

changed="$(git diff --name-only "$base"...HEAD)"
[ -n "$changed" ] || decide true "No changed files found: running every test."

while IFS= read -r file; do
  case "$file" in
    # CI itself, and this script: a change here must prove itself.
    .github/workflows/ci.yml | .github/ci-site-changed.sh)
      decide true "\`$file\` changed: running every test." ;;
    docs/* | *.md | .claude/* | .github/* | .githooks/*) ;;
    *)
      decide true "\`$file\` can affect the site or its tests: running every test." ;;
  esac
done <<< "$changed"

decide false "Only docs, Markdown, Claude Code or GitHub config changed: integration and e2e tests skipped. They run again on the push to the base branch after the merge."
