# Hooks git

[English](git-hooks.md) · **Français**

Les hooks que git lance lui-même, dans [`.githooks/`](../.githooks/). À ne pas
confondre avec les [hooks de Claude Code](ai/hooks-and-settings.fr.md#hooks),
que Claude Code lance autour des actions de Claude. Retour à
l'[index des docs](README.fr.md).

Il y en a un : `commit-msg`.

## `commit-msg`

[`.githooks/commit-msg`](../.githooks/commit-msg) vérifie que la première
ligne de chaque message de commit suit les
[Conventional Commits](https://www.conventionalcommits.org). release-please
tire le numéro de version et le CHANGELOG de ces messages
([Releases](github/releases.fr.md)) : un message mal formé serait ignoré, et
son changement n'apparaîtrait dans aucune release.

```txt
<type>(<scope facultatif>)<! facultatif>: <description>
```

| Partie      | Autorisé                                                                                            |
| ----------- | --------------------------------------------------------------------------------------------------- |
| type        | `feat`, `fix`, `perf`, `refactor`, `docs`, `test`, `build`, `ci`, `style`, `chore`, `revert`        |
| scope       | minuscules, chiffres, `.`, `_`, `/`, `-` : `feat(journal)`, `chore(deps-dev)`, `ci(security-sweep)` |
| `!`         | un changement cassant : la prochaine release est une majeure                                        |
| description | n'importe quoi, après `: `                                                                          |

Le motif exact :

```txt
^(feat|fix|perf|refactor|docs|test|build|ci|style|chore|revert)(\([a-z0-9._/-]+\))?!?: .+
```

**Laissés passer** sans vérification, puisque git les écrit lui-même : les
messages qui commencent par `Merge `, `Revert `, `fixup! `, `squash! ` et
`amend! `.

Un commit refusé affiche la ligne reçue, la forme attendue, les types et un
exemple, et le commit n'a pas lieu : corrige le message et recommite.

```txt
✖ Commit message is not in Conventional Commits format:
    Update stuff
  Expected: <type>(<optional scope>): <description>
  Types   : feat, fix, perf, refactor, docs, test, build, ci, style, chore, revert
  Example : feat(journal): reading progress bar
```

Seule la première ligne est vérifiée. Le corps est libre : dis-y pourquoi, et
mets-y `BREAKING CHANGE: …` pour une majeure, ou `Docs-Sync: skip` pour un
changement de doc d'un seul côté ([CI](github/ci.fr.md#docs-fren-synchronisées)).

## Installation

Par défaut, git ne lit pas les hooks depuis le dépôt. Le script `prepare` de
`package.json` le fait pointer dessus :

```json
"prepare": "git config core.hooksPath .githooks || true"
```

`pnpm install` lance `prepare` : un clone est prêt dès que ses dépendances
sont installées. Le `|| true` évite qu'une installation hors d'un checkout
git échoue. Pour vérifier, ou le régler à la main :

```sh
git config core.hooksPath   # .githooks
git config core.hooksPath .githooks
```

Le hook doit rester exécutable (`chmod +x .githooks/commit-msg`) : git saute
sans rien dire un hook qui ne l'est pas.

## À qui il s'applique

| Qui                            | Vérifié | Comment                                                                                                                                                      |
| ------------------------------ | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Toi, en local                  | oui     | après `pnpm install`                                                                                                                                         |
| Claude, en local               | oui     | et [`guard-git`](ai/hooks-and-settings.fr.md#guard-git) refuse `git commit --no-verify` / `-n`                                                               |
| Le balayage de sécurité en CI  | oui     | il installe avec `--ignore-scripts`, qui saute `prepare` : le workflow règle donc `core.hooksPath` lui-même, et sa liste de commandes interdit `--no-verify` |
| Dependabot                     | non     | ses commits sont faits sur GitHub, mais ses préfixes `chore(deps)` et `ci` sont Conventional ([Dependabot](github/dependabot.fr.md))                         |
| release-please                 | non     | il écrit lui-même `chore(staging): version X.Y.Z`                                                                                                            |
| Les commits de merge de GitHub | non     | `Merge pull request #…`, que le hook laisse passer de toute façon                                                                                            |

`/pre-pr` vérifie chaque commit de la branche avec le même motif, ce qui
rattrape tout ce qui a été commité avant l'installation du hook.

## Le contourner

Pour une fois, tu peux : `git commit --no-verify`. Claude ne peut pas, ni en
local (`guard-git`) ni en CI (la liste d'interdits du balayage). Un commit
qui a sauté le hook doit quand même être Conventional pour apparaître dans
une release : reformule-le avant de le pousser (`git commit --amend`, ou un
rebase interactif).

## Ajouter un hook

Mets dans `.githooks/` un script exécutable qui porte le nom du hook git
(`pre-push`, `pre-commit`…). Il s'applique à chaque clone après son prochain
`pnpm install`. Garde les hooks rapides et en `sh` POSIX, comme
`commit-msg` : ils tournent à chaque commit, ceux des agents compris.
