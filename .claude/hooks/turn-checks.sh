#!/bin/sh
# Checks on what Claude edited during a turn, run when it tries to stop.
#
#   turn-checks.sh record  (PostToolUse Edit|Write): notes the edited file.
#   turn-checks.sh stop    (Stop): runs the checks below on the noted files.
#
# 1. Related tests: `vitest related` on the unit and dom projects, for the
#    source files edited (fast: no database). The full suites stay with
#    /pre-pr and CI.
# 2. The agent guide: a change under .claude/ (skills, agents, hooks,
#    settings) usually changes what docs/ai/ describes. If no file there was
#    touched in the same turn, Claude is asked to check them.
#
# A failure on the first stop sends Claude back to work (exit 2). On the
# second (`stop_hook_active`), it's only reported: no loop. The list is
# cleared either way.
#
# Off for a session: CLAUDE_TURN_CHECKS=off in the `env` of
# .claude/settings.local.json.
mode=$1
input=$(cat)
[ "${CLAUDE_TURN_CHECKS:-}" = "off" ] && exit 0
repo=$(cd "$CLAUDE_PROJECT_DIR" && pwd -P) || exit 0
session=$(printf '%s' "$input" | jq -r '.session_id // "default"')
# The id ends up in a file name: keep it to safe characters.
case "$session" in "" | *[!A-Za-z0-9_-]*) session=default ;; esac
# A private directory of this user's (macOS's TMPDIR already is); never a
# symlink someone else planted.
state="${TMPDIR:-/tmp}/payload-portfolio-claude-$(id -u)"
[ -L "$state" ] && exit 0
mkdir -p -m 700 "$state" 2>/dev/null
[ -d "$state" ] && [ -O "$state" ] || exit 0
list="$state/turn-$session.txt"
# Created at the turn's first edit: a guide newer than it was changed this
# turn, even through a shell command the record step never sees.
start="$state/turn-$session.start"

case "$mode" in
  record)
    f=$(printf '%s' "$input" | jq -r '.tool_input.file_path // empty')
    case "$f" in
      "$repo"/* | "$CLAUDE_PROJECT_DIR"/*) ;;
      *) exit 0 ;;
    esac
    [ -e "$start" ] || touch "$start"
    grep -qxF "$f" "$list" 2>/dev/null || printf '%s\n' "$f" >>"$list"
    ;;

  stop)
    [ -s "$list" ] || exit 0
    files=$(cat "$list")
    rm -f "$list"
    # Read the marker below, then drop it with the list.
    trap 'rm -f "$start"' EXIT
    second=$(printf '%s' "$input" | jq -r '.stop_hook_active // false')
    problems=""

    # 1. Related tests. No globbing: `[locale]` in a path is a pattern to sh.
    set -f
    set --
    for f in $files; do
      case "$f" in
        */src/*.ts | */src/*.tsx | */tests/unit/*.ts | */tests/dom/*.tsx) [ -f "$f" ] && set -- "$@" "$f" ;;
      esac
    done
    if [ $# -gt 0 ]; then
      cd "$CLAUDE_PROJECT_DIR" || exit 0
      if ! out=$(pnpm exec vitest related --run --project unit --project dom \
        --reporter=dot --passWithNoTests "$@" 2>&1); then
        problems="Tests related to the edited files fail (vitest related, unit + dom). Fix them before stopping:
$(printf '%s\n' "$out" | tail -n 40)"
      fi
    fi

    # 2. The agent guide.
    config=$(printf '%s\n' "$files" | grep -E '/\.claude/(skills|agents|hooks)/|/\.claude/settings\.json$' | grep -v '/\.claude/skills/payload/')
    guide=$(printf '%s\n' "$files" | grep -E '/docs/ai/[^/]+\.md$')
    # Globbing is off since step 1 (set -f): back on for this one pattern.
    set +f
    for doc in "$CLAUDE_PROJECT_DIR"/docs/ai/*.md; do
      [ -e "$start" ] && [ "$doc" -nt "$start" ] && guide=yes
    done
    if [ -n "$config" ] && [ -z "$guide" ]; then
      problems="${problems:+$problems

}The Claude setup changed this turn:
$(printf '%s\n' "$config" | sed "s#^$CLAUDE_PROJECT_DIR/#  #")
If that changes what someone can run or what happens on its own, update the matching page in docs/ai/ (skills.md, subagents.md, hooks-and-settings.md, github-agents.md or README.md) and its .fr.md twin together (CI fails a PR that changes one only). If it doesn't, say so and stop."
    fi

    [ -n "$problems" ] || exit 0
    if [ "$second" = "true" ]; then
      jq -n --arg m "Turn checks still failing: $(printf '%s' "$problems" | head -n 1)" '{systemMessage: $m}'
      exit 0
    fi
    printf '%s\n' "$problems" >&2
    exit 2
    ;;
esac
exit 0
