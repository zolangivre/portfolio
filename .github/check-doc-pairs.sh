#!/usr/bin/env bash
# Fails when a PR changes one language of a translated document but not the
# other. Pairs are found, not listed: every tracked `<name>.fr.md` goes with
# `<name>.md`. A change that is really one-sided (a fix to a French typo, a
# link only one version has) passes with a `Docs-Sync: skip` line in one of
# the PR's commit messages.
#
# Usage: check-doc-pairs.sh <base ref>, e.g. origin/staging
set -euo pipefail

base="$1"
changed="$(git diff --name-only "$base"...HEAD)"

if git log --format=%B "$base"..HEAD | grep -qiE '^Docs-Sync: *skip *$'; then
  echo "Docs-Sync: skip found in a commit message, not checking."
  exit 0
fi

missing=0
while IFS= read -r fr; do
  en="${fr%.fr.md}.md"
  fr_changed=0
  en_changed=0
  grep -qxF -- "$fr" <<<"$changed" && fr_changed=1
  grep -qxF -- "$en" <<<"$changed" && en_changed=1

  if [ "$fr_changed" != "$en_changed" ]; then
    if [ "$en_changed" = 1 ]; then
      echo "::error file=$en::$en changed but not $fr. Update both, or add 'Docs-Sync: skip' to a commit message."
    else
      echo "::error file=$fr::$fr changed but not $en. Update both, or add 'Docs-Sync: skip' to a commit message."
    fi
    missing=1
  fi
done < <(git ls-files '*.fr.md')

if [ "$missing" = 0 ]; then
  echo "Every translated document changed with its twin, or not at all."
fi
exit "$missing"
