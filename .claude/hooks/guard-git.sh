#!/bin/bash
# PreToolUse (Bash): refuses the git / gh commands that step outside the
# branch → PR → CI → human merge loop. Messages are in French, like
# protect-files.sh.
#
#   git push           to main or staging, without a named branch, forced
#                      (--force, -f, +refspec), --all / --mirror.
#                      --force-with-lease is allowed: after rebasing a work
#                      branch.
#   gh pr merge        merging stays with Zolan; so does gh api on …/merge,
#                      …/merges and merge-upstream, and a gh api write to
#                      git/refs (moving a branch without a PR).
#   git commit -n      --no-verify skips the commit-msg hook.
#   git reset --hard   loses uncommitted work; so do git clean -f,
#   git clean -f       git checkout -f / -- . / *, git restore . and
#                      git switch --discard-changes.
#   pnpm version       release-please owns the version (same for npm, yarn).
#
# GitHub's `staging and main` ruleset already requires a PR and a green CI,
# but Repository admin is on its bypass list, and Claude's `gh` runs with
# Zolan's admin token: `gh pr merge --admin` or a direct push would go
# through. This hook is the barrier for Claude.
#
# Wrappers are seen through (env, sudo -u x, timeout -s KILL 30, xargs -n 1,
# npx, pnpm --filter x exec, bash -c "…"), and the command is read twice: split
# everywhere, and split with its quoted strings set aside (see `segments`).
#
# It guards against mistakes, not against a deliberate workaround: the shell
# isn't really parsed (aliases, variables and functions get through), and
# `git -c core.hooksPath=…`, GIT_* variables, `gh api` on git/refs and edits
# to this script aren't covered. Git accepts abbreviated long options (--har
# for --hard), so options are compared by prefix.
#
# Ported from memmi (memmi-front/.claude/hooks/guard-git.sh): a fix to the
# parsing there likely applies here too.

block() {
  echo "Bloqué (guard-git) : $1" >&2
  exit 2
}

# Sans jq ou sur une entrée illisible, on bloque plutôt que de tout laisser passer.
command -v jq >/dev/null || block "jq est introuvable, le garde-fou ne peut pas lire la commande."
cmd="$(jq -r '.tool_input.command // empty')" || block "entrée du hook illisible."
[ -n "$cmd" ] || exit 0

