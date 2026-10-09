#!/bin/sh
# PostToolUse (Edit|Write): formats the edited file with the repo's Prettier
# config. --ignore-unknown skips file types Prettier has no parser for, and
# .prettierignore still applies (src/migrations/index.ts stays in Payload's style).
file=$(jq -r '.tool_input.file_path // empty')
[ -n "$file" ] && [ -f "$file" ] || exit 0

cd "$CLAUDE_PROJECT_DIR" || exit 0
pnpm exec prettier --write --ignore-unknown --log-level=warn "$file"
