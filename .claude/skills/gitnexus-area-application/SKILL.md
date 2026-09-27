---
name: gitnexus-area-application
description: 'Skill for the Application area of portfolio-2025-back. 282 symbols across 112 files.'
---

# Application

282 symbols | 112 files | Cohesion: 76%

## When to Use

- Working with code in `src/`
- Understanding how arreter, ceder, clore work
- Modifying application-related functionality

## Key Files

| File                                                                  | Symbols                                                                                                                |
| --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `src/modules/formations/application/StreamSession.useCase.ts`         | arreter, ceder, clore, demarrer, installer (+16)                                                                       |
| `src/modules/articles/application/article-broadcast.repository.ts`    | findModerated, setArticleStatus, updateBroadcast, send, markRecipient (+7)                                             |
| `src/modules/audit-requests/application/StreamAuditEvents.useCase.ts` | globalTimer, teardown, buildTimeoutEvent, execute, emitSnapshot (+7)                                                   |
| `src/modules/articles/testing/in-memory-article-broadcast.ts`         | setArticleStatus, updateBroadcast, markRecipient, reserveRecipient, send (+6)                                          |
| `src/modules/articles/application/articles.service.ts`                | ArticlesService, escapeXml, feed, ingest, toEntity (+4)                                                                |
| `src/modules/articles/application/article-settings.ts`                | articlePageUrl, publicApiUrl, siteUrl, trimSlashes, trimTrailingSlashes (+4)                                           |
| `src/modules/articles/application/article-broadcast.service.ts`       | close, redactToken, redactedError, deliver, ArticleBroadcastService (+3)                                               |
| `src/modules/formations/domain/errors/FormationErrors.ts`             | PlafondDeFluxAtteintError, SessionStreamLimitError, SessionNotFoundError, SessionNotOwnedError, CoursInconnuError (+2) |
| `src/modules/articles/application/article-moderation.service.ts`      | approveBroadcast, cancelBroadcast, find, restore, view (+2)                                                            |
| `src/modules/users/application/AuthenticateGoogleUser.useCase.ts`     | ensureActive, execute, resolveOrCreateUser, getClient, verifyGoogleToken (+2)                                          |

## Entry Points

Start here when exploring this area:

- **`arreter`** (Function) — `src/modules/formations/application/StreamSession.useCase.ts:223`
- **`ceder`** (Function) — `src/modules/formations/application/StreamSession.useCase.ts:231`
- **`clore`** (Function) — `src/modules/formations/application/StreamSession.useCase.ts:267`
- **`demarrer`** (Function) — `src/modules/formations/application/StreamSession.useCase.ts:356`
- **`installer`** (Function) — `src/modules/formations/application/StreamSession.useCase.ts:326`

## Key Symbols

| Symbol                              | Type  | File                                                                  | Line |
| ----------------------------------- | ----- | --------------------------------------------------------------------- | ---- |
| `RateLimitExceededError`            | Class | `src/common/domain/errors/RateLimitExceededError.ts`                  | 2    |
| `PlafondDeFluxAtteintError`         | Class | `src/modules/formations/domain/errors/FormationErrors.ts`             | 286  |
| `SessionStreamLimitError`           | Class | `src/modules/formations/domain/errors/FormationErrors.ts`             | 294  |
| `SessionNotFoundError`              | Class | `src/modules/formations/domain/errors/FormationErrors.ts`             | 18   |
| `SessionNotOwnedError`              | Class | `src/modules/formations/domain/errors/FormationErrors.ts`             | 50   |
| `ArticlesService`                   | Class | `src/modules/articles/application/articles.service.ts`                | 47   |
| `ArticleBroadcastService`           | Class | `src/modules/articles/application/article-broadcast.service.ts`       | 71   |
| `ArticleModerationService`          | Class | `src/modules/articles/application/article-moderation.service.ts`      | 31   |
| `ArticleBroadcastMailerService`     | Class | `src/modules/articles/infrastructure/article-broadcast.mailer.ts`     | 110  |
| `TypeOrmArticleBroadcastRepository` | Class | `src/modules/articles/infrastructure/article-broadcast.repository.ts` | 29   |
| `InMemoryArticleBroadcasts`         | Class | `src/modules/articles/testing/in-memory-article-broadcast.ts`         | 20   |
| `RecordingBroadcastMailer`          | Class | `src/modules/articles/testing/in-memory-article-broadcast.ts`         | 144  |
| `User`                              | Class | `src/modules/users/domain/User.ts`                                    | 20   |
| `CoursInconnuError`                 | Class | `src/modules/formations/domain/errors/FormationErrors.ts`             | 26   |
| `InvalidCredentialsError`           | Class | `src/common/domain/errors/InvalidCredentialsError.ts`                 | 2    |
| `CoursModifieError`                 | Class | `src/modules/formations/domain/errors/FormationErrors.ts`             | 330  |
| `ParticipantNotFoundError`          | Class | `src/modules/formations/domain/errors/FormationErrors.ts`             | 34   |
| `CasDUsageUtilisateurs`             | Class | `src/modules/users/application/CasDUsageUtilisateurs.ts`              | 8    |
| `DeleteUsersUseCase`                | Class | `src/modules/users/application/DeleteUsers.useCase.ts`                | 5    |
| `ListOneUserUseCase`                | Class | `src/modules/users/application/ListOneUser.useCase.ts`                | 5    |

## Execution Flows

| Flow                                  | Type            | Steps |
| ------------------------------------- | --------------- | ----- |
| `Execute → QuestionVote`              | cross_community | 10    |
| `Execute → DefinitionFixe`            | cross_community | 10    |
| `Execute → VersPiege`                 | cross_community | 10    |
| `Strategies → VersEcranDeRecit`       | cross_community | 10    |
| `Strategies → ConfusionsDuCorrige`    | cross_community | 10    |
| `Execute → ConfusionsDe`              | cross_community | 10    |
| `SyntheseDesRappels → VersEcran`      | cross_community | 10    |
| `SyntheseDesRappels → VersProduction` | cross_community | 10    |
| `SyntheseDesRappels → QuestionDeVote` | cross_community | 10    |
| `Strategies → QuestionVote`           | cross_community | 10    |

## How to Explore

1. `context({name: "arreter"})` — see callers and callees
2. `query({search_query: "application"})` — find related execution flows
3. Read key files listed above for implementation details
4. `explain({target: "<file or symbol>"})` — persisted taint findings (source→sink data flows), when indexed with `--pdg`
