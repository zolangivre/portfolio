# Workflows d'agents

[English](agent-workflows.md) · **Français**

Comment Claude Code est configuré pour travailler sur ce dépôt : ce que fait
chaque pièce, quand l'utiliser, et ce qui reste à faire à la main. Tout ce qui
est décrit ici propose des changements à relire. Les commandes poussent une
branche de travail et ouvrent une PR vers `staging` ; le merge, c'est toi.
Rien ne merge, ne déploie ni n'écrit dans le CMS de production tout seul.

Il y a trois niveaux :

- **Des commandes** à lancer dans Claude Code (`/feature`, `/ship`, `/security-sweep`…).
  Chacune est un skill dans [`.claude/skills/`](../.claude/skills/).
- **Des sous-agents** que ces commandes appellent pour un second avis : trois
  reviewers et un rédacteur de tests, dans [`.claude/agents/`](../.claude/agents/).
  Ils démarrent sans le contexte de la conversation, donc ils jugent le diff,
  pas le raisonnement qui l'a produit.
- **Des workflows GitHub** qui font une partie de ce travail sans toi : un
  balayage de sécurité quotidien et une revue des pull requests, dans
  [`.github/workflows/`](../.github/workflows/).

En dessous, des hooks dans [`.claude/settings.json`](../.claude/settings.json)
(scripts dans [`.claude/hooks/`](../.claude/hooks/)) :

- **`guard-git`** lit chaque commande shell que Claude lance et refuse un push
  sur `staging` ou `main`, un push forcé, un merge (`gh pr merge`, l'API de
  merge), le déplacement d'une branche par l'API, `--no-verify`,
  `reset --hard` et `pnpm version`, y compris derrière un `sudo`, `npx`,
  `pnpm exec` ou `bash -c`. Le ruleset laisse
  Repository admin contourner ses règles, et le `gh` de Claude tourne avec ton
  token admin : c'est ce hook qui garde le merge entre tes mains.
- **`protect-files`** bloque les modifications des `.env*`, du lockfile, des
  fichiers générés (`payload-types.ts`, l'import map), et de ce que gère
  release-please (`CHANGELOG.md`, son manifeste, la `version` de
  `package.json`).
- **`format`** passe `eslint --fix` puis Prettier sur chaque fichier que Claude
  modifie. Les erreurs de lint qui restent reviennent tout de suite à Claude,
  elles n'attendent jamais la CI.
- **`generate-types`** régénère `payload-types.ts` après un changement de
  schéma.
- **`turn-checks`**, quand Claude s'apprête à s'arrêter : lance les tests
  unitaires liés aux fichiers qu'il a modifiés (`vitest related`, une ou deux
  secondes), et s'il a changé la config Claude (skills, agents, hooks) sans
  toucher à ce guide, lui demande de le vérifier. Un échec renvoie Claude au
  travail une fois, jamais en boucle. Désactivable le temps d'une session avec
  `CLAUDE_TURN_CHECKS=off` dans l'`env` de `.claude/settings.local.json`.

Un skill n'est pas une commande : **`i18n-copy`**, les règles du texte visible
(le dictionnaire dans les deux langues, les champs localisés du CMS,
`maxLength`, les dates, la typographie française). Claude le charge tout seul
dès qu'il touche à un texte d'interface.

## En un coup d'œil

