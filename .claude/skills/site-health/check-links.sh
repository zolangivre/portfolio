#!/bin/bash
# Checks every page in the sitemap, and every external link stored in the
# published content (project GitHub and live URLs, CTAs, social links, résumé).
# Read-only: GET requests through the public site and API.
#
#   check-links.sh [site-url] [out-file]
#   defaults: https://www.zolangivre.com  plans/.health/links.tsv (gitignored)
#
# Output, one line per URL: kind  status  seconds  url
# status 000 means no answer (DNS, timeout, TLS). Some sites answer bots
# with an error whatever the link (LinkedIn: 999); the skill sorts those out.
set -euo pipefail

site=${1:-https://www.zolangivre.com}
out=${2:-plans/.health/links.tsv}
mkdir -p "$(dirname "$out")"
host=$(printf '%s' "$site" | sed -E 's#^https?://##; s#/.*##')

check() {
  local kind=$1 url=$2 result
  result=$(curl -sS -o /dev/null -L --max-time 20 -A 'Mozilla/5.0 (site-health)' \
    -w '%{http_code}\t%{time_total}' "$url" 2>/dev/null) || result=$'000\t0'
  printf '%s\t%s\t%s\n' "$kind" "$result" "$url"
}

pages=$(curl -fsS --max-time 20 "$site/sitemap.xml" | grep -o '<loc>[^<]*</loc>' | sed 's/<[^>]*>//g')

# Every http(s) string in the globals and public collections, minus this site.
external=$(
  for path in globals/hero globals/about globals/contact globals/footer globals/navigation globals/settings projects experiences education companies schools journal; do
    curl -fsS --max-time 20 "$site/api/$path?locale=all&depth=1&limit=200" || true
  done | grep -oE 'https?://[^"\\ ]+' | grep -v "://$host" | grep -v '://www.w3.org/' | sort -u
)

{
  for url in $pages; do check page "$url"; done
  for url in $external; do check external "$url"; done
} >"$out"

pages_n=$(grep -c '^page' "$out" || true)
external_n=$(grep -c '^external' "$out" || true)
bad=$(awk -F'\t' '$2 !~ /^(2|3)/' "$out" | wc -l | tr -d ' ')
echo "$pages_n pages · $external_n external links · $bad not answering 2xx/3xx → $out"
