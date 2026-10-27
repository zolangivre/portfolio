# Sous-agents

[English](subagents.md) · **Français**

Les quatre agents de [`.claude/agents/`](../../.claude/agents/). Les
commandes les lancent pour un second avis ; tu en appelles rarement un
toi-même, mais c'est possible (« demande à payload-reviewer de relire cette
branche »). Retour à la [vue d'ensemble](README.fr.md).

Chacun démarre avec un contexte neuf : il ne voit pas la conversation,
seulement le diff, le plan s'il y en a un, et le dépôt. Il juge donc le
changement par rapport au plan, pas le raisonnement qui l'a produit. Les
quatre tournent sur Sonnet.

| Agent                                   | Regarde             | Peut                                                | Lancé par                                                                    |
| --------------------------------------- | ------------------- | --------------------------------------------------- | ---------------------------------------------------------------------------- |
| [`test-writer`](#test-writer)           | La Target d'un plan | Écrire et lancer des tests, sous `tests/` seulement | `/ship-plan` (donc `/feature`), avant tout code                              |
| [`payload-reviewer`](#payload-reviewer) | Le back             | Lire, `git`, `grep`, `migrate:status`               | `/ship-plan`, `/bug`, `/upgrade-payload`, `/security-sweep`, la revue GitHub |
| [`ui-reviewer`](#ui-reviewer)           | Le front            | Lire, `git`, `grep`, lint, `tsc`                    | `/ship-plan`, `/bug`, `/security-sweep`, la revue GitHub                     |
| [`webkit-reviewer`](#webkit-reviewer)   | Safari et iOS       | Lire, `git`, `grep`, lectures `gh`                  | `/ship-plan`, quand le diff touche ce que WebKit casse                       |

Les trois reviewers suivent les mêmes règles : seulement des problèmes
qu'ils peuvent montrer dans le code (ou dans un log de CI), pas de remarques
de style, pas de conseils génériques. Chaque constat vient avec `fichier:ligne`,
un scénario concret où ça casse, et le correctif. Rien n'a tenu ? Une ligne
pour le dire. Ils ne modifient aucun fichier.

## Quel reviewer pour quels fichiers

Tiré de l'étape 5 de [`/ship-plan`](skills.fr.md#ship-plan-nnn---local--dun-plan-à-une-pr),
et utilisé aussi par la [revue GitHub](github-agents.fr.md#la-revue-de-pr) :

| Modifié                                                                                                                                                                                                                       | Reviewer           |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| `src/collections`, `src/globals`, `src/fields`, `src/hooks`, `src/lib/access.ts`, `src/lib/actions`, `src/lib/queries`, `src/lib/cache.ts`, `src/migrations`, `src/payload.config.ts`, `src/proxy.ts`                         | `payload-reviewer` |
| `src/components`, `src/app/(frontend)`, tout `.css`, `src/lib/motion`, `src/lib/i18n`                                                                                                                                         | `ui-reviewer`      |
| Animations ou view transitions, défilement ou étagères, l'en-tête ou le menu mobile, une modale ou la lightbox, la vidéo, le focus, du CSS avec `position`, `overflow`, `backdrop-filter`, des unités de viewport ou `:has()` | `webkit-reviewer`  |
| Seulement de la doc, des tests ou de la CI                                                                                                                                                                                    | aucun              |

Ceux qui s'appliquent tournent en parallèle, dans le même message. Leurs
constats sont ensuite triés par la session qui les a appelés : corrigés,
rejetés avec une raison, ou reportés dans le Backlog.

## `test-writer`

Écrit les tests qu'un plan demande, **à partir de la Target, pas de
l'implémentation** : le code n'existe peut-être pas encore, et un test copié
dessus ne prouve rien. Il lit le plan, reprend le style des tests existants,
et ne lit les fichiers source que pour leur surface publique.

Il choisit la couche la plus basse qui peut prouver la Target :

| Couche | Où                        | Pour                                                                                                     |
| ------ | ------------------------- | -------------------------------------------------------------------------------------------------------- |
| unit   | `tests/unit/*.spec.ts`    | la logique pure de `src/lib`, `src/hooks`, `src/proxy.ts`, le sitemap ; les I/O mockées                  |
| int    | `tests/int/*.int.spec.ts` | le vrai Payload : règles d'accès (`overrideAccess: false`), schéma, hooks contre la base                 |
| dom    | `tests/dom/*.spec.tsx`    | l'état, l'ARIA et le clavier d'un composant, dans jsdom                                                  |
| e2e    | `tests/e2e/*.e2e.spec.ts` | les parcours visiteur sur le build de production ; le contenu de test dans `fixtures.ts` et `prepare.ts` |

Règles : seulement sous `tests/`, jamais `src/` ; chaque test échoue
aujourd'hui pour la raison que donne le plan (il les lance et lit le
message) ; les éléments trouvés comme un visiteur les trouve (`getByRole`,
`getByLabel`, texte français) ; ni snapshots, ni `waitForTimeout`, ni
assertions sur des noms de classe ; la couverture reste au-dessus de 90 % sur
`src/lib` et `src/hooks` ; jamais toute la suite e2e. Ce qui ne se teste pas
(le ressenti d'une animation) va dans sa liste « à vérifier à l'œil », qui
finit dans la PR.

## `payload-reviewer`

Le back, à partir de `git diff origin/staging...HEAD`, avec les références
du [skill `payload`](skills.fr.md#payload) sous la main :

1. **Contrôle d'accès.** Les API REST et GraphQL sont publiques et répondent
   d'après les seules règles d'accès. Chaque collection et global a un accès
   explicite ; les collections avec `visibility` utilisent
   `readPublicOrAuthenticated` ; `messages` est le seul `create` public, et
   son action serveur valide et plafonne les entrées. Les appels à la Local
   API avec des entrées venant de la requête demandent
   `overrideAccess: false`. Les hooks qui écrivent passent `req` et ne
   bouclent pas.
2. **Dérive entre schéma et migrations.** Chaque changement de config qui
   modifie la forme de la base a une migration correspondante et
   enregistrée, avec un `down` qui l'annule et les données copiées avant
   qu'une colonne disparaisse.
3. **Cache et revalidation.** Chaque requête de `src/lib/queries` liste, dans
   ses tags de cache, chaque slug que son résultat embarque (une nouvelle
   relation, c'est un nouveau tag). Les collections et globals affichés ont
   les hooks de revalidation.
4. **Requêtes, actions serveur, hooks.** `visibility: public` dans la liste
   **et** dans la requête par slug, `locale` dans la requête et dans la clé de
   cache, les actions serveur validées et plafonnées, les services externes
   (Resend) qui ne peuvent pas faire échouer un enregistrement, aucun secret
   en `NEXT_PUBLIC_`, les nouvelles variables d'env dans `.env.example`.

## `ui-reviewer`

Le front, à partir de `git diff staging...HEAD` et des modifications non
commitées, plus le plan s'il y en a un (faire ce que le plan demande n'est
pas un constat ; rater sa Target, si) :

1. **Langues.** Pas de français ou d'anglais en dur dans le JSX,
   `aria-label`, `alt` ou `title` ; les nouvelles clés du dictionnaire dans
   les deux langues ; dates et nombres dans la langue courante.
2. **Mouvement.** Durées et courbes tirées de `src/lib/motion/tokens.ts` et
   des propriétés CSS correspondantes, gardées en phase ; `transform` et
   `opacity` seulement ; pas d'entrée en `scale(0)` ; une règle
   `prefers-reduced-motion` pour chaque animation CSS ; les effets de survol
   dans `@media (hover: hover) and (pointer: fine)`.
3. **Accessibilité.** De vrais boutons et liens, un libellé sur les
   contrôles à icône seule, un focus visible, les alt venant de Media.
4. **Direction de design.** Arrondi et artistique, pas technique : pas de
   monospace, de préfixes `//` ni de motifs de grille, pas de rayon sous
   ~16px sur les cartes et les boutons, Bagel Fat One seulement pour le nom
   du hero et le logo, des tokens de thème plutôt que des couleurs en dur.
5. **Frontière serveur/client.** `'use client'` seulement là où il faut ;
   aucun composant client n'importe `payload`.

## `webkit-reviewer`

WebKit ne s'installe pas sur ce Mac : le projet Playwright `mobile-safari`
(iPhone 15, `mobile.e2e.spec.ts` et `navigation.e2e.spec.ts`) ne tourne
qu'en CI. Cet agent travaille à partir du code et de la CI :

1. **Le diff**, à la recherche des pièges WebKit : view transitions (Safari
   18+, noms uniques), `overflow: hidden` + `border-radius` au-dessus d'un
   enfant composité (coins carrés sans `isolation: isolate`),
   `-webkit-backdrop-filter`, `100vh` sous la barre d'iOS, `fixed`/`sticky`
   sous un ancêtre transformé, les marges de zone sûre, scroll-snap, le
   support des fonctionnalités (les deux dernières versions de Safari),
   l'autoplay vidéo (`muted playsinline`), les champs sous 16px qui zooment,
   le survol qui reste collé, Tab qui saute les liens,
   `new Date('YYYY-MM-DD HH:mm')`.
2. **La CI** : le dernier passage de la branche, les échecs et instabilités
   `mobile-safari`, le rapport et les traces Playwright. Chacun est classé en
   différence Safari attendue (le test s'adapte), vrai bug WebKit (fichier et
   ligne), ou instabilité (voir `/flaky`).
3. **La couverture** : un parcours téléphone touché par le diff qu'aucune
   spec `mobile-safari` ne couvre, avec le test à ajouter à
   `mobile.e2e.spec.ts`.

## Modifier un agent

L'en-tête fixe son `name`, la `description` que Claude lit pour décider
quand l'utiliser, ses `tools` et son `model`. Le corps est toute sa
consigne : on le modifie comme du code, dans une PR. La revue GitHub lit les
agents depuis `staging`, donc un changement l'atteint une fois mergé.
