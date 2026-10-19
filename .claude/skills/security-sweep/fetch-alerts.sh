#!/bin/bash
# Collects what /security-sweep works on into one directory, so the agent
# reads files instead of holding a token that can read security alerts.
#
#   fetch-alerts.sh <out-dir>    (default: .security)
#
# Env:
#   ALERTS_TOKEN  token allowed to read Dependabot and code scanning alerts.
#                 GITHUB_TOKEN can't read Dependabot alerts, so CI passes a
#                 fine-grained PAT here. Unset locally: the gh login is used.
#   GH_TOKEN      used for pull requests (CI: the workflow's GITHUB_TOKEN).
#
# Prints a summary, and when run in Actions writes `total` and `fingerprint`
# to $GITHUB_OUTPUT. The fingerprint changes only when the set of open alerts
# or the head of a red Dependabot PR changes: that's what "something new" means.
#
# Any failed call fails the script (pipefail): a fetch that breaks must not
# read as "no open alerts".
set -euo pipefail

out=${1:-.security}
mkdir -p "$out"

alerts_gh() {
  if [ -n "${ALERTS_TOKEN:-}" ]; then
    GH_TOKEN=$ALERTS_TOKEN gh "$@"
  else
    gh "$@"
  fi
}

# Free text (advisory summaries, rule descriptions, PR titles) is written by
# third parties and read by an agent: it's cut short, and the skill treats
# these files as data, never as instructions.
alerts_gh api --paginate 'repos/{owner}/{repo}/dependabot/alerts?state=open&per_page=100' \
  --jq '.[] | {
    number,
    severity: .security_advisory.severity,
    ghsa: .security_advisory.ghsa_id,
    summary: (.security_advisory.summary // "" | .[0:200]),
    package: .dependency.package.name,
    scope: .dependency.scope,
    relationship: .dependency.relationship,
    vulnerable: .security_vulnerability.vulnerable_version_range,
    patched: .security_vulnerability.first_patched_version.identifier,
    url: .html_url
  }' >"$out/.dependabot.raw"
jq -s . <"$out/.dependabot.raw" >"$out/dependabot-alerts.json"

alerts_gh api --paginate 'repos/{owner}/{repo}/code-scanning/alerts?state=open&per_page=100' \
  --jq '.[] | {
    number,
    rule: .rule.id,
    severity: (.rule.security_severity_level // .rule.severity),
    description: (.rule.description // "" | .[0:200]),
    tool: .tool.name,
    path: .most_recent_instance.location.path,
    line: .most_recent_instance.location.start_line,
    message: (.most_recent_instance.message.text // "" | .[0:300]),
    url: .html_url
  }' >"$out/.code-scanning.raw"
jq -s . <"$out/.code-scanning.raw" >"$out/code-scanning-alerts.json"

# Open Dependabot PRs with at least one failed check. Pending checks don't
# count: CI hasn't had its say yet.
gh pr list --author app/dependabot --state open \
  --json number,title,headRefName,headRefOid,url,statusCheckRollup \
  --jq '[.[] | {
    number, url,
    title: (.title | .[0:120]),
    branch: .headRefName,
    head: .headRefOid,
    failing: [.statusCheckRollup[]?
      | select(.conclusion == "FAILURE" or .conclusion == "TIMED_OUT")
      | .name]
  } | select(.failing | length > 0)]' >"$out/dependabot-prs.json"

rm -f "$out"/.*.raw

dependabot=$(jq length "$out/dependabot-alerts.json")
code_scanning=$(jq length "$out/code-scanning-alerts.json")
prs=$(jq length "$out/dependabot-prs.json")
total=$((dependabot + code_scanning + prs))

fingerprint=$(
  {
    jq -r '.[] | "d\(.number)"' "$out/dependabot-alerts.json"
    jq -r '.[] | "c\(.number)"' "$out/code-scanning-alerts.json"
    jq -r '.[] | "p\(.number)@\(.head)"' "$out/dependabot-prs.json"
  } | sort | shasum -a 256 | cut -c1-16
)

echo "Dependabot alerts: $dependabot · code scanning alerts: $code_scanning · red Dependabot PRs: $prs"

if [ -n "${GITHUB_OUTPUT:-}" ]; then
  echo "total=$total" >>"$GITHUB_OUTPUT"
  echo "fingerprint=$fingerprint" >>"$GITHUB_OUTPUT"
fi