# Le corps des heredocs (messages de commit, corps de PR) est du texte, pas des
# commandes : on le retire avant l'analyse. Sinon un « `gh pr merge` » cité
# dans une description de PR bloquerait sa création. Si la balise de fin
# n'arrive jamais (un « <<EOF » cité dans une chaîne, par exemple), ce n'était
# pas un heredoc : les lignes mises de côté sont rendues à l'analyse.
cmd="$(printf '%s\n' "$cmd" | awk '
  end != "" {
    held = held $0 "\n"
    line = $0; if (strip) sub(/^\t+/, "", line)
    if (line == end) { end = ""; held = "" }
    next
  }
  # A « <<EOF » inside a quoted string is text, not a heredoc: look for the
  # opener on a copy of the line without its quoted strings (the quotes of
  # the tag itself, <<'EOF', are dropped first so the tag survives).
  {
    print
    q0 = $0
    while (match(q0, /<<-?[ \t]*["\047][A-Za-z_][A-Za-z0-9_]*["\047]/)) {
      t = substr(q0, RSTART, RLENGTH); gsub(/["\047]/, "", t)
      q0 = substr(q0, 1, RSTART - 1) t substr(q0, RSTART + RLENGTH)
    }
    gsub(/"[^"]*"/, "", q0); gsub(/\047[^\047]*\047/, "", q0)
  }
  match(q0, /(^|[^<])<<-?[ \t]*[A-Za-z_][A-Za-z0-9_]*/) {
    tag = substr(q0, RSTART, RLENGTH)
    sub(/^[^<]/, "", tag)
    pstrip = (tag ~ /^<<-/)
    gsub(/^<<-?[ \t]*["\047]?|["\047]$/, "", tag)
    pend = tag
  }
  # Le texte du heredoc commence seulement à la fin de la commande : si sa
  # ligne est coupée par un « \ » impair, la suite fait encore partie de la
  # commande (`cat <<EOF \` puis `&& git push …`) et reste analysée.
  pend != "" {
    n = 0; s = $0
    while (s ~ /\\$/) { sub(/\\$/, "", s); n++ }
    if (n % 2 == 0) { end = pend; strip = pstrip; pend = "" }
  }
  END { if (end != "") printf "%s", held }')"

# Lignes de commande coupées par « \ » en fin de ligne : on les recolle, sinon
# `gh pr \` puis `merge 12` à la ligne suivante passeraient pour deux commandes.
# Après le retrait des heredocs, dont le texte peut finir par « \ » sans rien
# couper. Seul un nombre impair d'antislashs finaux coupe la ligne (`\\` est un
# antislash échappé), et jamais dans un commentaire : bash ne prolonge pas un
# commentaire, la ligne suivante est bien une commande. Une chaîne entre
# guillemets ouverte en fin de ligne continue elle aussi la commande
# (`git commit -m "titre` puis `corps" --no-verify`) : on recolle avec une
# espace. L'état des guillemets se suit caractère par caractère, comme bash :
# une apostrophe dans "c'est" ne ferme rien, et `\` n'échappe rien entre '…'.
cmd="$(printf '%s\n' "$cmd" | awk '
{
  line = $0; L = length(line); out = ""; cont = 0; i = 1
  while (i <= L) {
    c = substr(line, i, 1)
    if (q == "s") { if (c == "\047") q = ""; out = out c; i++; continue }
    if (c == "\\") {
      if (i == L) { cont = 1; i++; continue }
      out = out c substr(line, i + 1, 1); i += 2; continue
    }
    if (q == "d") { if (c == "\"") q = ""; out = out c; i++; continue }
    if (c == "#" && (i == 1 || substr(line, i - 1, 1) ~ /[ \t;&|(]/)) { out = out substr(line, i); break }
    if (c == "\047") q = "s"; else if (c == "\"") q = "d"
    out = out c; i++
  }
  buf = buf out
  if (cont) next
  if (q != "") { buf = buf " "; next }
  print buf; buf = ""
}
END { if (buf != "") print buf }')"

# Mutation GraphQL de merge : ses accolades la couperaient en plusieurs segments,
# on la cherche donc dans la commande entière.
case "$cmd" in
  *mergePullRequest* | *mergeBranch*)
    printf '%s\n' "$cmd" | grep -qE '(^|[^[:alnum:]_.-])gh[[:space:]]+api' &&
      block "merge par l'API GitHub : le merge reste à l'utilisateur."
    ;;
esac

# Une ligne par commande simple : les séparateurs du shell (dont `&` de fond)
# deviennent des sauts de ligne.
split_segments() { awk '{ gsub(/&&|\|\||;|\||&|\$\(|`|\(|\)|\{|\}/, "\n") } 1'; }
# Two readings, each checked: the first splits everywhere, quotes included, so
# what runs inside `bash -c "… && git push …"` is seen; the second replaces
# every quoted string with a token first, so a separator inside a quoted
# argument (`git push origin "x;y" main`, `git commit -m "a; b" --no-verify`)
# can't cut the real command short and hide its tail.
segments="$(printf '%s\n' "$cmd" | split_segments)
$(printf '%s\n' "$cmd" | sed -E "s/\"[^\"]*\"/Q/g; s/'[^']*'/Q/g" | split_segments)"

check_push() {
  local force=0 skip=0 t r dst
  local pos=()
  for t in "$@"; do
    t="${t//\"/}"
    t="${t//\'/}"
    if [ "$skip" = 1 ]; then skip=0; continue; fi
    case "$t" in
      --force-with-lease* | --force-if-includes) ;;
      --fo*) force=1 ;;
      --al | --all | --mi*) block "git push $t pousse toutes les branches, main et staging comprises." ;;
      -o | --push-option | --repo | --receive-pack | --exec) skip=1 ;;
      --*) ;;
      -*) case "$t" in *f*) force=1 ;; esac ;;
      *) pos+=("$t") ;;
    esac
  done
  [ "$force" = 1 ] &&
    block "push forcé refusé. Après un rebase de ta branche de travail : git push --force-with-lease origin <branche>."
  [ "${#pos[@]}" -ge 2 ] ||
    block "nomme la branche (git push -u origin feat/<slug>) : sans elle, le push part sur la branche courante, peut-être staging."
  for r in "${pos[@]:1}"; do
    case "$r" in +*) block "refspec forcé ($r) refusé." ;; esac
    dst="${r#*:}"
    dst="${dst#refs/}"
    dst="${dst#heads/}"
    case "$dst" in
      *[*?[]*) block "refspec à joker ($r) : il peut viser main ou staging. Nomme une branche précise." ;;
      main | staging) block "pas de push direct sur $dst : pousse une branche feat/… ou fix/… et ouvre une PR vers staging." ;;
      HEAD | "") block "nomme la branche de destination ($r) : HEAD peut être staging." ;;
    esac
  done
}

