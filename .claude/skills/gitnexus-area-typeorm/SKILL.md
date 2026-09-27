---
name: gitnexus-area-typeorm
description: 'Skill for the Typeorm area of portfolio-2025-back. 46 symbols across 32 files.'
---

# Typeorm

46 symbols | 32 files | Cohesion: 88%

## When to Use

- Working with code in `src/`
- Understanding how DepotDeRequetes, ColonneAcceptationDesConditions, ColonneVersionDesConditions work
- Modifying typeorm-related functionality

## Key Files

| File                                                                              | Symbols                                                      |
| --------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| `src/common/infrastructure/typeorm/page-de-requete.ts`                            | DepotPagine, pageDeRequete, findAll, toDomain                |
| `src/common/infrastructure/typeorm/PostgresErrorClassifier.spec.ts`               | DepotTemoin, depotQuiRepond, depot, violationDUnicite        |
| `src/common/infrastructure/typeorm/DepotDeRequetes.spec.ts`                       | DepotTemoin, depotEnMemoire, RequeteTemoin                   |
| `src/common/infrastructure/typeorm/DepotDeRequetes.ts`                            | DepotDeRequetes, ConsignationDeRequetes, Depot               |
| `src/common/infrastructure/typeorm/ColonnesDeProvenance.ts`                       | ColonnesDeProvenance, ColonnesDeRequete                      |
| `src/common/infrastructure/typeorm/ColonnesDeConsentement.ts`                     | ColonneAcceptationDesConditions, ColonneVersionDesConditions |
| `src/common/infrastructure/typeorm/DepotEnDomaine.ts`                             | toDomain, trouver                                            |
| `src/common/infrastructure/typeorm/ColonnesDeContenu.ts`                          | ColonneLocale, SlugDeTraduction                              |
| `src/modules/audit-requests/infrastructure/AuditRequests.repository.typeORM.ts`   | AuditRequestsRepositoryTypeORM                               |
| `src/modules/cookie-consents/infrastructure/CookieConsents.repository.typeORM.ts` | CookieConsentsRepositoryTypeORM                              |

## Entry Points

Start here when exploring this area:

- **`DepotDeRequetes`** (Function) — `src/common/infrastructure/typeorm/DepotDeRequetes.ts:25`
- **`ColonneAcceptationDesConditions`** (Function) — `src/common/infrastructure/typeorm/ColonnesDeConsentement.ts:5`
- **`ColonneVersionDesConditions`** (Function) — `src/common/infrastructure/typeorm/ColonnesDeConsentement.ts:2`
- **`ColonneLocale`** (Function) — `src/common/infrastructure/typeorm/ColonnesDeContenu.ts:12`
- **`SlugDeTraduction`** (Function) — `src/common/infrastructure/typeorm/ColonnesDeContenu.ts:14`

## Key Symbols

| Symbol                                  | Type     | File                                                                               | Line |
| --------------------------------------- | -------- | ---------------------------------------------------------------------------------- | ---- |
| `AuditRequestsRepositoryTypeORM`        | Class    | `src/modules/audit-requests/infrastructure/AuditRequests.repository.typeORM.ts`    | 35   |
| `CookieConsentsRepositoryTypeORM`       | Class    | `src/modules/cookie-consents/infrastructure/CookieConsents.repository.typeORM.ts`  | 8    |
| `ColonnesDeProvenance`                  | Class    | `src/common/infrastructure/typeorm/ColonnesDeProvenance.ts`                        | 4    |
| `ColonnesDeRequete`                     | Class    | `src/common/infrastructure/typeorm/ColonnesDeProvenance.ts`                        | 15   |
| `AuditRequestEntity`                    | Class    | `src/modules/audit-requests/infrastructure/entities/AuditRequest.entity.ts`        | 18   |
| `ContactMessagesEntity`                 | Class    | `src/modules/contacts/infrastructure/entities/ContactMessage.entity.ts`            | 4    |
| `CookieConsentEntity`                   | Class    | `src/modules/cookie-consents/infrastructure/entities/CookieConsent.entity.ts`      | 5    |
| `DepotPagine`                           | Class    | `src/common/infrastructure/typeorm/page-de-requete.ts`                             | 54   |
| `CoursesRepositoryTypeORM`              | Class    | `src/modules/courses/infrastructure/Courses.repository.typeORM.ts`                 | 10   |
| `RedirectsRepositoryTypeORM`            | Class    | `src/modules/redirects/infrastructure/Redirects.repository.typeORM.ts`             | 10   |
| `LeadMagnetRequestEntity`               | Class    | `src/modules/lead-magnets/infrastructure/entities/LeadMagnetRequest.entity.ts`     | 9    |
| `NewsletterSubscriberEntity`            | Class    | `src/modules/newsletter/infrastructure/entities/NewsletterSubscriber.entity.ts`    | 9    |
| `PostgresErrorClassifier`               | Class    | `src/common/infrastructure/typeorm/PostgresErrorClassifier.ts`                     | 9    |
| `NewsletterSubscriberRepositoryTypeORM` | Class    | `src/modules/newsletter/infrastructure/NewsletterSubscriber.repository.typeorm.ts` | 11   |
| `ProjectsTranslationsEntity`            | Class    | `src/modules/projects/infrastructure/entities/ProjectsTranslations.entity.ts`      | 17   |
| `ConsignationDeRequetes`                | Class    | `src/common/infrastructure/typeorm/DepotDeRequetes.ts`                             | 9    |
| `Depot`                                 | Class    | `src/common/infrastructure/typeorm/DepotDeRequetes.ts`                             | 28   |
| `DepotDeRequetes`                       | Function | `src/common/infrastructure/typeorm/DepotDeRequetes.ts`                             | 25   |
| `ColonneAcceptationDesConditions`       | Function | `src/common/infrastructure/typeorm/ColonnesDeConsentement.ts`                      | 5    |
| `ColonneVersionDesConditions`           | Function | `src/common/infrastructure/typeorm/ColonnesDeConsentement.ts`                      | 2    |

## Execution Flows

| Flow                            | Type            | Steps |
| ------------------------------- | --------------- | ----- |
| `FreeResponse → ToDomain`       | cross_community | 8     |
| `Jalon → ToDomain`              | cross_community | 8     |
| `Production → ToDomain`         | cross_community | 8     |
| `TentativeDeDefi → ToDomain`    | cross_community | 8     |
| `TentativeEnigme → ToDomain`    | cross_community | 8     |
| `SyntheseDesRappels → ToDomain` | cross_community | 7     |
| `StrategiesDuDefi → ToDomain`   | cross_community | 7     |
| `Execute → ToDomain`            | cross_community | 6     |
| `Execute → ToDomain`            | cross_community | 6     |
| `Execute → ToDomain`            | cross_community | 6     |

## How to Explore

1. `context({name: "DepotDeRequetes"})` — see callers and callees
2. `query({search_query: "typeorm"})` — find related execution flows
3. Read key files listed above for implementation details
4. `explain({target: "<file or symbol>"})` — persisted taint findings (source→sink data flows), when indexed with `--pdg`
