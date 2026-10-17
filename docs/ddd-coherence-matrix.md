# DDD Coherence Matrix (Phases 1-11)

## Context Map (Etat reel)

### Contextes actifs (charges par `AppModule`)

- `users` (authentification et gestion d'utilisateurs)
- `contacts` (formulaire de contact + notification email)
- `cookie-consents` (trace RGPD du consentement)
- `audit-requests` (demande d'audit + pipeline async + SSE)
- `lead-magnets` (capture email + PDF toolkit)
- `presentations` (interactions slides in-memory)
- `articles` (articles publics servis par l'API)
- `formations` (cours servis, seances en direct, correction et notation)

### Contextes retires

- `services`, `projects`, `courses`, `redirects` : CMS herite, jamais appele par le front ni servi en production ; code, drapeau `ENABLE_LEGACY_CMS_CONTEXTS` et tables retires par la migration `1792300000000-RetireLeCmsHerite` (LEG-01).

## Matrice de coherence

| Axe                               | Observation                                                                             |       Risque | Priorite | Etat                                   |
| --------------------------------- | --------------------------------------------------------------------------------------- | -----------: | -------: | -------------------------------------- |
| Frontiere Interface/Application   | Des DTO HTTP etaient dans `application/dto`                                             |        Moyen |       P0 | Corrige (phase 1)                      |
| Application -> Interface coupling | `contacts` dependait d'un DTO de requete HTTP                                           |        Moyen |       P0 | Corrige (phase 1)                      |
| Commande applicative explicite    | Pas de `Command` explicite sur les flux `contacts`, `cookie-consents`, `audit-requests` |        Moyen |       P0 | Corrige (phase 1)                      |
| Reponses metier vs HTTP           | Presence de `httpCode` dans des objets de domaine (`*Response`)                         |        Moyen |       P1 | Corrige (phase 2)                      |
| Invariants metier transverses     | Validation email/phone/locale dupliquee ou implicite                                    |        Moyen |       P1 | Corrige (phase 3)                      |
| Couches domain/application        | Certaines entites domaine restaient anemiques (invariants riches limites)               | Faible/Moyen |       P1 | Corrige (phase 5 sur contextes actifs) |
| Tests coherence API               | Couverture insuffisante des contrats HTTP/validation/sse/auth                           |        Moyen |       P1 | Corrige (phase 4)                      |
| Bounded contexts inactifs         | Modules non branches en runtime mais presents en code                                   |        Moyen |       P1 | Retires (LEG-01)                       |
| Ubiquitous language               | Nommage heterogene (`Token.ts` vs `token.ts`, imports Nest internes)                    |       Faible |       P2 | Corrige (phase 6)                      |
| Imports Nest publics              | Certains repositories utilisaient des chemins internes TypeORM decorators               |       Faible |       P2 | Corrige (phase 8)                      |

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

1. Registry runtime explicite des contextes via `ENABLE_LEGACY_CMS_CONTEXTS` (`false` par defaut), retire avec le CMS herite (LEG-01) : `AppModule` importe directement les contextes actifs.
2. Invariants metier deplaces dans les aggregates domaine (`Contacts`, `CookieConsent`, `AuditRequest`, `Users`) avec erreurs de domaine explicites.
3. Ajout d'une suite e2e HTTP socket-based dediee a la CI/CD (`test:e2e:http`) et execution dans le workflow GitHub Actions.

## Decisions prises en phase 6

1. Uniformisation complete des fichiers de token en `domain/token.ts` (suppression du dernier `Token.ts`).
2. Ajout d'un garde-fou automatise (`naming-coherence.spec.ts`) pour bloquer toute regression de convention.

## Decisions prises en phases 7 a 11

Elles portaient sur le seul CMS herite (`services`, `projects`, `courses`, `redirects`) : DTO, invariants, lectures paginees, filtres, index et budgets de performance. Le CMS est retire (LEG-01) ; seules restent de ces phases la suite d'integration sur une base reelle en CI (`test:integration:db`) et la normalisation des imports `InjectRepository` vers `@nestjs/typeorm`, gardee par `naming-coherence.spec.ts`.
