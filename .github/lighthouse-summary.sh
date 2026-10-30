#!/usr/bin/env bash
# Turns a Lighthouse CI run into something visible: lhci prints a missed budget
# in the log and still exits 0, since every budget only warns. Writes the scores
# to the run's Summary, and one annotation per missed budget.
#
# Reads what `pnpm lighthouse` leaves behind. Usage: lighthouse-summary.sh
set -euo pipefail

manifest=lighthouse-report/manifest.json
assertions=.lighthouseci/assertion-results.json
summary="${GITHUB_STEP_SUMMARY:-/dev/stdout}"

if [ ! -f "$manifest" ]; then
  echo "::warning::No Lighthouse report: the run didn't finish."
  exit 0
fi

{
  echo '| Page | Performance | Accessibility | Best practices | SEO |'
  echo '| ---- | ----------- | ------------- | -------------- | --- |'
  jq -r '.[] | select(.isRepresentativeRun)
    | "| \(.url | sub("^https?://[^/]+"; "")) | \(.summary.performance) | \(.summary.accessibility) | \(.summary["best-practices"]) | \(.summary.seo) |"' "$manifest"
} >> "$summary"

[ -f "$assertions" ] || exit 0

jq -r '.[] | select(.passed | not)
  | "::warning title=Lighthouse budget::\(.auditId)\(if .auditProperty then ":\(.auditProperty)" else "" end) on \(.url | sub("^https?://[^/]+"; "")): \(.actual) (expected \(.operator) \(.expected))"' "$assertions"
