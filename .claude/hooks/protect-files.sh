#!/bin/sh
# PreToolUse (Edit|Write): refuses direct edits to secrets, the lockfile and
# generated files. Each has a proper way to change it, given in the reason.
file=$(jq -r '.tool_input.file_path // empty')

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
esac
