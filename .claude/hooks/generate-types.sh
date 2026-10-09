#!/bin/sh
# PostToolUse (Edit|Write): regenerates src/payload-types.ts after a schema
# edit, so the CI typecheck never runs against stale types. Only fires for
# files that feed the Payload config.
file=$(jq -r '.tool_input.file_path // empty')

case "$file" in
  */src/collections/* | */src/globals/* | */src/fields/* | */src/payload.config.ts) ;;
  *) exit 0 ;;
esac

cd "$CLAUDE_PROJECT_DIR" || exit 0
if ! out=$(pnpm generate:types 2>&1); then
  # Exit 2 feeds stderr back to Claude so it can fix the config.
  printf 'pnpm generate:types failed after editing %s:\n%s\n' "$file" "$out" | tail -40 >&2
  exit 2
fi