# Options de git commit, lues sur le segment dont les chaînes entre guillemets
# sont remplacées par un jeton : le texte d'un -m n'est pas pris pour des
# options, et ce qui suit le message est bien examiné.
check_commit() {
  local t
  local s=()
  read -ra s <<<"$(printf '%s' "$seg" | sed -E "s/\"[^\"]*\"/Q/g; s/'[^']*'/Q/g")"
  while [ "${#s[@]}" -gt 0 ] && [ "${s[0]}" != commit ]; do s=("${s[@]:1}"); done
  set -- "${s[@]:1}"
  while [ $# -gt 0 ]; do
    t="$1"
    case "$t" in
      -m | -F | -c | -C | --message | --file | --reuse-message | --reedit-message | --author | --date | --fixup | --squash)
        shift
        [ $# -gt 0 ] && shift
        continue
        ;;
      --) break ;;
      --no-v*) block "git commit --no-verify saute le hook commit-msg (Conventional Commits)." ;;
      --*) ;;
      -*n*) block "git commit -n (--no-verify) saute le hook commit-msg (Conventional Commits)." ;;
    esac
    shift
  done
}

check_git() {
  # Options globales de git avant la sous-commande (-C <dir>, -c <k=v>…).
  while [ $# -gt 0 ]; do
    case "$1" in
      -C | -c | --git-dir | --work-tree | --namespace)
        shift
        [ $# -gt 0 ] && shift
        ;;
      -*) shift ;;
      *) break ;;
    esac
  done
  local sub="$1" t
  shift
  case "$sub" in
    push) check_push "$@" ;;
    commit) check_commit ;;
    reset)
      for t in "$@"; do
        case "$t" in --h*) block "git reset --hard efface le travail non commité. Demande à l'utilisateur, ou utilise git stash." ;; esac
      done
      ;;
    clean)
      for t in "$@"; do
        case "$t" in
          --fo* | -*f*) block "git clean -f supprime des fichiers non suivis. Demande à l'utilisateur." ;;
        esac
      done
      ;;
    checkout | restore | switch)
      for t in "$@"; do
        t="${t//\"/}"
        t="${t//\'/}"
        case "$sub:$t" in
          *:. | *:./ | *:: | *:/ | *:\*) block "git $sub $t annule toutes les modifications de l'arbre. Demande à l'utilisateur." ;;
          checkout:--fo* | checkout:-f | switch:--fo* | switch:-f | switch:--disc*)
            block "git $sub $t abandonne les modifications locales. Demande à l'utilisateur."
            ;;
        esac
      done
      ;;
  esac
}

# gh pr [options] merge, même avec des options entre `pr` et `merge`
# (gh pr -R o/r merge 12) ; merge par l'API REST ou GraphQL.
# The first word after a package manager's own options (`pnpm --filter web
# exec …`, `pnpm -s version`): sets pm_at to its index in w.
pm_sub() {
  pm_at=$(($1 + 1))
  while [ "$pm_at" -lt "${#w[@]}" ]; do
    case "${w[$pm_at]}" in
      --filter | -F | -C | --dir | --cwd | --prefix | --workspace) pm_at=$((pm_at + 2)) ;;
      -*) pm_at=$((pm_at + 1)) ;;
      *) return ;;
    esac
  done
}

