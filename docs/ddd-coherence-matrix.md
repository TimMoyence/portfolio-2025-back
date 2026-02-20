# DDD Coherence Matrix (Phases 1-11)

## Context Map (Etat reel)

### Contextes actifs (charges par `AppModule`)

- `users` (authentification et gestion d'utilisateurs)
- `contacts` (formulaire de contact + notification email)
- `cookie-consents` (trace RGPD du consentement)
- `audit-requests` (demande d'audit + pipeline async + SSE)

### Contextes legacy (charges uniquement si `ENABLE_LEGACY_CMS_CONTEXTS=true`)

- `services`
- `projects`
- `courses`
- `redirects`

## Matrice de coherence

| Axe | Observation | Risque | Priorite | Etat |
|---|---|---:|---:|---|
| Frontiere Interface/Application | Des DTO HTTP etaient dans `application/dto` | Moyen | P0 | Corrige (phase 1) |
| Application -> Interface coupling | `contacts` dependait d'un DTO de requete HTTP | Moyen | P0 | Corrige (phase 1) |
| Commande applicative explicite | Pas de `Command` explicite sur les flux `contacts`, `cookie-consents`, `audit-requests` | Moyen | P0 | Corrige (phase 1) |
| Reponses metier vs HTTP | Presence de `httpCode` dans des objets de domaine (`*Response`) | Moyen | P1 | Corrige (phase 2) |
| Invariants metier transverses | Validation email/phone/locale dupliquee ou implicite | Moyen | P1 | Corrige (phase 3) |
| Couches domain/application | Certaines entites domaine restaient anemiques (invariants riches limites) | Faible/Moyen | P1 | Corrige (phase 5 sur contextes actifs) |
| Tests coherence API | Couverture insuffisante des contrats HTTP/validation/sse/auth | Moyen | P1 | Corrige (phase 4) |
| Bounded contexts inactifs | Modules non branches en runtime mais presents en code | Moyen | P1 | Corrige (phase 5 avec feature flag explicite) |
| Ubiquitous language | Nommage heterogene (`Token.ts` vs `token.ts`, imports Nest internes) | Faible | P2 | Corrige (phase 6) |
| Legacy API coverage | Couverture e2e legacy (`services/projects/courses/redirects`) insuffisante | Faible/Moyen | P2 | Corrige (phase 7) |
| Legacy naming debt | Nom historique `CoursesRessources` ambigu | Faible | P2 | Corrige (phase 7 non-breaking) |
| Legacy interface contracts | Controllers legacy acceptaient des objets domaine bruts (`@Body() Domain`) | Moyen | P1 | Corrige (phase 8) |
| Legacy domain invariants | Aggregats legacy anemiques (`id` only) sans validation metier explicite | Moyen | P1 | Corrige (phase 8) |
| Imports Nest publics | Certains repositories utilisaient des chemins internes TypeORM decorators | Faible | P2 | Corrige (phase 8) |
| Legacy response contracts | Reponses POST legacy non formalisees via DTO explicites | Moyen | P1 | Corrige (phase 9) |
| Legacy repository integration | Pas de tests repository sur DB reelle en CI | Moyen | P1 | Corrige (phase 9) |
| Legacy read model | Endpoints GET legacy non branches aux repositories (retours statiques) | Moyen | P1 | Corrige (phase 10) |
| OpenAPI contract drift | Absence de garde-fou schema sur endpoints legacy | Moyen | P1 | Corrige (phase 10) |
| Legacy list filters/indexes | Filtres metier optionnels absents et indexes SQL non alignes | Moyen | P1 | Corrige (phase 11) |
| Legacy list perf budgets | Absence de garde-fou p95/p99 sur pagination/tri des lectures legacy | Moyen | P1 | Corrige (phase 11) |

## Decisions prises en phase 1

1. Les DTO de requete HTTP vivent en couche `interfaces/dto`.
2. Les use cases recoivent des commandes applicatives explicites (`Create*Command`).
3. Les mappers applicatifs convertissent `Command -> Domain`.
4. Les controlleurs sont responsables de la traduction `HTTP request -> Command`.

## Decisions prises en phase 2

1. `httpCode` est retire des objets de domaine/repository/use-case.
2. `httpCode` est desormais fixe en couche `interfaces` (controllers HTTP).
3. Le contrat HTTP sortant est preserve (champ `httpCode` inchange cote API JSON).

## Decisions prises en phase 3

1. Introduction de Value Objects partages `EmailAddress`, `PhoneNumber`, `LocaleCode`.
2. Integration de ces invariants dans les mappers applicatifs `contacts`, `cookie-consents`, `audit-requests`, `users`.
3. Echec explicite (`BadRequestException`) sur donnees metier invalides au point d'entree applicatif.

## Decisions prises en phase 4

1. Ajout de tests unitaires des Value Objects et des mappers applicatifs (coherence Command -> Domain).
2. Ajout de tests de robustesse de configuration automation (`audit.config`) pour bornes de scalabilite.
3. Ajout d'une suite e2e transportless (controllers + `ValidationPipe` globale) couvrant:
   - whitelist / forbidNonWhitelisted
   - contrats de reponse `contacts`, `cookie-consents`, `audit-requests`
   - resolution locale audit
   - flux SSE
   - refus auth (401)

## Decisions prises en phase 5

1. Registry runtime explicite des contextes via `ENABLE_LEGACY_CMS_CONTEXTS` (`false` par defaut):
   - core actifs: `users`, `contacts`, `cookie-consents`, `audit-requests`
   - legacy opt-in: `services`, `projects`, `courses`, `redirects`
2. Invariants metier deplaces dans les aggregates domaine (`Contacts`, `CookieConsent`, `AuditRequest`, `Users`) avec erreurs de domaine explicites.
3. Ajout d'une suite e2e HTTP socket-based dediee a la CI/CD (`test:e2e:http`) et execution dans le workflow GitHub Actions.

## Decisions prises en phase 6

1. Uniformisation complete des fichiers de token en `domain/token.ts` (suppression du dernier `Token.ts`).
2. Normalisation des imports Nest sur les contextes legacy (`@nestjs/common` au lieu de chemins internes decorators).
3. Ajout d'un garde-fou automatise (`naming-coherence.spec.ts`) pour bloquer toute regression de convention.

## Decisions prises en phase 7

1. Extension de la couverture e2e transportless aux contextes legacy (`services`, `projects`, `courses`, `redirects`).
2. Extension de la suite e2e HTTP socket (CI) pour inclure les endpoints legacy.
3. Harmonisation non-breaking `CoursesRessources` -> `CourseResources`:
   - nouveau chemin canonique `CourseResources.entity.ts`
   - alias legacy conserve pour compatibilite.
4. Garde-fou naming etendu pour forcer le chemin canonique.

## Decisions prises en phase 8

1. Introduction de DTO d'interface explicites sur tous les contextes legacy:
   - `services/interfaces/dto/service.request.dto.ts`
   - `projects/interfaces/dto/project.request.dto.ts`
   - `courses/interfaces/dto/course.request.dto.ts`
   - `redirects/interfaces/dto/redirect.request.dto.ts`
2. Introduction de commandes applicatives explicites (`Create*Command`) et mappers (`Command -> Domain`) sur legacy.
3. Enrichissement des aggregates legacy avec `create()` et invariants metier minimaux mais stricts:
   - slug canonical, enum guards, bornes numeriques, URL checks, trimming.
4. Renforcement de la coherence cross-context:
   - normalisation des imports `InjectRepository` vers `@nestjs/typeorm`.
   - garde-fou `naming-coherence.spec.ts` etendu pour bloquer les imports Nest internes TypeORM.
5. Rehausse des tests:
   - unit tests domaine + mapper sur `services/projects/courses/redirects`.
   - e2e legacy transportless et HTTP socket aligns avec les nouveaux contrats DTO.

## Decisions prises en phase 9

1. Ajout de DTO de reponse explicites pour les 4 contextes legacy:
   - `services/interfaces/dto/service.response.dto.ts`
   - `projects/interfaces/dto/project.response.dto.ts`
   - `courses/interfaces/dto/course.response.dto.ts`
   - `redirects/interfaces/dto/redirect.response.dto.ts`
2. Controllers legacy alignes sur un mapping explicite `Domain -> ResponseDto` avec `@ApiCreatedResponse`.
3. Nouvelle suite d'integration repository DB reelle:
   - `test/legacy-repositories.db-integration.spec.ts`
   - activee via `RUN_DB_INTEGRATION=true`.
4. CI renforcee avec service Postgres et execution de `test:integration:db`.

## Decisions prises en phase 10

1. Endpoints `GET` legacy branches aux repositories avec pagination/tri contractuels:
   - `services`, `projects`, `courses`, `redirects`
   - query standardisee: `page`, `limit`, `sortBy`, `order`
2. Repositories legacy evolues vers `findAll(query)` avec tri SQL + pagination et retour pagine (`items + meta`).
3. Tests de contrat OpenAPI legacy ajoutés avec snapshots:
   - `test/openapi-contract.e2e.spec.ts`
4. Suites e2e legacy transportless/HTTP alignees sur les nouveaux contrats de lecture.

## Decisions prises en phase 11

1. Ajout de filtres metier optionnels sur les lectures legacy:
   - `services`: `status`
   - `projects`: `type`, `status`
   - `redirects`: `enabled`
2. Ajout d'indexes SQL alignes sur les chemins de lecture filtres/tries:
   - `IDX_services_status_order`
   - `IDX_projects_type_order`
   - `IDX_projects_status_order`
   - `IDX_redirects_enabled_created_at`
3. Ajout d'une migration dediee pour environnements `synchronize=false`:
   - `src/migrations/1772100000000-AddLegacyListQueryIndexes.ts`
4. Renforcement des tests:
   - e2e transportless/HTTP: forwarding + validation des filtres query.
   - DB integration: verification des filtres effectifs et presence des indexes.
   - nouveau test de charge DB avec budget p95/p99 sur pagination/tri/filtres legacy.