| Tu veux…                                                       | Lancer                                                | Où ça s'arrête                                             |
| -------------------------------------------------------------- | ----------------------------------------------------- | ---------------------------------------------------------- |
| Construire quelque chose à partir d'une demande                | `/feature ajouter un temps de lecture aux articles`   | Une PR vers `staging`, CI verte                            |
| Livrer le travail en cours                                     | `/ship` (`--draft` pour une PR en brouillon)          | Une PR vers `staging`, CI verte                            |
| Livrer un changement que tu as planifié                        | `/ship-plan 007` (`--local` : arrêt avant le push)    | Une PR vers `staging`, CI verte                            |
| Corriger un bug                                                | `/bug les dates des projets ont un mois d'avance`     | Une PR vers `staging`, CI verte                            |
| Réparer un test instable                                       | `/flaky` (ou `/flaky e2e --repeat 20`)                | Une PR vers `staging`, CI verte                            |
| Auditer SEO, accessibilité et vitesse, puis corriger           | `/audit` (ou `/audit seo`, `/audit --local`)          | Un rapport, puis une PR par correction choisie             |
| Nettoyer les branches et worktrees mergés                      | `/menage` (ou `/menage --dry-run`)                    | Une liste ; ne supprime que ce que tu confirmes            |
| Traiter les alertes de sécurité                                | `/security-sweep`                                     | Un commit local, ou une PR quand c'est la CI qui le lance  |
| Mettre à jour Payload (ou réparer la PR Payload de Dependabot) | `/upgrade-payload 3.92.0` ou `/upgrade-payload 123`   | Une PR vers `staging`, CI verte                            |
| Modifier le schéma de la base                                  | `/new-migration add_project_tagline`                  | Un fichier de migration, prouvé par une migration complète |
| Vérifier une branche avant d'ouvrir une PR                     | `/pre-pr` (ajouter `--e2e` pour les tests navigateur) | Un rapport, sans aucun changement                          |
| Relire les textes fr/en du site                                | `/content-audit`                                      | Un fichier de textes dans `plans/`                         |
| Vérifier que la production va bien                             | `/site-health`                                        | Un rapport dans `plans/`                                   |
| Savoir si une PR Dependabot peut être mergée                   | `/triage-deps 79`                                     | Un verdict, rien n'est mergé                               |
| Regarder staging avant une release                             | `/preview-check` (ou `/preview-check local`)          | Des captures et un rapport dans `plans/`                   |
| Mettre staging en production                                   | `/release`, puis `/release verify` après le merge     | La PR de release, puis un rapport sur la prod              |
| Faire relire une PR sur GitHub                                 | Ajouter le label `review` à la PR                     | Des commentaires sur les lignes de la PR                   |

## Les commandes

### `/feature <demande>` : de la demande à la PR

La boucle qui te prend le moins de temps. Tu dis ce que tu veux avec tes mots ;
Claude revient deux fois : une pour que tu approuves le plan, une avec une PR
dont la CI est verte.

```mermaid
flowchart LR
  A[demande] --> Q[questions,<br/>s'il y en a]
  Q --> P[plan dans plans/,<br/>tu approuves]
  P --> S[boucle ship-plan :<br/>tests, code, vérifs, revue]
  S --> L[regard sur les écrans :<br/>390 et 1280 px,<br/>clair/sombre, fr/en]
  L --> SH["/ship : PR,<br/>CI suivie"]
  SH --> M[tu relis<br/>et tu merges]
```

1. **Lancer `/feature <demande>`** sur un arbre de travail propre. La commande
   lit les **Décisions** de `plans/README.md`, explore le code, et ne te
   demande que ce que le code et les conventions ne tranchent pas (une
   formulation, un choix visuel).
2. **Approuver le plan.** Elle écrit `plans/NNN-*.md` à partir du modèle et te
   le montre en mode plan. Rien ne change avant ton accord.
3. **Elle construit** en suivant `/ship-plan` (plus bas) : tests d'abord, code,
   vérifications, reviewers. Puis, si le changement se voit sur le site, elle
   lance la branche, regarde chaque écran touché, et garde des captures pour
   la PR.
4. **Elle livre** en suivant `/ship` : la PR vers `staging`, la CI suivie et
   corrigée jusqu'au vert.
5. **Tu relis et tu merges.** Le rapport liste ce qu'il reste à vérifier à
   l'œil et les captures à glisser dans la PR (`gh` ne téléverse pas d'images).

### `/ship [--draft]` : du travail en cours à la PR

Tout ce qui n'est pas commité, ou commité mais pas poussé : un correctif fait
en conversation, la fin de `/feature`, de `/ship-plan` ou de `/upgrade-payload`.

1. Sur `staging` avec des modifications, la commande crée une branche de
   travail en les gardant. Des modifications sans rapport deviennent des
   branches et des PR séparées.
2. Elle lance les vérifications de `/pre-pr`, et corrige ce qui échoue.
3. Elle commite au format Conventional, par unité logique, en ajoutant les
   fichiers par leur chemin.
