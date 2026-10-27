# Hooks et réglages

[English](hooks-and-settings.md) · **Français**

Ce qui tourne autour de chaque action de Claude, ce qu'il peut faire sans
demander, et les fichiers qui lui décrivent le dépôt. Retour à la
[vue d'ensemble](README.fr.md).

- [Hooks](#hooks)
- [Permissions](#permissions)
- [Fichiers d'instructions](#fichiers-dinstructions) : `CLAUDE.md`, `AGENTS.md`, Codex
- [Serveurs MCP et connecteurs](#serveurs-mcp-et-connecteurs)
- [Ce qui vit hors du dépôt](#ce-qui-vit-hors-du-dépôt)

## Hooks

Déclarés dans [`.claude/settings.json`](../../.claude/settings.json), scripts
dans [`.claude/hooks/`](../../.claude/hooks/). C'est Claude Code qui les
lance, pas Claude : ils s'appliquent quoi qu'on ait demandé à Claude, dans
chaque session, mode bypass compris.

| Quand                       | Hook                                                          | Fait                                                                                                         |
| --------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Avant une commande shell    | [`guard-git.sh`](../../.claude/hooks/guard-git.sh)            | Refuse les commandes git et `gh` qui sortent de branche → PR → CI → ton merge                                |
| Avant une modification      | [`protect-files.sh`](../../.claude/hooks/protect-files.sh)    | Refuse de modifier les secrets, le lockfile, les fichiers générés et ce que gère release-please              |
| Après une modification      | [`format.sh`](../../.claude/hooks/format.sh)                  | `eslint --fix`, puis Prettier, sur le fichier modifié                                                        |
| Après une modification      | [`generate-types.sh`](../../.claude/hooks/generate-types.sh)  | Régénère `src/payload-types.ts` après une modification du schéma                                             |
| Après une modification      | [`turn-checks.sh record`](../../.claude/hooks/turn-checks.sh) | Note le fichier modifié pour la fin du tour                                                                  |
| Quand Claude veut s'arrêter | [`turn-checks.sh stop`](../../.claude/hooks/turn-checks.sh)   | Lance les tests liés aux fichiers modifiés, et vérifie que ces docs ont suivi un changement de configuration |

« Modification » désigne les outils `Edit`, `Write` et `MultiEdit`. Un
fichier changé par une commande shell (`sed`, un heredoc) ne passe que par
`guard-git`.

Comment un hook répond : la sortie 0 laisse passer l'action ; un JSON
`permissionDecision: "deny"` (protect-files) ou la sortie 2 (les autres) la
bloque et renvoie le message, en français, à Claude, qui le lit et s'adapte.
Chaque hook a besoin de `jq` ; sans lui, `guard-git` et `protect-files`
bloquent plutôt que de tout laisser passer.

### `guard-git`

Le ruleset de `staging` et `main` exige une PR et une CI verte, mais
Repository admin est sur sa liste de contournement, et le `gh` de Claude
tourne avec ton jeton d'admin : `gh pr merge --admin` ou un push direct
passeraient. Ce hook est la barrière pour Claude.

| Refusé                                                                                                              | À la place                                                        |
| ------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `git push` vers `main` ou `staging`, sans branche nommée, vers `HEAD`, avec un refspec à joker, `--all`, `--mirror` | `git push -u origin feat/<slug>`, puis une PR                     |
| `git push --force`, `-f`, `+refspec`                                                                                | `--force-with-lease`, après un rebase de ta propre branche        |
| `gh pr merge`, les API de merge REST et GraphQL, `merge-upstream`                                                   | Tu merges                                                         |
| Un `gh api` en écriture sur `git/refs` (déplacer une branche sans PR)                                               | Une PR                                                            |
| `git commit --no-verify` / `-n`                                                                                     | Un message que le [hook `commit-msg`](../git-hooks.fr.md) accepte |
| `git reset --hard`, `git clean -f`, `git checkout -f` / `-- .`, `git restore .`, `git switch --discard-changes`     | Te demander, ou `git stash`                                       |
| `pnpm version` (et `npm`, `yarn`)                                                                                   | release-please fixe la version                                    |

Il voit à travers les enveloppes (`env`, `sudo -u x`, `timeout -s KILL 30`,
`xargs -n 1`, `npx`, `pnpm --filter x exec`, `bash -c "…"`), recolle les
lignes coupées par `\`, met de côté le corps des heredocs (un message de
commit qui cite `gh pr merge` n'est pas un merge), et lit chaque commande
deux fois : découpée partout, et découpée avec ses chaînes entre guillemets
mises de côté, pour qu'un `;` dans un argument entre guillemets ne puisse
pas cacher la suite. Git accepte les options abrégées (`--har`), donc les
options sont comparées par préfixe.

Il protège des erreurs, pas d'un contournement délibéré : les alias, les
variables, les fonctions, `git -c core.hooksPath=…` et les modifications du
script lui-même ne sont pas couverts. Il vient de memmi
(`memmi-front/.claude/hooks/guard-git.sh`) : une correction du découpage
là-bas vaut sans doute ici aussi.

### `protect-files`

| Fichier                                                    | Pourquoi, et la bonne façon                              |
| ---------------------------------------------------------- | -------------------------------------------------------- |
| `.env`, `.env.*` (pas `.env.example`)                      | Des secrets : tu les modifies toi-même                   |
| `pnpm-lock.yaml`                                           | Généré : `pnpm add`, `pnpm remove`, `pnpm install`       |
| `src/payload-types.ts`                                     | Généré : modifier le schéma, puis `pnpm generate:types`  |
| `src/app/(payload)/admin/importMap.js`                     | Généré : `pnpm generate:importmap`                       |
| `CHANGELOG.md`, `.release-please-manifest.json`            | release-please les écrit à partir des messages de commit |
| Le champ `version` de `package.json` (le reste se modifie) | release-please le monte dans sa PR de version            |

### `format`

Sur un fichier `.ts`, `.tsx`, `.js`, `.mjs` ou `.cjs` : `eslint --fix`, puis,
sur tout fichier, Prettier avec la config du dépôt (`--ignore-unknown` saute
les types qu'il ne sait pas lire, et `.prettierignore` s'applique toujours :
`src/migrations/index.ts` garde le style de Payload). Les erreurs de lint
qui restent après `--fix` reviennent à Claude, pour ne jamais attendre la
CI ; les avertissements passent. Un seul hook plutôt que deux : Claude Code
lance les hooks d'un outil en parallèle, et deux scripts qui réécrivent le
même fichier se marcheraient dessus.

### `generate-types`

Seulement pour les fichiers qui alimentent la config de Payload :
`src/collections/`, `src/globals/`, `src/fields/`, `src/payload.config.ts`.
Il lance `pnpm generate:types`, pour que le typecheck de la CI ne voie jamais
des types périmés. Si la génération échoue, l'erreur revient à Claude pour
qu'il corrige la config.

### `turn-checks`

`record` note chaque fichier que Claude modifie pendant un tour. `stop`
tourne quand Claude veut terminer son tour :

1. **Les tests liés** : `vitest related` sur les projets unit et dom pour
   les fichiers source et de test modifiés. Rapide, sans base ; les suites
   complètes restent à `/pre-pr` et à la CI.
2. **Ces docs** : si le tour a changé `.claude/skills/`, `.claude/agents/`,
   `.claude/hooks/` ou `.claude/settings.json` (le skill `payload` excepté)
   et qu'aucun fichier de `docs/ai/` n'a changé dans le même tour, Claude doit
   les vérifier, dans les deux langues. Si le changement ne touche pas ce
   qu'elles décrivent, il le dit et s'arrête.

Un échec au premier arrêt renvoie Claude au travail. Au second, il est
seulement signalé : pas de boucle. L'état vit dans un dossier privé sous
`$TMPDIR`. Pour le couper dans tes sessions, mets `CLAUDE_TURN_CHECKS=off`
dans l'`env` de `.claude/settings.local.json`.

## Permissions

[`.claude/settings.json`](../../.claude/settings.json) est partagé et
versionné. Il autorise, sans demander, les commandes en lecture seule ou
locales que tous les workflows utilisent :

- `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm exec prettier`
- `pnpm generate:types`, `pnpm generate:importmap`
- `pnpm test:unit`, `pnpm test:int`, `pnpm test:coverage`
- `pnpm payload migrate:status`
- `gh pr view`, `gh pr checks`, `gh run view`, `gh run list`, `gh run watch`

Tout le reste demande, sauf si tu l'as autorisé dans
`.claude/settings.local.json` : ton fichier à toi, ignoré par ton gitignore
global, pour les permissions personnelles, les dossiers en plus, les plugins
et l'`env` (comme `CLAUDE_TURN_CHECKS`). Une règle d'autorisation ne passe
jamais au-dessus d'un hook : `guard-git` refuse un push sur `staging` même en
mode bypass.

Les workflows GitHub ne s'appuient pas sur ces listes : chacun passe ses
propres `--allowedTools` et `--disallowedTools` exacts (voir
[Claude sur GitHub](github-agents.fr.md#ce-qui-protège-ces-workflows)).

## Fichiers d'instructions

| Fichier                        | Versionné                 | Lu par                                     | Dit                                                                                                                                                                    |
| ------------------------------ | ------------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`CLAUDE.md`](../../CLAUDE.md) | oui                       | Claude Code                                | Utiliser le skill `payload` de `.claude/skills/payload/`                                                                                                               |
| `AGENTS.md`                    | non (ignoré par git)      | Codex, et les skills qui disent de le lire | Le skill Payload pour Codex, et le bloc qu'écrit `next dev` : cette version de Next.js diffère des données d'entraînement, lire d'abord `node_modules/next/dist/docs/` |
| `.codex/config.toml`           | non (ignoré par git)      | Codex                                      | Le serveur MCP chrome-devtools                                                                                                                                         |
| `.agents/skills/payload/`      | non (ignoré par git)      | Codex                                      | Une copie de `.claude/skills/payload/`                                                                                                                                 |
| `plans/README.md`              | non (`plans/` est ignoré) | `/feature`, `/ship-plan`, les agents       | Les **Décisions** contraignantes, le **Backlog**, les plans en cours                                                                                                   |

`next dev` réécrit son bloc dans `AGENTS.md` à chaque démarrage : le retirer
d'un diff ne fait que le faire revenir.

La revue GitHub supprime les copies de la PR de chaque `CLAUDE.md`,
`AGENTS.md` et de `.claude/` et les prend sur `staging` : une PR ne peut pas
réécrire les règles de sa propre revue.

## Serveurs MCP et connecteurs

Aucun n'est configuré dans le dépôt (pas de `.mcp.json`). Les skills
utilisent, quand ils sont connectés dans ta session :

| Serveur                           | Utilisé par                                                | Pour                                                                 |
| --------------------------------- | ---------------------------------------------------------- | -------------------------------------------------------------------- |
| chrome-devtools                   | `/audit`, `/site-health`, `/preview-check`, `/triage-deps` | Pages, émulation, captures, Lighthouse, traces de performance        |
| Le connecteur Vercel de claude.ai | `/release`, `/site-health`, `/preview-check`, `/bug`       | Déploiements, logs de build, erreurs et logs d'exécution, pages vues |
| postgres (lecture seule, local)   | `/new-migration`                                           | Lire le schéma local réel au lieu de deviner                         |
| GitHub, via `gh`                  | presque tous                                               | PR, vérifications, passages de CI, releases, alertes                 |

Un skill dont le serveur n'est pas connecté le dit et saute cette étape,
plutôt que de deviner.

## Ce qui vit hors du dépôt

Pas dans git, donc pas détaillé ici : tes skills au niveau utilisateur
(`~/.claude/skills/`, dont `zolan-profile`, qu'utilise `/content-audit`), les
plugins, ta mémoire, et les serveurs MCP configurés dans `~/.claude.json`. Un
clone neuf reçoit les hooks, les permissions partagées, les skills et les
agents, et rien de personnel.
