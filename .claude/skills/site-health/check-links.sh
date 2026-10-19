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
[[ $site =~ ^https://[A-Za-z0-9.-]+(:[0-9]+)?$ ]] || { echo "invalid site URL: $site" >&2; exit 1; }
mkdir -p "$(dirname "$out")"
host=${site#https://}

# URLs come from the sitemap and from content: only well-formed http(s)
# ones go further, and curl gets them through --url, restricted to
# http(s) even across redirects, so none can act as an option or a file:// read.
# Hosts that can only be local are dropped too (IP literals, localhost,
# .local, .internal): a link in the content must not make this script probe
# the machine or network it runs on.
urls() {
  grep -E '^https?://[A-Za-z0-9._~:/?#@!$&()*+,;=%-]+$' |
    grep -vEi '^https?://([^/@]*@)?(\[|[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+([:/]|$)|localhost([:/]|$)|[^/]*\.(local|internal|localhost)([:/]|$))' || true
}

check() {
  local kind=$1 url=$2 result
  result=$(curl -sS -o /dev/null -L --max-time 20 -A 'Mozilla/5.0 (site-health)' \
    --proto '=http,https' --proto-redir '=http,https' \
    -w '%{http_code}\t%{time_total}' --url "$url" 2>/dev/null) || result=$'000\t0'
  printf '%s\t%s\t%s\n' "$kind" "$result" "$url"
}

pages=$(curl -fsS --max-time 20 --proto '=https' --url "$site/sitemap.xml" | grep -o '<loc>[^<]*</loc>' | sed 's/<[^>]*>//g' | urls)

# Every http(s) string in the globals and public collections, minus this site.
external=$(
  for path in globals/hero globals/about globals/contact globals/footer globals/navigation globals/settings projects experiences education companies schools journal; do
    curl -fsS --max-time 20 --proto '=https' --url "$site/api/$path?locale=all&depth=1&limit=200" || true
  done | grep -oE 'https?://[^"\\[:space:]]+' | grep -vF "://$host" | grep -v '://www.w3.org/' | urls | sort -u
)

{
  while IFS= read -r url; do [ -n "$url" ] && check page "$url"; done <<<"$pages"
  while IFS= read -r url; do [ -n "$url" ] && check external "$url"; done <<<"$external"
} >"$out"

pages_n=$(grep -c '^page' "$out" || true)
external_n=$(grep -c '^external' "$out" || true)
bad=$(awk -F'\t' '$2 !~ /^(2|3)/' "$out" | wc -l | tr -d ' ')
echo "$pages_n pages · $external_n external links · $bad not answering 2xx/3xx → $out"