4. Elle pousse la branche et ouvre une PR vers `staging` (ou met à jour la PR
   qui existe déjà pour la branche), en anglais, sans rien de privé : le dépôt
   est public. Elle n'ajoute pas le label `review`, puisque les reviewers ont
   déjà tourné.
5. Elle suit la CI en tâche de fond. Un échec causé par la branche est corrigé
   et poussé ; un échec d'infrastructure est relancé une fois ; un échec venu
   d'ailleurs est signalé, pas corrigé ici. Trois tours au plus.

Elle ne merge jamais. Quand assez de choses se sont accumulées sur `staging`,
`/release` ouvre la PR `staging → main`.

### `/ship-plan NNN [--local]` : du plan à la PR

La boucle principale, pour tout changement dont tu as écrit le plan
(`/feature` l'écrit pour toi). Claude fait le reste et termine par `/ship`.
Avec `--local`, elle s'arrête au commit, avant que quoi que ce soit ne quitte
ta machine.

```mermaid
flowchart LR
  P[plans/NNN-*.md] --> T[test-writer :<br/>tests en échec]
  T --> I[implémentation]
  I --> V[lint, types,<br/>tests]
  V --> R[payload-reviewer<br/>ui-reviewer]
  R -->|remarques| I
  R --> C[commit,<br/>plan supprimé]
  C --> SH["/ship : PR,<br/>CI suivie"]
```

1. **Écrire le plan** dans `plans/`, à partir de
   [`plan-template.md`](../.claude/skills/ship-plan/plan-template.md). Les
   sections **Target** (ce qui doit être vrai à la fin) et **Vérification**
   (comment le prouver) sont obligatoires. **Décisions ouvertes** liste ce que
   Claude doit te demander au lieu de le deviner.
2. **Lancer `/ship-plan NNN`.** La commande lit les **Décisions** de
   `plans/README.md` (elles s'imposent au plan), crée une branche depuis
   `staging`, et fait écrire les tests par `test-writer` à partir de la Target,
   avant que le code n'existe : ils échouent d'abord. Ensuite elle implémente,
   lance les vérifications, et fait relire le diff par les reviewers. Chaque
   remarque est corrigée, rejetée avec une raison, ou reportée dans le backlog.
3. **Lire le rapport.** Il liste ce qu'il te reste à vérifier à l'œil : le
   ressenti d'une animation, le mobile sur un vrai téléphone, le mode sombre,
   les deux langues.
4. **Relire et merger la PR** qu'elle a ouverte, une fois sa CI verte.

`plans/` est ignoré par git exprès, puisque le dépôt est public. Une fois un
plan livré, son résumé vit dans le message du commit (`Plan: NNN`). Le fichier
est supprimé, et ce qu'il laissait de côté passe dans le **Backlog** de
`plans/README.md`.

### `/bug <description>` : du bug à la PR

Un bug est corrigé quand un test qui le reproduisait passe. `/bug` reformule
le bug, le reproduit par un test qui échoue au niveau le plus bas possible
(unitaire, intégration, dom, e2e), corrige la **cause** (et le même motif
ailleurs, quand c'est sûr), vérifie que le test échoue de nouveau sans le
correctif, puis lance les vérifications et les reviewers, et livre avec
`/ship` : un commit `fix(…)` dont le corps nomme la cause et le test. Elle ne
te demande quelque chose que si elle n'arrive pas à reproduire, ou si le
correctif devient un plan (une migration, beaucoup de fichiers, un choix de
comportement). Un hotfix direct sur `main`, seulement avec ton accord.

### `/flaky [e2e|unit|int] [--repeat N]`

La CI relance deux fois un test e2e en échec : un test instable y paraît vert
jusqu'au jour où il échoue trois fois. `/flaky` les repère dans l'historique de
la CI (runs relancés sur le même commit, tests réussis à la relance) et en les
répétant en local sans relance, trouve la cause (contenu de test partagé entre
specs, animation d'entrée encore en cours, ordre des tests), corrige le test
(ou l'app via `/bug` si c'est une vraie course), le prouve par N passages verts
d'affilée, et livre. Elle n'augmente jamais `retries` et ne saute jamais un
test. Les cas connus sont gardés dans le skill. Les échecs `mobile-safari`
s'étudient depuis la CI, puisque WebKit ne s'installe pas ici.

### `/audit [--local] [seo|a11y|perf] [chemin…]`

Là où `/site-health` surveille la production chaque semaine et compare,
`/audit` creuse une fois, puis corrige :

- **SEO**, page par page dans les deux langues : canonical égal à l'URL de la
  page, `hreflang` vers la même page dans l'autre langue, titres et
  descriptions, images Open Graph qui répondent, JSON-LD, robots et sitemap
  (chaque URL en 200), vraies 404, l'admin hors de l'index, redirection
  permanente de `zolangivre.com` vers `www` ;
- **accessibilité** : Lighthouse, l'arbre d'accessibilité, les contrastes avec
  l'accent du CMS dans les deux thèmes, le mouvement réduit ;
- **performance** : Lighthouse et traces, mobile puis desktop.

Tu choisis les corrections dans le rapport ; chaque thème devient une branche
et une PR, avec la mesure avant → après. `--local` audite le build de
production de la branche, avec le contenu de test, au lieu de la production.

### `/menage [--dry-run]`

Chaque `/feature`, `/bug` et `/ship` laisse une branche derrière lui, et le
dépôt ne les supprime pas au merge. `/menage` liste les branches locales
mergées (ou dont la PR a été mergée sur GitHub), les branches distantes de PR
mergées ou fermées, les worktrees abandonnés et les PR sans activité depuis
30 jours, puis ne supprime que ce que tu confirmes. Il ne touche jamais à
`main`, `staging`, la branche courante, les branches des bots, ni à une
branche dont des commits ne sont poussés nulle part.

### `/security-sweep` : ce que Dependabot et CodeQL laissent ouvert

Dependabot ouvre les PR de mise à jour tout seul. Il ne sait pas corriger une
dépendance **transitive** vulnérable dont le parent impose l'ancienne version,
et CodeQL se contente de signaler. Le balayage s'occupe des deux, et des PR
Dependabot dont la CI est rouge :

- **Alertes transitives** : une surcharge `pnpm.overrides` limitée à la plage
  vulnérable et épinglée sur la première version corrigée
  (`"undici@<7.29.1": "7.29.1"`), installée avec un délai minimum de 3 jours
  après publication, comme le délai de Dependabot.
- **Aucun correctif possible** (pas de version corrigée, ou seulement en
  changeant de version majeure) : une proposition de rejet de l'alerte, avec sa
  raison et la commande `gh api` exacte. Il ne rejette jamais rien lui-même.
- **Alertes CodeQL** : la plus petite modification de code qui satisfait la règle.
- **PR Dependabot en échec** : un petit correctif poussé sur la branche de la
  PR, ou un diagnostic en commentaire si le changement est plus gros.

Il ne touche jamais aux versions de `payload`, `@payloadcms/*`, `next` et
`react` : elles relèvent de `/upgrade-payload`. Les alertes Dependabot se
ferment quand le correctif arrive sur `main`, pas au merge de la PR du balayage.

En local, la commande fait la boucle complète, vérifications comprises. Le
workflow quotidien lance le même skill en mode CI (voir
[Les workflows GitHub](#les-workflows-github)). Quand il a
corrigé quelque chose, sa PR porte le rapport. Quand il n'y avait rien à
corriger, le **Summary** du run indique seulement combien d'alertes restent :
les résumés de run sont publics sur ce dépôt, les alertes Dependabot non, donc
les propositions de fermeture s'obtiennent avec un `/security-sweep` en local.

### `/upgrade-payload <version | numéro de PR>`

Une mise à jour de Payload peut modifier la base sans aucun changement de
config de notre côté : la 3.90 a ajouté des colonnes, la 3.91 seize index.
Vercel lance `payload migrate` à chaque déploiement, donc une migration
manquante casse le site, pas seulement un test.

La commande lit les notes de version pour ce qui concerne ce projet, régénère
les types et l'import map de l'admin, et lance le test de dérive du schéma
(voir plus bas). À partir de son résultat, elle écrit la migration, puis lance
toutes les vérifications, e2e compris, et payload-reviewer, et termine par
`/ship`. Une nouvelle version majeure (4.x) devient un plan à la place.

Avec un numéro de PR, elle travaille sur la PR `payload-next-react` de
Dependabot. Cette PR peut être incomplète : pour la 3.91, elle montait `payload`
mais pas `@payloadcms/*`.

### `/new-migration <slug>`

`payload migrate:create` ne fonctionne pas dans ce dépôt : ses instantanés sont
périmés. Les migrations s'écrivent à la main, et c'est ce que fait cette
commande. Elle part du SQL affiché par le test de dérive, le rend idempotent,
écrit un `down` qui l'annule, l'enregistre dans `src/migrations/index.ts`, et
le prouve avec `migrate`, `migrate:down`, `migrate`, puis les tests
d'intégration.

### `/pre-pr [--e2e]`

Les mêmes vérifications que la CI, en local : lint, typecheck, couverture des
tests unitaires, intégration, et e2e avec `--e2e`. Elle vérifie aussi les
messages de commit (release-please ignore les autres), qu'un changement de
schéma s'accompagne d'une migration, et que les types générés sont à jour.
Elle fait un rapport et ne modifie rien.

### `/content-audit [URL du site]`

Lit tous les globals et collections publiques via l'API publique de Payload,
dans les deux langues à la fois, et vérifie :

- les champs remplis dans une seule langue, et les textes restés non traduits ;
- les coquilles et la typographie française et anglaise ;
- les noms et intitulés de poste écrits de façon différente selon les pages ;
- les descriptions SEO manquantes ;
- les informations dépassées par rapport à ton profil.

Elle écrit `plans/textes-audit-<date>.md`, où chaque bloc est le texte complet
d'un champ, prêt à coller dans l'admin. Elle n'écrit jamais dans Payload. Les
médias ne sont pas publics, donc les textes alternatifs des images ne sont pas
couverts.

### `/site-health [URL du site]`

Un bilan hebdomadaire de la production, comparé au précédent :

- les déploiements, les erreurs d'exécution et le trafic, via le connecteur Vercel ;
- chaque page du sitemap et chaque lien externe du contenu ;
- Lighthouse et les Core Web Vitals sur trois pages, via chrome-devtools.

Elle écrit `plans/sante-<date>.md` et ajoute les vrais problèmes au Backlog.
Lecture seule : aucun déploiement, retour en arrière ni changement de
variable. Le vérificateur de liens ignore les hôtes locaux et ne suit pas les
redirections.

### `/triage-deps <numéro de PR>`

Pour toute PR Dependabot, sauf Payload/Next/React (celles-là passent par
`/upgrade-payload`). La commande lit tous les changelogs entre les deux
versions et cherche dans le code les API qui ont changé. Elle merge ensuite
la PR dans le `staging` actuel, sur une branche jetable, et lance toutes les
vérifications, e2e compris. Pour un paquet qui tourne dans le navigateur
(motion, next-themes, la lightbox), elle démarre aussi le build de production
avec les données de test, et mesure les écrans concernés avec
chrome-devtools : les apparitions qui finissent visibles, les valeurs liées
au scroll, le mouvement réduit, la console.

Le verdict est **mergeable**, **mergeable, à vérifier à l'œil** (avec les
cinq minutes de choses à regarder sur staging) ou **bloquant**. Il dit aussi
quand merger par rapport à la release en attente. La commande ne merge, ne
pousse et ne commente rien, et te laisse sur un `staging` propre.

### `/preview-check [local | URL]`

Ce que les tests ne voient pas : une ombre perdue en mode sombre, un menu qui
saute, un ressort qui n'a plus le même ressenti. Vercel ne déploie que
`staging` et `main`, donc la commande compare **le déploiement de staging
avec la production** :

- des captures pleine page de l'accueil, d'un projet, du journal, d'un
  article et de la 404, en fr/en, clair/sombre, ordinateur/mobile, côte à
  côte ;
- les interactions : menu mobile, thème, langue, filtres du journal,
  inclinaison des cartes, barre de lecture, validation du formulaire de
  contact (jamais envoyé) ;
- le mouvement réduit, et la console sur chaque page.

Avec `local`, elle vérifie la branche en cours sur le build de test, et ne
cherche que les mises en page cassées. Les captures vont dans
`plans/.preview/`. Lecture seule.

### `/release` et `/release verify`

Une release, c'est trois merges dans un ordre fixe, puis un déploiement qui
lance `payload migrate` sur la base de production. `/release` :

1. trie les PR ouvertes : part maintenant, a d'abord besoin d'un verdict,
   attend ;
2. vérifie que la CI de staging et son déploiement Vercel sont verts ;
3. lit chaque migration qui va tourner sur la production ;
4. ouvre ou met à jour la PR `staging → main`, construite à partir des
   commits et de la PR release-please ;
5. te donne l'ordre des merges. C'est toi qui merges.

Après le merge, `/release verify` vérifie la production sur Vercel : le build
est `READY`, `payload migrate` a appliqué chaque nouvelle migration, aucune
nouvelle erreur d'exécution, chaque page principale répond 200, la release
GitHub existe. Si la prod est cassée, elle le dit et explique comment revenir
en arrière, sans le faire.

## Les sous-agents

Tu les appelles rarement toi-même, puisque les commandes les lancent. Tu peux
quand même en demander un directement, par exemple « demande à
payload-reviewer de relire cette branche ».

| Agent                                                       | Regarde                                                                                                                                                                                                                                                    | Écrit                                                                  |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| [`payload-reviewer`](../.claude/agents/payload-reviewer.md) | Le back-end : règles d'accès (les API REST et GraphQL sont publiques), schéma comparé aux migrations, tags de cache et revalidation, `visibility` et `locale` dans les requêtes, server actions, hooks qui appellent des services externes                 | Rien, il fait un rapport                                               |
| [`ui-reviewer`](../.claude/agents/ui-reviewer.md)           | Le front-end : les deux langues, les tokens d'animation et le mouvement réduit, le survol sur écran tactile, l'accessibilité, la direction artistique arrondie du site, la frontière serveur/client                                                        | Rien, il fait un rapport                                               |
| [`test-writer`](../.claude/agents/test-writer.md)           | La Target d'un plan                                                                                                                                                                                                                                        | Des tests sous `tests/`, au niveau le plus bas qui suffit à la prouver |
| [`webkit-reviewer`](../.claude/agents/webkit-reviewer.md)   | Safari et iOS, que seule la CI peut lancer : transitions de vue, coins arrondis rognés, `backdrop-filter`, `100vh` et éléments fixes, scroll-snap, support des fonctionnalités, vidéo, focus ; et les résultats `mobile-safari` du run de CI de la branche | Rien, il fait un rapport                                               |

## Le test de dérive du schéma

[`tests/int/schemaDrift.int.spec.ts`](../tests/int/schemaDrift.int.spec.ts)
tourne avec les tests d'intégration, en local comme en CI. Il construit la base
à partir des seules migrations, demande à Drizzle ce qu'il changerait pour
qu'elle corresponde à la config, et échoue en affichant ce SQL. Un changement
de schéma sans sa migration fait donc échouer la CI, qu'il vienne de ta config
ou d'une mise à jour de Payload, et le message d'échec est le point de départ
de la migration. Les valeurs par défaut des colonnes sont ignorées : Payload
les applique lui-même.

## Les workflows GitHub

| Workflow                                                        | Se lance                                                              | Fait                                                                                                                                                                                                                                                     |
| --------------------------------------------------------------- | --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`ci.yml`](../.github/workflows/ci.yml)                         | À chaque push et chaque PR                                            | Lint, typecheck, tests unitaires, d'intégration (test de dérive compris) et e2e (sautés sur les PR qui ne touchent qu'à la doc, `.claude/` ou la config GitHub), et sur les PR la vérification des docs fr/en ci-dessous. Son token est en lecture seule |
| [`claude-review.yml`](../.github/workflows/claude-review.yml)   | Quand une PR vers `staging` reçoit le label `review`, et seulement là | Lance payload-reviewer et/ou ui-reviewer sur le diff, vérifie chaque remarque, poste celles qui sont confirmées en commentaires sur les lignes, plus un résumé                                                                                           |
| [`security-sweep.yml`](../.github/workflows/security-sweep.yml) | Chaque nuit à 0 h 17 UTC, et à la main depuis l'onglet Actions        | Récupère les alertes ouvertes. Si la liste a changé depuis le dernier passage, lance `/security-sweep` en mode CI et ouvre ou met à jour une seule PR vers `staging`                                                                                     |
| [`release.yml`](../.github/workflows/release.yml)               | Push sur `staging`                                                    | La PR de version de release-please (voir le README)                                                                                                                                                                                                      |

La revue ignore les brouillons, les forks, Dependabot, release-please, la PR de
release, la PR du balayage lui-même, et les PR qui ajoutent des liens
symboliques. Pour faire relire de nouveaux commits sur une PR, retirer le label
`review` puis le remettre. Elle ne tourne jamais toute seule : mets le label
sur les PR faites à la main, les gros changements, et tout ce qui touche aux
règles d'accès ou à la base. Un changement livré avec `/ship-plan` a déjà été
relu par les mêmes agents.

**La vérification des docs fr/en** fait échouer une PR qui modifie
`README.md` ou un `docs/*.md` sans son jumeau `.fr.md`, ou l'inverse. Chaque
`*.fr.md` suivi par git est apparié automatiquement. Pour un changement
vraiment d'un seul côté (une coquille en français), ajoute une ligne
`Docs-Sync: skip` dans un des messages de commit de la PR.

**En mode CI, le balayage n'exécute aucun code de dépendance** : il installe
avec `--ignore-scripts` et ne lance aucun test. La PR qu'il ouvre est vérifiée
par `ci.yml`, dont le token est en lecture seule.

### Ce qui consomme ton quota Claude

Deux workflows lancent Claude tout seuls, avec `CLAUDE_CODE_OAUTH_TOKEN`. Ils
comptent donc dans les mêmes limites d'abonnement que ton propre usage de
Claude :

| Workflow             | Quand Claude tourne vraiment                                                                                                                                                                            | Coût habituel                                                     |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `claude-review.yml`  | Seulement quand tu ajoutes le label `review` à une PR vers `staging`. Jamais tout seul, et jamais sur Dependabot, release-please, la PR de release ni le balayage                                       | Une session de revue par PR, plus longue si le diff est gros      |
| `security-sweep.yml` | Démarre chaque nuit à 0 h 17 UTC (2 h 17 à Paris l'été, 1 h 17 l'hiver), mais Claude ne tourne que si l'ensemble des alertes ouvertes a changé depuis la dernière fois, ou quand tu le lances à la main | Rien la plupart des jours ; une session quand les alertes bougent |

Tout le reste n'en consomme pas : `ci.yml` et `release.yml` n'appellent pas
Claude, et les commandes ci-dessus ne tournent que quand tu les tapes, dans ta
propre session. Pour en mettre un en pause : onglet Actions, ⋯ → Disable
workflow.

### Ce qui protège ces workflows

Les deux confient un token capable d'écrire dans le dépôt à un agent qui lit
du texte écrit par des tiers (alertes, contenu des PR), sur un dépôt public.
Une série de revues de sécurité automatiques, et CodeQL, les ont façonnés :

- Claude ne peut lancer qu'une liste précise de commandes. Tout ce qui pourrait
  publier un fichier, lancer un programme via git ou lire hors du dépôt est
  interdit (`--body-file`, `difftool`, `/proc`, substitution de commande…).
- La revue charge ses règles (`.claude/`, tous les `CLAUDE.md` et `AGENTS.md`)
  depuis `staging` : une PR ne peut pas réécrire sa propre revue.
- Le token des alertes ne sert qu'à l'étape de collecte, jamais à Claude. Le
  texte des alertes est nettoyé et traité comme une donnée, pas comme une
  instruction.
- Chaque action est épinglée sur un commit précis, et Dependabot tient ces
  épinglages à jour.

Les vraies limites sont côté GitHub : la protection des branches et les
permissions de l'app. Voir l'installation ci-dessous.

## Installation

Ce qui doit exister pour que la partie GitHub fonctionne :

1. **L'app GitHub Claude** sur ce dépôt : `/install-github-app` dans Claude
   Code, ou https://github.com/apps/claude. Ne pas ajouter les workflows
   qu'elle propose : ce dépôt a les siens.
2. **Le secret `CLAUDE_CODE_OAUTH_TOKEN`** : `claude setup-token`, connecté avec
   le compte claude.ai qui a l'abonnement Pro ou Max, puis
   `gh secret set CLAUDE_CODE_OAUTH_TOKEN -R zolangivre/portfolio`. Les passages
   consomment le quota de cet abonnement.
3. **Le secret `SECURITY_ALERTS_TOKEN`** : un token d'accès personnel à
   granularité fine (fine-grained), limité à ce dépôt, avec **Dependabot
   alerts** et **Code scanning alerts** en lecture seule, et rien d'autre.
   `GITHUB_TOKEN` ne peut pas lire les alertes Dependabot. Ce token expire, et
   à ce moment-là le balayage échoue dès sa première étape.
4. **Le label `review`.**
5. **La protection des branches** : une seule règle, `staging and main`, dans
   Settings → Rules → Rulesets. Elle exige une PR, **sans approbation** : GitHub
   ne te laisse pas approuver tes propres PR, donc une approbation bloquerait
   tous les merges. Elle exige que les checks de la CI passent : Changes, Lint &
   typecheck, Unit tests, Integration tests, E2E tests, Docs fr/en in sync. Un
   job sauté par sa condition (une PR de doc, une PR de release) compte comme
   réussi, donc rien ne reste bloqué en attente. Les branches n'ont pas besoin
   d'être à jour avant le merge, sinon chaque PR Dependabot devrait être
   rebasée dès que `staging` bouge. Le force push et la suppression sont
   bloqués. **Repository admin** est dans la liste de contournement, pour les
   urgences ; chaque contournement est enregistré. L'app Claude, elle, ne peut
   pas contourner ces règles.
6. **Les workflows sur `main`.** L'action Claude ne lance qu'un workflow dont le
   fichier est identique sur la branche par défaut, et les workflows planifiés
   ne tournent que depuis celle-ci. Tant qu'une release ne les a pas amenés sur
   `main`, les deux workflows s'arrêtent en quelques secondes sans rien faire.

## Dépannage

| Symptôme                                                                                                  | Cause                                                                                                                       |
| --------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Le job de revue réussit en quelques secondes et ne poste rien ; le log dit « Workflow validation failed » | Le workflow n'est pas encore identique sur `main`, ou la PR le modifie. Dans les deux cas, c'est normal                     |
| Le balayage échoue à « Fetch open alerts »                                                                | `SECURITY_ALERTS_TOKEN` manque ou a expiré                                                                                  |
| Le balayage tourne mais ne fait rien                                                                      | La liste des alertes ouvertes n'a pas changé depuis le dernier passage. Le lancer à la main pour forcer                     |
| Le test de dérive échoue                                                                                  | Il manque une migration. Le message d'erreur donne le SQL ; lancer `/new-migration`                                         |
| Tous les tests e2e échouent avec « Executable doesn't exist »                                             | Playwright a été mis à jour : `pnpm exec playwright install chromium`                                                       |
| Les tests d'intégration ou e2e n'arrivent pas à se connecter                                              | Postgres ne tourne pas : `docker compose up -d postgres`                                                                    |
| `claude setup-token` dit qu'il faut un abonnement Pro ou Max                                              | Le navigateur est connecté à un compte claude.ai sans abonnement. Se connecter avec celui qui l'a (une fenêtre privée aide) |

## Modifier un workflow

Le comportement de chaque commande est dans son `SKILL.md`, et celui de chaque
agent dans son fichier `.md` : ils se modifient comme du code, dans une PR. Une
modification de `.claude/` s'applique à la revue GitHub une fois mergée dans
`staging`. Une modification d'un fichier de workflow s'applique une fois arrivée
sur `main`.
