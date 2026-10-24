#!/bin/sh
# PreToolUse (Edit|Write): refuses direct edits to secrets, the lockfile,
# generated files and what release-please owns. Each has a proper way to
# change it, given in the reason.
input=$(cat)
file=$(printf '%s' "$input" | jq -r '.tool_input.file_path // empty')

deny() {
  jq -n --arg reason "$1" '{
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: $reason
    }
  }'
  exit 0
}

case "$file" in
  */.env.example) ;;
  */.env | */.env.*)
    deny "Les fichiers .env contiennent des secrets : demande à Zolan de les modifier lui-même." ;;
  */pnpm-lock.yaml)
    deny "pnpm-lock.yaml est généré : passe par pnpm add / pnpm remove / pnpm install." ;;
  */src/payload-types.ts)
    deny "src/payload-types.ts est généré : modifie le schéma puis lance pnpm generate:types." ;;
  */src/app/\(payload\)/admin/importMap.js)
    deny "importMap.js est généré : lance pnpm generate:importmap." ;;
  */CHANGELOG.md | */.release-please-manifest.json)
    deny "Géré par release-please à partir des messages de commit (Conventional Commits) : écris le bon type de commit." ;;
  */package.json)
    # Only the version field: release-please bumps it in its version PR.
    if printf '%s' "$input" | jq -e '
        [.tool_input.old_string, .tool_input.new_string] | map(select(. != null))
        | join("\n") | test("\"version\"\\s*:")' >/dev/null; then
      deny "Le champ version de package.json est géré par release-please."
    fi
    new=$(printf '%s' "$input" | jq -r '.tool_input.content // empty' | jq -r '.version // empty' 2>/dev/null)
    if [ -n "$new" ] && [ -f "$file" ] && [ "$new" != "$(jq -r '.version' "$file")" ]; then
      deny "Le champ version de package.json est géré par release-please."
    fi ;;
esac
