#!/usr/bin/env bash
# Checks that the live site still has its content. A status code on the
# homepage isn't enough: the queries catch database errors and render an empty
# page with a 200, so during the October 2026 outage every page answered
# normally while the projects and the journal had gone. The API isn't cached
# and doesn't catch anything, so it's what tells a broken database apart.
#
# Exits non-zero and lists what failed. Reads only, needs no credentials.
#
# Usage: production-check.sh [site URL]
set -uo pipefail

site="${1:-https://www.zolangivre.com}"
failures=()

# Retried: a single slow answer (a Neon compute waking up, a cold function)
# isn't an outage.
fetch() {
  curl --silent --location --max-time 30 --retry 2 --retry-all-errors --retry-delay 20 \
    --write-out '\n%{http_code}' "$1"
}

# Prints the slug of the first published document of a collection.
first_slug() {
  local collection="$1" response status body total
  response="$(fetch "$site/api/$collection?limit=1&depth=0")"
  status="${response##*$'\n'}"
  body="${response%$'\n'*}"

  if [ "$status" != 200 ]; then
    failures+=("/api/$collection answered $status")
    return
  fi

  total="$(jq -r '.totalDocs // 0' <<<"$body" 2>/dev/null || echo 0)"
  if [ "$total" -lt 1 ]; then
    failures+=("/api/$collection has no published document")
    return
  fi

  jq -r '.docs[0].slug' <<<"$body"
}

check_page() {
  local status
  status="$(fetch "$site$1" | tail -n 1)"
  [ "$status" = 200 ] || failures+=("$1 answered $status")
}

check_page /fr
check_page /en

# Called in the main shell, not in $(...): a failure has to reach `failures`.
tmp="$(mktemp)"
for collection in projects journal; do
  first_slug "$collection" >"$tmp"
  slug="$(cat "$tmp")"
  [ -n "$slug" ] && check_page "/fr/$collection/$slug"
done
rm -f "$tmp"

if [ "${#failures[@]}" -gt 0 ]; then
  printf 'Production check failed on %s:\n' "$site"
  printf -- '- %s\n' "${failures[@]}"
  exit 1
fi

echo "Production check passed on $site."
