#!/bin/bash
# Fetches the published content of the site through Payload's public REST API,
# both locales at once (`locale=all`), and flattens every localized field into
# one fr/en pair per line, rich text reduced to plain text. Read-only: the API
# only serves what a visitor can see, so private projects and media are left out.
#
#   fetch-content.sh [site-url] [out-dir]
#   defaults: https://www.zolangivre.com  plans/.content-audit (gitignored)
#
# Writes <out-dir>/raw/<kind>-<slug>.json and <out-dir>/pairs.json:
#   [{ "source": "globals/hero", "path": "description", "fr": "…", "en": "…" }, …]
set -euo pipefail

site=${1:-https://www.zolangivre.com}
out=${2:-plans/.content-audit}
[[ $site =~ ^https://[A-Za-z0-9.-]+(:[0-9]+)?$ ]] || { echo "invalid site URL: $site" >&2; exit 1; }
mkdir -p "$out/raw"

globals=(hero about contact footer navigation sections-content settings)
collections=(projects experiences education skills technologies companies schools categories testimonials journal)

fetch() {
  curl -fsS --max-time 30 --proto '=https' --url "$site/api/$1?locale=all&depth=0&limit=200" >"$out/raw/$2.json"
}

for slug in "${globals[@]}"; do fetch "globals/$slug" "globals-$slug"; done
for slug in "${collections[@]}"; do fetch "$slug" "collections-$slug"; done

# A localized field comes back as {"fr": …, "en": …}. Rich text (Lexical) is
# reduced to its text, one paragraph per line and one list item per "- "
# line. A localized array of blocks (About's point groups) becomes each
# block's title followed by its content.
jq -s '
  def nodetext: [.. | .text? | strings] | join("");
  def plain:
    if type == "object" and has("root") then
      [.root.children[]?
        | if .type == "list" then ([.children[]? | "- " + nodetext] | join("\n"))
          else nodetext end]
      | join("\n")
    elif type == "array" then
      [.[] | if type == "object" then
          ([(.title // empty), ((.content // .text // empty) | plain)] | join("\n"))
        else tostring end]
      | join("\n\n")
    elif type == "string" or type == "null" then .
    else tojson end;
  def doclabel($doc):
    ($doc.slug // $doc.name // $doc.title.fr // $doc.title // $doc.id // "") | tostring;
  [ .[] as $file
    | $file.json as $json
    | ($json.docs // [$json])[] as $doc
    | $doc
    | paths(type == "object" and (has("fr") or has("en")) and ((keys - ["fr", "en"]) | length == 0)) as $p
    | ($doc | getpath($p)) as $v
    | {
        source: ($file.name + (if $json.docs then "/" + doclabel($doc) else "" end)),
        path: ($p | map(tostring) | join(".")),
        fr: ($v.fr | plain),
        en: ($v.en | plain)
      }
  ]
' < <(for f in "$out"/raw/*.json; do
  name=$(basename "$f" .json)
  jq -c --arg name "${name/-//}" '{name: $name, json: .}' "$f"
done) >"$out/pairs.json"

total=$(jq length "$out/pairs.json")
one=$(jq '[.[] | select(((.fr // "") == "") != ((.en // "") == ""))] | length' "$out/pairs.json")
none=$(jq '[.[] | select((.fr // "") == "" and (.en // "") == "")] | length' "$out/pairs.json")
same=$(jq '[.[] | select((.fr // "") != "" and .fr == .en)] | length' "$out/pairs.json")
echo "$total localized fields · $one filled in one locale only · $none empty in both · $same identical in fr and en"
