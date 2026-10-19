# NNN — Titre court du changement

- **Status**: TODO <!-- TODO | IN PROGRESS | DONE -->
- **Type**: feat <!-- feat | fix | perf | refactor… : le type du commit -->
- **Severity**: MEDIUM <!-- HIGH | MEDIUM | LOW -->
- **Estimated scope**: 2 fichiers (`Exemple.tsx`, `dictionary.ts`), ~40 lignes

## Problem

Ce qui ne va pas aujourd'hui, avec les fichiers et les lignes concernés. Un
agent qui n'a jamais vu le projet doit comprendre le problème sans rien
demander.

## Target

Ce qu'on veut à la fin, de façon vérifiable : comportement, valeurs exactes
(durées, tokens, libellés fr **et** en), code cible si besoin.

## Fichiers

- `src/…` : ce qui change dedans.

## Hors périmètre

Ce qu'on ne touche pas, même si c'est tentant. L'agent ajoute ici ce qu'il
remarque en chemin.

## Vérification

- Tests à ajouter ou adapter : `tests/unit/….spec.ts`, `tests/e2e/….e2e.spec.ts`.
- Commandes : `pnpm test:unit`, `pnpm test:int` si le schéma change.
- À vérifier à l'œil : ressenti de l'animation, mobile, mode sombre, les deux langues.

## Décisions ouvertes

Les choix de produit ou de design que l'agent ne doit pas trancher seul. Vide
si tout est décidé.