check_gh() {
  local t inpr=0 skip=0 api=0 write=0 refs=0
  [ "${1:-}" = api ] && api=1
  for t in "$@"; do
    case "$t" in
      # PR merge, branch merge (POST /merges), fork sync (merge-upstream).
      */merge | */merge/* | */merge\?* | */merges | */merges/* | */merges\?* | \
        *merge-upstream* | *mergePullRequest* | *mergeBranch*)
        block "merge par l'API GitHub : le merge reste à l'utilisateur."
        ;;
      *git/refs*) refs=1 ;;
      -X | --method | -f | -F | --field | --raw-field | --input) write=1 ;;
      -XPOST | -XPATCH | -XPUT | -XDELETE | --method=*) write=1 ;;
    esac
    if [ "$skip" = 1 ]; then skip=0; continue; fi
    if [ "$inpr" = 1 ]; then
      case "$t" in
        -R | --repo) skip=1 ;;
        -*) ;;
        merge) block "gh pr merge : le merge reste à l'utilisateur." ;;
        *) inpr=0 ;;
      esac
    elif [ "$t" = pr ]; then
      inpr=1
    fi
  done
  # Moving a branch by its ref skips the PR altogether (a GET stays allowed).
  [ "$api" = 1 ] && [ "$refs" = 1 ] && [ "$write" = 1 ] &&
    block "gh api en écriture sur git/refs : une branche ne bouge que par une PR."
  return 0
}

while IFS= read -r seg; do
  # Mots sans leurs guillemets : `git "push" origin main` est lu comme le shell le lit.
  read -ra w <<<"$(printf '%s' "$seg" | tr -d "\"'")"
  # Préfixes qui lancent la commande suivante : VAR=val, env, sudo, timeout 30,
  # mots-clés du shell, bash -c "…", eval, xargs.
  i=0
  while [ "$i" -lt "${#w[@]}" ]; do
    case "${w[$i]}" in
      *=* | env | command | builtin | time | nohup | sudo | exec | xargs | eval | \
        then | do | else | elif | if | while | until | ! | timeout | nice | stdbuf | [0-9]* | \
        bash | sh | zsh | -c | -lc | -ic | npx | bunx) i=$((i + 1)) ;;
      # Runners: `pnpm exec gh …`, `npm exec -- git …`, `yarn dlx …`.
      npm | pnpm | yarn)
        pm_sub "$i"
        case "${w[$pm_at]:-}" in
          exec | dlx | x) i=$((pm_at + 1)) ;;
          *) break ;;
        esac
        ;;
      # A wrapper's options, and their value for those that take one
      # (`sudo -u root git …`, `xargs -n 1 git …`, `timeout -s KILL 30 git …`).
      # The value is skipped only if it isn't itself a command this hook
      # reads: `sudo -s git push …` (-s takes no value) still lands on git.
      -u | -g | -C | -h | -p | -s | -k | -n | -I | -P | -L | -d | -E | -S | \
        --user | --group | --signal | --kill-after)
        case "${w[$((i + 1))]##*/}" in
          git | gh | npm | pnpm | yarn | npx | bunx | bash | sh | zsh | env | sudo | xargs | timeout | nice) i=$((i + 1)) ;;
          *) i=$((i + 2)) ;;
        esac
        ;;
      -*) i=$((i + 1)) ;;
      *) break ;;
    esac
  done
  [ "$i" -lt "${#w[@]}" ] || continue
  case "${w[$i]##*/}" in
    git) check_git "${w[@]:$((i + 1))}" ;;
    gh) check_gh "${w[@]:$((i + 1))}" ;;
    npm | pnpm | yarn)
      pm_sub "$i"
      [ "${w[$pm_at]:-}" = version ] &&
        block "${w[$i]##*/} version : la version et le CHANGELOG sont gérés par release-please, à partir des messages de commit."
      ;;
  esac
done <<<"$segments"
exit 0
