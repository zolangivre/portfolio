# Docs

[English](README.md) · **Français**

Tout ce qui, dans ce dépôt, tourne tout seul ou sur commande : la
configuration de Claude Code, GitHub Actions et les hooks git. Le site
lui-même (stack, modèle de contenu, tests, déploiement) est décrit dans le
[README principal](../README.fr.md).

Chaque document existe en anglais et en français (`<nom>.fr.md`). La CI fait
échouer une PR qui modifie une langue sans l'autre : voir
[la vérification fr/en des docs](github/ci.fr.md#docs-fren-synchronisées).

## Plan

### Claude Code : [`ai/`](ai/README.fr.md)

| Document                                         | Couvre                                                                                                                                              | Où ça vit                                                                                  |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| [Vue d'ensemble](ai/README.fr.md)                | Comment les pièces s'emboîtent, ce qui reste à faire à la main, le dossier `plans/`, ce qui consomme ton quota Claude                               |                                                                                            |
| [Skills](ai/skills.fr.md)                        | Les 16 commandes (`/feature`, `/ship`, `/bug`, `/release`…) et les 2 skills que Claude charge tout seul (`payload`, `i18n-copy`), groupés par usage | [`.claude/skills/`](../.claude/skills/)                                                    |
| [Sous-agents](ai/subagents.fr.md)                | `test-writer`, `payload-reviewer`, `ui-reviewer`, `webkit-reviewer` : ce que chacun lit, qui l'appelle                                              | [`.claude/agents/`](../.claude/agents/)                                                    |
| [Hooks et réglages](ai/hooks-and-settings.fr.md) | Les 6 hooks qui encadrent les actions de Claude, les permissions, `CLAUDE.md` / `AGENTS.md`, Codex, les serveurs MCP                                | [`.claude/settings.json`](../.claude/settings.json), [`.claude/hooks/`](../.claude/hooks/) |
| [Claude sur GitHub](ai/github-agents.fr.md)      | La revue de PR (label `review`) et le balayage de sécurité nocturne : déclencheurs, protections, installation, dépannage                            | [`.github/workflows/`](../.github/workflows/)                                              |

### GitHub : [`github/`](github/README.fr.md)

| Document                              | Couvre                                                                                                               | Où ça vit                                                                                                                                             |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Vue d'ensemble](github/README.fr.md) | Les branches (`staging`, `main`), le ruleset, les secrets et réglages, le modèle de PR, le dépannage                 | [`.github/`](../.github/)                                                                                                                             |
| [CI](github/ci.fr.md)                 | `ci.yml` job par job, quand les tests lents sont sautés, la vérification fr/en des docs, le test de dérive du schéma | [`ci.yml`](../.github/workflows/ci.yml), [`ci-site-changed.sh`](../.github/ci-site-changed.sh), [`check-doc-pairs.sh`](../.github/check-doc-pairs.sh) |
| [Dependabot](github/dependabot.fr.md) | Les PR npm hebdomadaires, les groupes, le délai de 3 jours, quoi lancer sur chaque type de PR                        | [`dependabot.yml`](../.github/dependabot.yml)                                                                                                         |
| [Releases](github/releases.fr.md)     | release-please, les numéros de version tirés des commits, les trois merges d'une release                             | [`release.yml`](../.github/workflows/release.yml), [`release-please-config.json`](../release-please-config.json)                                      |

### Git : [`git-hooks.fr.md`](git-hooks.fr.md)

Le hook `commit-msg` qui vérifie le format Conventional Commits, comment il
s'installe, et pourquoi rien (à part toi) ne le contourne.

## Qui lance quoi

| Déclencheur                                     | Ce qui tourne                                                                                                              |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Tu tapes une commande dans Claude Code          | Un skill : [`/feature`, `/ship`, `/release`…](ai/skills.fr.md)                                                             |
| Claude modifie un fichier ou lance une commande | Les [hooks de Claude Code](ai/hooks-and-settings.fr.md#hooks) : garde-fou, formatage, types, tests liés                    |
| Un commit, le tien ou celui de Claude           | Le [hook git `commit-msg`](git-hooks.fr.md)                                                                                |
| Push ou PR                                      | La [CI](github/ci.fr.md) ; sur un push vers `staging`, [release-please](github/releases.fr.md)                             |
| Tu ajoutes le label `review` à une PR           | [La revue de Claude](ai/github-agents.fr.md#la-revue-de-pr)                                                                |
| Chaque nuit, 00:17 UTC                          | [Le balayage de sécurité](ai/github-agents.fr.md#le-balayage-de-sécurité) (Claude ne tourne que si les alertes ont changé) |
| Chaque lundi                                    | [Les PR npm de Dependabot](github/dependabot.fr.md) (GitHub Actions : chaque mois)                                         |
| Push sur `staging` ou `main`                    | Un déploiement Vercel, qui lance d'abord `payload migrate` ([`vercel.json`](../vercel.json))                               |

Rien dans cette liste ne merge de PR, ne déploie à la main ni n'écrit dans le
CMS de production. Le merge reste toujours à toi.
