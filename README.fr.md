# Payload Portfolio

[English](README.md) · **Français**

Portfolio de développeur bilingue (FR/EN), entièrement piloté par un CMS : contenu, sections, thème et SEO se gèrent depuis l'admin Payload, sans toucher au code.

**Stack** : [Next.js 16](https://nextjs.org) (App Router) · [Payload CMS 3](https://payloadcms.com) · PostgreSQL · [Tailwind CSS 4](https://tailwindcss.com) · TypeScript · React 19 · [Motion](https://motion.dev)

## Fonctionnalités

- **Bilingue FR/EN** : localisation native de Payload (français par défaut, avec repli automatique), détection de la langue par le middleware, routes préfixées `/fr` et `/en`
- **Thème clair/sombre** : bascule sans flash (`next-themes`), couleur d'accent réglable depuis l'admin (Global Settings → Theme), variante sombre facultative pour les logos de projets
- **Sections modulables** : chaque section de l'accueil (hero, projets, expérience, formation, compétences, à propos, témoignages, contact) s'affiche ou se masque, et ses textes se modifient depuis l'admin
- **Ordre d'affichage manuel** : un champ `order` sur les projets, expériences, formations et entrées du journal. `1` s'affiche en premier, et les entrées sans valeur suivent, triées par date
- **Journal** : entrées personnelles (voyages, sport, événements…) avec catégories filtrables et visibilité publique ou privée
- **SEO** : métadonnées générées par `@payloadcms/plugin-seo` pour les projets, le journal et le hero ; robots.txt, et un sitemap qui couvre toutes les pages dans les deux langues (accueil, archive des projets, journal et chaque page détail), avec les alternatives `hreflang`
- **Aperçus de partage** : chaque page génère sa propre image Open Graph de 1200×630 (`opengraph-image.tsx`) avec la couleur d'accent du site, le titre de la page et ses métadonnées. Une image choisie dans l'onglet SEO d'un document la remplace
- **Archive des projets** : `/projects` liste tous les projets publiés, avec un filtre par technologie, en plus de la section de l'accueil
- **Notification de contact** : un e-mail facultatif (via Resend) dès qu'un message arrive par le formulaire, pour ne pas le découvrir seulement dans l'admin
- **Revalidation automatique** : un enregistrement dans l'admin invalide exactement les pages qui affichent ce contenu, par tag de cache, dans les deux langues (avec une revalidation toutes les 24 h comme filet de sécurité)
- **Fichiers** : sur le disque local en développement, sur [Cloudflare R2](https://developers.cloudflare.com/r2/) en production via `@payloadcms/storage-s3` (activé par `R2_ACCESS_KEY_ID`). Les fichiers sont servis directement depuis le domaine public du bucket, sans passer par une fonction Vercel. Les images sont redimensionnées à 1920 px maximum et converties en WebP à l'envoi. Les vidéos partent du navigateur directement vers R2 avec une URL pré-signée, ce qui contourne la limite de 4,5 Mo des requêtes Vercel

## Démarrage rapide

Prérequis : Node 24+, pnpm, PostgreSQL (ou Docker).

```bash
git clone <repo>
cd payload-portfolio
cp .env.example .env   # renseigner DATABASE_URL et PAYLOAD_SECRET
pnpm install
pnpm dev
```

Ouvrir <http://localhost:3000/admin> et suivre les instructions pour créer le premier compte admin. Le site public est sur <http://localhost:3000>.

### Avec Docker

Le `docker-compose.yml` lance l'application (avec rechargement à chaud) et PostgreSQL :

```bash
docker compose up -d
```

La base est exposée sur `127.0.0.1:5432`, le site sur le port 3000. Le `DATABASE_URL` du conteneur est défini dans le fichier compose ; `.env` sert pour tout le reste.

> **Sur macOS** : l'observateur de fichiers peut rater des modifications faites à travers le volume Docker. Si un changement de code ne semble pas pris en compte : `docker exec payload-portfolio-payload-1 touch <fichier>`, ou redémarrer le conteneur.

## Variables d'environnement

| Variable                    | Description                                                                                                           |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`              | Chaîne de connexion PostgreSQL                                                                                        |
| `PAYLOAD_SECRET`            | Clé secrète de Payload (sessions, jetons)                                                                             |
| `NEXT_PUBLIC_SITE_URL`      | URL publique du site (SEO, sitemap)                                                                                   |
| `R2_ACCESS_KEY_ID`          | _Facultatif en local._ Clé du jeton d'API R2 : envoie les fichiers sur Cloudflare R2. Sans elle, ils restent en local |
| `R2_SECRET_ACCESS_KEY`      | Secret de ce jeton d'API R2                                                                                           |
| `R2_ACCOUNT_ID`             | Identifiant du compte Cloudflare (sert à construire l'adresse de R2)                                                  |
| `R2_BUCKET`                 | Nom du bucket R2                                                                                                      |
| `R2_PUBLIC_URL`             | Domaine public du bucket : les URL des médias sont construites à partir de lui                                        |
| `RESEND_API_KEY`            | _Facultatif._ Active l'e-mail de notification du formulaire de contact. Sans elle, les messages restent dans l'admin  |
| `CONTACT_NOTIFICATION_FROM` | Adresse d'expédition de cette notification, sur un domaine vérifié chez Resend                                        |
| `CONTACT_NOTIFICATION_TO`   | Destinataire. Par défaut : l'e-mail de contact des Global Settings                                                    |

## Scripts

| Commande                                                               | Action                                                                                                 |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `pnpm dev`                                                             | Serveur de développement                                                                               |
| `pnpm devsafe`                                                         | Pareil, après avoir vidé le cache `.next`                                                              |
| `pnpm build` / `pnpm start`                                            | Build et serveur de production                                                                         |
| `pnpm generate:types`                                                  | Régénère `src/payload-types.ts` après un changement de schéma                                          |
| `pnpm payload migrate`                                                 | Applique les migrations en attente                                                                     |
| `pnpm payload migrate:status`                                          | État des migrations                                                                                    |
| `pnpm lint`                                                            | ESLint                                                                                                 |
| `pnpm knip`                                                            | Fichiers, dépendances et exports inutilisés                                                            |
| `pnpm analyze`                                                         | L'analyseur de bundle de Next : ce que contient le JavaScript de chaque route                          |
| `pnpm lighthouse`                                                      | Budgets de performance sur le build de production de test (Postgres local nécessaire)                  |
| `pnpm test`                                                            | Tests unitaires, de composants, puis d'intégration (Vitest), puis e2e (Playwright)                     |
| `pnpm test:unit` / `pnpm test:dom` / `pnpm test:int` / `pnpm test:e2e` | Chaque suite séparément                                                                                |
| `pnpm test:e2e:ui` / `pnpm test:e2e:report`                            | Mode UI de Playwright / rapport HTML du dernier passage e2e                                            |
| `pnpm test:coverage`                                                   | Tests unitaires avec couverture, en échec sous 90 % sur `src/lib`, `src/hooks`, le proxy et le sitemap |

## Modèle de contenu

### Collections

| Collection              | Rôle                                                                                                                                                             |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Projects**            | Projets du portfolio : description riche, image de couverture (+ variante sombre), galerie, technologies, liens GitHub et en ligne, statut, année, mise en avant |
| **Experiences**         | Parcours professionnel : poste, entreprise, technologies, dates                                                                                                  |
| **Education**           | Parcours de formation : diplôme, école, dates                                                                                                                    |
| **Skills**              | Compétences regroupées par catégorie                                                                                                                             |
| **Journal**             | Entrées personnelles avec catégorie, galerie et visibilité                                                                                                       |
| **Technologies**        | Étiquettes de technologies réutilisables (logo, couleur, site)                                                                                                   |
| **Companies / Schools** | Fiches entreprises et écoles (logo, site)                                                                                                                        |
| **Categories**          | Taxonomie partagée (technologies, projets, journal)                                                                                                              |
| **Testimonials**        | Témoignages                                                                                                                                                      |
| **Messages**            | Messages envoyés par le formulaire de contact                                                                                                                    |
| **Media**               | Fichiers envoyés (images, logos)                                                                                                                                 |
| **Videos**              | Captures vidéo, envoyées du navigateur directement vers R2                                                                                                       |
| **Users**               | Comptes admin                                                                                                                                                    |

### Globals

`Hero`, `About`, `Contact`, `Navigation`, `Footer`, `GlobalSettings` (thème, liens sociaux), `SectionsVisibility` (afficher ou masquer chaque section), `SectionsContent` (titres et introductions des sections).

### Ordre d'affichage

Les projets, expériences, formations et entrées du journal ont un champ **Order** facultatif : `1` s'affiche en premier, `2` en deuxième, etc. Les entrées sans valeur suivent, triées par date (année pour les projets, date de début pour l'expérience et la formation, date pour le journal). Les projets et entrées du journal mis en avant passent toujours en premier.

## Migrations

Le schéma Postgres est versionné dans [`src/migrations/`](src/migrations/). En développement, Payload synchronise le schéma tout seul (mode push) ; les migrations servent surtout pour la production :

```bash
pnpm payload migrate:status   # lister les migrations en attente
pnpm payload migrate          # les appliquer
```

Après tout changement de schéma, la migration s'écrit à la main : `payload migrate:create` ne fonctionne pas dans ce dépôt (instantanés périmés). La commande `/new-migration` de Claude Code s'en charge, et `tests/int/schemaDrift.int.spec.ts` échoue en affichant le SQL manquant dès que les migrations sont en retard sur la config. Lancer ensuite `pnpm generate:types`.

## Tests

- **Unitaires** (`tests/unit`) : logique pure, sans base de données. Toute entrée/sortie est simulée.
- **Intégration** (`tests/int`) : la vraie API locale de Payload, sur une base jetable `payload-portfolio-test` configurée dans [`.env.test`](.env.test). Postgres la crée au premier lancement ; chaque passage la supprime et la reconstruit avec `payload migrate:fresh`, ce qui prouve aussi que les migrations construisent toujours un schéma qui fonctionne en partant de zéro. La suite refuse de démarrer si `DATABASE_URL` n'est pas une base locale nommée `*-test`, et ne lit jamais `.env`.
- **Composants** (`tests/dom`) : composants React et hooks côté client avec Testing Library, dans jsdom : état, ARIA, minuteurs. Tournent avec les tests unitaires dans la CI.
- **E2E** (`tests/e2e`) : le site et l'admin via Playwright, sur un build de production (`next build && next start` sur le port 3100) et sa propre base `payload-portfolio-e2e-test`, configurée dans [`.env.e2e`](.env.e2e). [`tests/e2e/serve.ts`](tests/e2e/serve.ts) reconstruit la base à partir des migrations, y charge le contenu de [`tests/e2e/fixtures.ts`](tests/e2e/fixtures.ts), puis build dans `.next-e2e` : un dossier séparé, pour qu'un build e2e et un build classique ne partagent jamais de cache de données. Les tests qui modifient du contenu le font via l'API REST, puis le remettent en place. Deux projets Playwright : Chromium sur ordinateur lance tout ; `mobile-safari` (iPhone 15 sous WebKit) lance les tests de navigation et du menu mobile. Lancer `pnpm exec playwright install chromium webkit` une fois avant le premier passage en local.

```bash
pnpm test:unit        # aucune préparation
pnpm test:dom         # composants dans jsdom, aucune préparation
pnpm test:int         # Postgres local nécessaire (docker compose up postgres)
pnpm test:e2e         # Postgres local nécessaire ; build le site d'abord (~2 min)
pnpm test:e2e:serve   # garder un serveur prêt sur :3100, que test:e2e réutilise
pnpm test:e2e:ui      # mode UI de Playwright : lancer les tests un par un, revoir chaque étape
pnpm test:e2e:report  # ouvrir le rapport HTML du dernier passage
```

Un test e2e en échec garde une vidéo, une capture d'écran et une trace complète (DOM, réseau et console à chaque étape). Tout est dans le rapport HTML : en local avec `pnpm test:e2e:report`, et en CI dans l'artefact `playwright-report` du passage (le télécharger, puis `pnpm exec playwright show-report <dossier>`).

## CI/CD

- **GitHub Actions** ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) tourne à chaque push sur `main` ou `staging` et sur les pull requests, en quatre jobs parallèles, plus un job Lighthouse qui avertit sur les budgets de performance sans bloquer : lint et typecheck ; tests unitaires avec les seuils de couverture ; tests d'intégration sur un service PostgreSQL qui part vide et se construit à partir des seules migrations (`PAYLOAD_DB_PUSH=false`), de sorte qu'une migration qui ne s'applique plus sur une base neuve fait échouer la CI ; tests e2e sur un build de production avec du contenu de test (le rapport Playwright est joint au passage). Chaque job est sauté quand le code a déjà été testé : le passage `pull_request` de la PR `staging` → `main` (le passage `push` sur `staging` teste le même commit), ainsi que la PR de version de release-please et son merge dans `staging` (voir [Versions](#versions)). Sur une pull request qui ne modifie que de la doc, du Markdown, `.claude/` ou la config GitHub hors `ci.yml`, les jobs d'intégration et e2e sont aussi sautés ([`.github/ci-site-changed.sh`](.github/ci-site-changed.sh) liste ce qui peut être sauté sans risque, tout le reste les lance) ; le push sur `staging` après le merge relance tout.
- **Release** ([`.github/workflows/release.yml`](.github/workflows/release.yml)) : voir [Versions](#versions).
- **Contrôle de la production** ([`.github/workflows/production-check.yml`](.github/workflows/production-check.yml)) lit le site en ligne toutes les 3 heures : les pages répondent, et l’API renvoie toujours des projets et des entrées de journal publiés ([`.github/production-check.sh`](.github/production-check.sh)). Les pages seules ne suffisent pas : les requêtes attrapent les erreurs de base et affichent une page vide avec un 200. Un contrôle qui échoue ouvre une issue assignée au propriétaire, ce qui envoie l’e-mail, et le prochain contrôle réussi la ferme. Il se lance aussi à la main depuis l’onglet Actions.
- **Vercel** build avec `pnpm run ci` ([`vercel.json`](vercel.json)), qui applique les migrations en attente à la base de production avant `next build` : le schéma ne peut jamais être en retard sur le code déployé. Seules `main` (production) et `staging` (préproduction) sont déployées : `git.deploymentEnabled`, dans le même fichier, bloque toutes les autres branches (`feature/…`, Dependabot, la PR de version de release-please), qui ne déclenchent donc ni build ni migration.

## Workflows d'agents

Des commandes Claude Code, des sous-agents de revue et deux workflows GitHub (un balayage de sécurité quotidien, une revue des pull requests) aident à livrer les changements, les mises à jour et les correctifs. Ils proposent, et ne mergent ni ne déploient jamais rien. Comment chacun fonctionne, quand l'utiliser et comment l'installer : [docs/ai/](docs/ai/README.fr.md). Tout le reste de ce qui tourne tout seul (CI, Dependabot, releases, le hook git) est dans [docs/](docs/README.fr.md).

## Versions

Versions [SemVer](https://semver.org) déduites des messages de commit ([Conventional Commits](https://www.conventionalcommits.org)), vérifiés par `.githooks/commit-msg` (activé par `pnpm install`) :

| Commit                                         | Effet sur la version       |
| ---------------------------------------------- | -------------------------- |
| `fix`, `perf`, `refactor`, `revert`            | patch : 1.0.0 → 1.0.1      |
| `feat: …`                                      | mineure : 1.0.0 → 1.1.0    |
| `feat!: …` ou `BREAKING CHANGE:` dans le corps | majeure : 1.0.0 → 2.0.0    |
| `chore`, `docs`, `test`, `ci`, `build`…        | aucun, absent du CHANGELOG |

Même fonctionnement que patateprod-front et patateprod-back :

1. Pousser sur `staging` comme d'habitude. release-please ([`.github/workflows/release.yml`](.github/workflows/release.yml)) garde une PR « chore(staging): version X.Y.Z » ouverte vers `staging`, avec la version de `package.json` et le `CHANGELOG.md`.
2. Pour publier, merger cette PR dans `staging` : le tag `vX.Y.Z` et la Release GitHub sont créés.
3. Merger `staging` → `main` : Vercel déploie une seule fois, avec le bon numéro de version.

Merger `staging` → `main` juste après la PR de version : un commit poussé entre les deux partirait en production sous ce numéro sans apparaître dans son CHANGELOG. Première version : 1.0.0 (`initial-version` dans `release-please-config.json`). Plus de détails dans [docs/github/releases.fr.md](docs/github/releases.fr.md) et [docs/git-hooks.fr.md](docs/git-hooks.fr.md).

## Déploiement

Pensé pour [Vercel](https://vercel.com), avec une base [Neon](https://neon.tech) (ou tout autre Postgres hébergé) :

1. Créer le projet Vercel et y connecter le dépôt
2. Renseigner `DATABASE_URL`, `PAYLOAD_SECRET` et `NEXT_PUBLIC_SITE_URL`
3. Créer un bucket [Cloudflare R2](https://developers.cloudflare.com/r2/), un jeton d'API R2 avec les droits de lecture et d'écriture sur ce bucket, et un domaine public pour le bucket. Renseigner les cinq variables `R2_*`
4. Sur le bucket, ajouter une règle CORS qui autorise `PUT` depuis les origines du site : les vidéos sont envoyées depuis le navigateur
5. _Facultatif :_ renseigner `RESEND_API_KEY` et `CONTACT_NOTIFICATION_FROM` pour l'e-mail du formulaire de contact

Les migrations s'appliquent automatiquement à chaque déploiement (`pnpm run ci`). Ne jamais brancher `pnpm dev` sur la base de production : le mode push du développement contournerait l'historique des migrations.

## Structure du projet

```txt
src/
├── app/
│   ├── (frontend)/[locale]/   # Site public (accueil, projets, journal)
│   └── (payload)/             # Admin Payload
├── collections/               # Schémas des collections
├── globals/                   # Schémas des globals
├── components/
│   ├── sections/              # Sections de l'accueil
│   ├── cards/                 # Cartes projets et journal
│   ├── ui/                    # Composants d'interface partagés
│   └── admin/                 # Composants personnalisés de l'admin
├── lib/
│   ├── queries/               # Accès aux données (API locale de Payload)
│   ├── i18n/                  # Dictionnaires FR/EN de l'interface du site
│   └── theme/                 # Palette d'accent configurable
├── hooks/                     # Hooks Payload (revalidation ISR)
├── migrations/                # Migrations Postgres
└── proxy.ts                   # Middleware de détection de la langue
```
