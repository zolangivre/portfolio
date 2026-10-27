# Dependabot

[English](dependabot.md) · **Français**

[`.github/dependabot.yml`](../../.github/dependabot.yml) : quelles PR de
dépendances s'ouvrent toutes seules, et quoi faire de chacune. Retour à
[GitHub](README.fr.md).

Dependabot ouvre des PR ; il n'en merge jamais. Chaque PR est vérifiée par la
[CI](ci.fr.md) comme n'importe quelle autre, et t'attend.

## Deux écosystèmes

| Écosystème     | Quand        | Cible     | Préfixe de commit                      | Au plus        |
| -------------- | ------------ | --------- | -------------------------------------- | -------------- |
| npm            | Chaque lundi | `staging` | `chore(deps): …`, `chore(deps-dev): …` | 5 PR ouvertes  |
| GitHub Actions | Chaque mois  | `staging` | `ci: …`                                | une PR groupée |

Les deux préfixes sont des Conventional Commits : le
[hook `commit-msg`](../git-hooks.fr.md) et release-please traitent les commits
de Dependabot comme les tiens. Un `chore` reste hors du CHANGELOG ; les
commits `fix(deps)` du balayage de sécurité donnent une release de patch.

**GitHub Actions** compte plus qu'il n'y paraît : les deux workflows Claude
et release-please figent chaque action sur un SHA de commit (un tag peut être
déplacé vers n'importe quel code), et c'est Dependabot qui tient ces SHA et
leurs commentaires `# vX.Y.Z` à jour.

## Délai de publication

Une nouvelle version n'est proposée qu'après **3 jours** sur le registre. Une
release compromise (une attaque de la chaîne d'approvisionnement) est en
général retirée avant. Les mises à jour de sécurité ne sont pas retardées.

Le même délai vaut pour les installations faites par Claude :
`/security-sweep`, `/triage-deps` et `/upgrade-payload` passent
`--config.minimum-release-age=4320` (en minutes) à `pnpm`.

## Groupes

Un paquet va dans le **premier** groupe qui lui correspond. Les paquets à
scope se désignent par `@scope*` : la forme `@scope/*` ne trouvait rien ici
(#51 montait `tailwindcss` sans `@tailwindcss/postcss`, #77 `vitest` sans
`@vitest/coverage-v8`, #76 `payload` sans `@payloadcms`).

| Groupe               | Paquets                                                                                                                     | Pourquoi ensemble                                                                                                                                      |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `payload-next-react` | `payload`, `@payloadcms*`, `next`, `@next*`, `eslint-config-next`, `react`, `react-dom`, `@types/react`, `@types/react-dom` | Chaque paquet `@payloadcms/*` doit avoir la version exacte de `payload`, et Payload n'accepte que certaines versions de Next/React. Majeures comprises |
| `vitest`             | `vitest`, `@vitest*`                                                                                                        | Le plugin de couverture doit suivre le lanceur. Majeures comprises                                                                                     |
| `tailwind`           | `tailwindcss`, `@tailwindcss*`                                                                                              | Le plugin PostCSS doit suivre. Majeures comprises                                                                                                      |
| `minor-and-patch`    | toutes les autres mineures et patchs                                                                                        | Une PR par semaine au lieu de dix                                                                                                                      |
| aucun                | toutes les autres majeures                                                                                                  | Une à la fois : chacune peut changer un comportement                                                                                                   |

**Ignorées** : les majeures de `@types/node`. Elles suivent la version de
Node sur laquelle tourne le site (24.x sur Vercel et en CI) : des types d'une
majeure plus récente accepteraient des API qui plantent en production. Cette
majeure se monte à la main, avec le runtime.

## Quoi faire d'une PR Dependabot

| PR                                                | Lancer                                                                                                                                                                                      |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `payload-next-react`                              | [`/upgrade-payload <n>`](../ai/skills.fr.md#upgrade-payload-version--numéro-de-pr) : notes de version, types, import map, test de dérive, migration, toutes les vérifs                      |
| Toute autre, pour savoir si elle peut être mergée | [`/triage-deps <n>`](../ai/skills.fr.md#triage-deps-numéro-de-pr) : changelogs, recherche dans le code, vérifs sur le `staging` actuel, un contrôle navigateur pour les paquets d'exécution |
| CI rouge                                          | [`/security-sweep`](../ai/skills.fr.md#security-sweep---pr), en local : un petit correctif poussé sur la PR, ou un diagnostic                                                               |
| CI lancée sur une vieille base                    | Commenter `@dependabot rebase` sur la PR                                                                                                                                                    |

Dès que quelqu'un d'autre pousse sur une branche Dependabot, Dependabot
arrête de rebaser cette PR : c'est normal. `/release` liste les PR Dependabot
que personne n'a encore triées comme « doit d'abord être tranchée ».

## Ce que Dependabot ne fait pas

- **Les vulnérabilités transitives** dont le parent fige la plage
  vulnérable : Dependabot ne peut pas les monter, donc leurs alertes restent
  ouvertes. Le [balayage de sécurité](../ai/github-agents.fr.md#le-balayage-de-sécurité)
  ajoute à la place une entrée `pnpm.overrides` ciblée.
- **Les changements de code** qu'une mise à jour demande : la CI passe au
  rouge, et la PR attend `/security-sweep` ou toi.
- **Fermer les alertes avant la prod** : les alertes Dependabot sont
  calculées sur `main`, donc elles se ferment quand le correctif part dans
  une release, pas quand sa PR est mergée dans `staging`.
