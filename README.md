# Portfolio 2025 Backend

API NestJS 11 du projet Portfolio 2025. Le backend suit une architecture en couches `interfaces -> application -> domain -> infrastructure` et expose a la fois des routes CRUD classiques et un pipeline d'audit asynchrone base sur queue, SSE, persistence Postgres et synthese assistee par LLM.

## Documentation d'ingenierie

- [Guide de contribution](./CONTRIBUTING.md)
- [Standards d'ingenierie](./docs/engineering-standards.md)
- [Gouvernance du depot](./docs/repository-governance.md)
- [Garde-fous IA et prompt injection](./docs/ai-security-guardrails.md)
- [Gouvernance base de donnees](./docs/database-governance.md)
- [Matrice de coherence DDD](./docs/ddd-coherence-matrix.md)
- [Module formations](./docs/formations.md)
- [ADR](./docs/adr/README.md)

## Architecture

- `interfaces` : controllers, DTO, validation d'entree et mapping transport.
- `application` : use cases, orchestration et contrats applicatifs.
- `domain` : vocabulaire metier, invariants et objets de domaine.
- `infrastructure` : TypeORM, mail, queue, HTTP sortant et integrations tierces.

Regle non negociable : le domaine ne depend jamais de Nest, TypeORM ou d'un detail de transport.

## Prise en main rapide

```bash
pnpm install
pnpm run start:dev
```

Une fois l'API demarree :

- Swagger est disponible sur `http://localhost:3000/docs`
- le prefixe d'API est pilote par `API_PREFIX`
- les flux auth exposes incluent :
  - `POST /auth/forgot-password`
  - `POST /auth/reset-password`
  - `POST /auth/set-password` (JWT requis)
- le flux d'audit SSE principal repose sur :
  - `POST /audits`
  - `GET /audits/:id/stream`
  - `GET /audits/:id/summary`
- le flux éditorial Morning-Brief repose sur :
  - `POST /articles/ingest` (HMAC + `Idempotency-Key`, machine-à-machine)
  - `GET /articles` et `GET /articles/:slug` (articles publiés uniquement)
  - `GET /articles/feed.xml` (RSS)
- les seances de formation reposent sur un cours servi par le serveur ([details](./docs/formations.md)) :
  - `POST /formations/sessions` avec `{ courseSlug }`, le serveur tirant le bareme
  - `GET /formations/sessions/:id/sujet` (sujet du tirage de l'etudiant, sans corrige)
  - `GET /formations/sessions/:id/deroule` (deroule annote, formateur proprietaire ou administrateur)
  - `GET /formations/sessions/:id/presenter-stream` (SSE, dont l'evenement `resultats`)

En production, `MORNING_BRIEF_HMAC_KEYS` ou le couple
`MORNING_BRIEF_HMAC_KEY_ID` / `MORNING_BRIEF_HMAC_SECRET` est obligatoire ; les
secrets doivent venir du gestionnaire de secrets du déploiement.

## Commandes utiles

```bash
pnpm run lint
pnpm run format:check
pnpm run typecheck
pnpm test -- --runInBand --watchman=false
pnpm run test:cov
pnpm run test:e2e
pnpm run test:e2e:http
pnpm run build
pnpm run ci:check
```

## Hooks Git et verrous locaux

Apres `pnpm install`, Husky installe automatiquement trois hooks :

- `pre-commit` : lance `lint-staged` sur les fichiers indexes ;
- `commit-msg` : impose un message au format Conventional Commit ;
- `pre-push` : lance `pnpm run pre-push:check` (la sequence de `ci:check`, sans le build).

La CI GitHub complete ces garde-fous avec lint, format, typecheck, tests unitaires, e2e, integration DB et build.

## Gouvernance depot

- Le proprietaire de code est defini dans [`.github/CODEOWNERS`](./.github/CODEOWNERS).
- Les protections distantes de `master` sont documentees dans [`docs/repository-governance.md`](./docs/repository-governance.md).
- Les decisions d'architecture sont historisees dans [`docs/adr`](./docs/adr).

## Base de donnees et migrations

Creer une migration (generee depuis les entites contre la base de `.env`, puis appliquee) :

```bash
pnpm run migration:new --name=TheNameInCamelCase
```

`pnpm run migration:generate --name=TheNameInCamelCase` genere sans appliquer. Sur une base ou toutes les migrations sont jouees, la generation ne doit rien produire : le test `test/schema-entites-migrations.db-integration.spec.ts` echoue des qu'une entite et les migrations divergent.

Tests d'integration base de donnees :

```bash
pnpm run test:integration:db:local
```

Ou manuellement :

```bash
pnpm run db:integration:up
pnpm run test:integration:db:run
pnpm run db:integration:down
```

Le flux local d'integration utilise une base Postgres dediee sur `127.0.0.1:55432` pour eviter tout conflit avec la base de dev principale.

## Audit asynchrone et IA

Variables d'environnement importantes :

- queue et Redis : `AUDIT_QUEUE_ENABLED`, `AUDIT_QUEUE_NAME`, `REDIS_URL` (ou `REDIS_HOST` et `REDIS_PORT`, 6379 par defaut)
- fetch et limites reseau : `AUDIT_FETCH_TIMEOUT_MS`, `AUDIT_MAX_REDIRECTS`, `AUDIT_HTML_MAX_BYTES`, `AUDIT_TEXT_MAX_BYTES`
- exploration sitemap : `AUDIT_SITEMAP_SAMPLE_SIZE`, `AUDIT_SITEMAP_MAX_URLS`, `AUDIT_SITEMAP_ANALYZE_LIMIT`
- LLM : `OPENAI_API_KEY`, `AUDIT_LLM_MODEL`, `AUDIT_LLM_PROFILE`, `AUDIT_LLM_GLOBAL_TIMEOUT_MS`, `AUDIT_LLM_RETRIES`, `AUDIT_LLM_LANGUAGE`

Redis est actif si et seulement si `REDIS_URL` ou `REDIS_HOST` est renseigne. Sans l'un ni l'autre (lignes absentes ou vides), les files d'audit et de badges s'executent dans le processus et le plafond des flux SSE des formations n'est tenu qu'en memoire, par instance. Configure mais injoignable, Redis fait repasser les files en execution locale apres trois erreurs, et les flux SSE des formations sont refuses en `429` ; `StreamSessionUseCase` journalise chaque refus en `warn`, avec l'erreur Redis en cause.

Les details de securisation contre le prompt injection et les contenus non fiables sont documentes dans [docs/ai-security-guardrails.md](./docs/ai-security-guardrails.md).

## Docker et deploiement

- Image locale : `docker build -t ghcr.io/<owner>/portfolio-2025-back:dev .`
- Run local containerise : copier `deploy/backend.env.example` vers `deploy/backend.env` et renseigner ses secrets (le gabarit brut est refuse par la validation d'environnement), puis `docker run --rm -p 3000:3000 --env-file deploy/backend.env ghcr.io/<owner>/portfolio-2025-back:dev`
- Stack de production : copier `deploy/.env.example` vers `deploy/.env` et `deploy/backend.env.example` vers `deploy/backend.env`, puis lancer `docker compose -f deploy/compose.yaml up -d`

Le workflow [`.github/workflows/ci.yml`](./.github/workflows/ci.yml) construit l'image, publie sur GHCR et peut relancer le service `api` via SSH quand la branche `master` est mise a jour.
