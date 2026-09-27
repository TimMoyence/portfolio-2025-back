---
name: gitnexus-area-errors
description: 'Skill for the Errors area of portfolio-2025-back. 34 symbols across 21 files.'
---

# Errors

34 symbols | 21 files | Cohesion: 54%

## When to Use

- Working with code in `src/`
- Understanding how ecranDeDefi, estRevele, assertReponsesOuvertes work
- Modifying errors-related functionality

## Key Files

| File                                                                       | Symbols                                                                                                         |
| -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `src/modules/formations/domain/errors/FormationErrors.ts`                  | DefiInconnuError, DefiSansTentativeError, EnigmeInconnueError, ReponseIntrouvableError, GraineRepriseError (+5) |
| `src/modules/formations/application/Defis.useCase.ts`                      | cibleServie, strategies                                                                                         |
| `src/modules/formations/domain/cours/Defis.ts`                             | ecranDeDefi, estRevele                                                                                          |
| `src/modules/users/domain/IRefreshTokens.repository.ts`                    | revokeByUserId, rotateById                                                                                      |
| `src/modules/formations/infrastructure/Participants.repository.typeorm.ts` | conflictErrorFor, conflitDeReadmission                                                                          |
| `src/common/domain/errors/ResourceNotFoundError.ts`                        | ResourceNotFoundError                                                                                           |
| `test/formations-session.http-socket.spec.ts`                              | remplacer                                                                                                       |
| `src/modules/formations/domain/IFreeResponses.repository.ts`               | trouverParActivite                                                                                              |
| `src/common/domain/errors/DomainError.ts`                                  | DomainError                                                                                                     |
| `src/common/domain/errors/InvalidInputError.ts`                            | InvalidInputError                                                                                               |

## Entry Points

Start here when exploring this area:

- **`ecranDeDefi`** (Function) — `src/modules/formations/domain/cours/Defis.ts:14`
- **`estRevele`** (Function) — `src/modules/formations/domain/cours/Defis.ts:26`
- **`assertReponsesOuvertes`** (Function) — `src/modules/formations/domain/SessionState.ts:21`
- **`ResourceNotFoundError`** (Class) — `src/common/domain/errors/ResourceNotFoundError.ts:2`
- **`DefiInconnuError`** (Class) — `src/modules/formations/domain/errors/FormationErrors.ts:218`

## Key Symbols

| Symbol                     | Type     | File                                                      | Line |
| -------------------------- | -------- | --------------------------------------------------------- | ---- |
| `ResourceNotFoundError`    | Class    | `src/common/domain/errors/ResourceNotFoundError.ts`       | 2    |
| `DefiInconnuError`         | Class    | `src/modules/formations/domain/errors/FormationErrors.ts` | 218  |
| `DefiSansTentativeError`   | Class    | `src/modules/formations/domain/errors/FormationErrors.ts` | 226  |
| `EnigmeInconnueError`      | Class    | `src/modules/formations/domain/errors/FormationErrors.ts` | 242  |
| `ReponseIntrouvableError`  | Class    | `src/modules/formations/domain/errors/FormationErrors.ts` | 42   |
| `DomainError`              | Class    | `src/common/domain/errors/DomainError.ts`                 | 0    |
| `InvalidInputError`        | Class    | `src/common/domain/errors/InvalidInputError.ts`           | 2    |
| `TokenExpiredError`        | Class    | `src/common/domain/errors/TokenExpiredError.ts`           | 2    |
| `TokenReuseDetectedError`  | Class    | `src/common/domain/errors/TokenReuseDetectedError.ts`     | 2    |
| `ResourceConflictError`    | Class    | `src/common/domain/errors/ResourceConflictError.ts`       | 2    |
| `GraineRepriseError`       | Class    | `src/modules/formations/domain/errors/FormationErrors.ts` | 112  |
| `ReprisesEpuiseesError`    | Class    | `src/modules/formations/domain/errors/FormationErrors.ts` | 138  |
| `SeedAlreadyAssignedError` | Class    | `src/modules/formations/domain/errors/FormationErrors.ts` | 302  |
| `SessionClosedError`       | Class    | `src/modules/formations/domain/errors/FormationErrors.ts` | 56   |
| `SessionNotStartedError`   | Class    | `src/modules/formations/domain/errors/FormationErrors.ts` | 66   |
| `TentativesEpuiseesError`  | Class    | `src/modules/formations/domain/errors/FormationErrors.ts` | 266  |
| `ecranDeDefi`              | Function | `src/modules/formations/domain/cours/Defis.ts`            | 14   |
| `estRevele`                | Function | `src/modules/formations/domain/cours/Defis.ts`            | 26   |
| `assertReponsesOuvertes`   | Function | `src/modules/formations/domain/SessionState.ts`           | 21   |
| `strategies`               | Method   | `src/modules/formations/application/Defis.useCase.ts`     | 72   |

## Execution Flows

| Flow                                       | Type            | Steps |
| ------------------------------------------ | --------------- | ----- |
| `Strategies → VersEcranDeRecit`            | cross_community | 10    |
| `Strategies → ConfusionsDuCorrige`         | cross_community | 10    |
| `Strategies → QuestionVote`                | cross_community | 10    |
| `Strategies → DefinitionFixe`              | cross_community | 10    |
| `Strategies → VersPiege`                   | cross_community | 10    |
| `Refresh → ServeurHttpDe`                  | cross_community | 10    |
| `Refresh → RouteFormations`                | cross_community | 9     |
| `Strategies → ContenuDeCoursInvalideError` | cross_community | 8     |
| `StrategiesDuDefi → ToDomain`              | cross_community | 7     |
| `FreeResponse → SessionClosedError`        | cross_community | 6     |

## How to Explore

1. `context({name: "ecranDeDefi"})` — see callers and callees
2. `query({search_query: "errors"})` — find related execution flows
3. Read key files listed above for implementation details
4. `explain({target: "<file or symbol>"})` — persisted taint findings (source→sink data flows), when indexed with `--pdg`
