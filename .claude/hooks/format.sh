#!/bin/sh
# PostToolUse (Edit|Write): lints, then formats, the file Claude just edited.
#
# - `eslint --fix` on code files: CI fails on lint errors, and catching them on
#   the edit costs a second instead of a round of /pre-pr. Errors left after
#   --fix go back to Claude (exit 2) so it fixes them; warnings pass.
# - Prettier with the repo's config. --ignore-unknown skips file types Prettier
#   has no parser for, and .prettierignore still applies
#   (src/migrations/index.ts stays in Payload's style).
#
# One hook, in this order: Claude Code runs a tool's hooks in parallel, and two
# of them rewriting the same file would race. Prettier runs last, so whatever
# --fix rewrote ends up formatted.
file=$(jq -r '.tool_input.file_path // empty')
[ -n "$file" ] && [ -f "$file" ] || exit 0

cd "$CLAUDE_PROJECT_DIR" || exit 0

lint_failed=0
case "$file" in
  "$CLAUDE_PROJECT_DIR"/*.ts | "$CLAUDE_PROJECT_DIR"/*.tsx | "$CLAUDE_PROJECT_DIR"/*.js | \
    "$CLAUDE_PROJECT_DIR"/*.mjs | "$CLAUDE_PROJECT_DIR"/*.cjs)
    # --no-warn-ignored: .next/, coverage/… are ignored by the config, quietly.
    pnpm exec eslint --fix --no-warn-ignored "$file" 1>&2 || lint_failed=1
    ;;
esac

pnpm exec prettier --write --ignore-unknown --log-level=warn "$file"

[ "$lint_failed" = 0 ] || exit 2
