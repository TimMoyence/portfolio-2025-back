---
name: gitnexus-area-entities
description: 'Skill for the Entities area of portfolio-2025-back. 49 symbols across 36 files.'
---

# Entities

49 symbols | 36 files | Cohesion: 86%

## When to Use

- Working with code in `src/`
- Understanding how ColonneDeCreation, ColonneDeMiseAJour, JetonDUtilisateur work
- Modifying entities-related functionality

## Key Files

| File                                                                     | Symbols                                                                                             |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| `src/modules/formations/infrastructure/entities/ligne-de-participant.ts` | LigneDeParticipant, Ligne, Suivi, RelieeAuParticipant, SuiviDuParticipant                           |
| `test/factories/formation-entities.factory.ts`                           | buildFreeResponseEntity, buildCourseContentEntity, buildScreenContentEntity, buildParticipantEntity |
| `src/common/infrastructure/typeorm/ColonnesDeTrace.ts`                   | ColonnesDeTrace, ColonneDeCreation, ColonneDeMiseAJour                                              |
| `src/modules/formations/infrastructure/entities/ligne-de-seance.ts`      | Ligne, RelieeALaSeance, LigneDeSeance                                                               |
| `test/factories/formation.factory.ts`                                    | buildFreeResponseRecord, createMockFreeResponsesRepo                                                |
| `src/common/infrastructure/typeorm/ColonnesDeContenu.ts`                 | ContenuASlugUnique, TraductionDeContenu                                                             |
| `src/modules/courses/infrastructure/entities/CourseResources.entity.ts`  | CourseResourceEntity                                                                                |
| `src/modules/projects/infrastructure/entities/Projects.entity.ts`        | ProjectsEntity                                                                                      |
| `src/modules/services/infrastructure/entities/ServicesFaq.entity.ts`     | ServicesFaqEntity                                                                                   |
| `src/modules/users/infrastructure/entities/PasswordResetToken.entity.ts` | PasswordResetTokenEntity                                                                            |

## Entry Points

Start here when exploring this area:

- **`ColonneDeCreation`** (Function) — `src/common/infrastructure/typeorm/ColonnesDeTrace.ts:2`
- **`ColonneDeMiseAJour`** (Function) — `src/common/infrastructure/typeorm/ColonnesDeTrace.ts:5`
- **`JetonDUtilisateur`** (Function) — `src/modules/users/infrastructure/entities/jeton-d-utilisateur.ts:3`
- **`LigneDeParticipant`** (Function) — `src/modules/formations/infrastructure/entities/ligne-de-participant.ts:14`
- **`buildFreeResponseEntity`** (Function) — `test/factories/formation-entities.factory.ts:151`

## Key Symbols

| Symbol                         | Type  | File                                                                              | Line |
| ------------------------------ | ----- | --------------------------------------------------------------------------------- | ---- |
| `ColonnesDeTrace`              | Class | `src/common/infrastructure/typeorm/ColonnesDeTrace.ts`                            | 12   |
| `CourseResourceEntity`         | Class | `src/modules/courses/infrastructure/entities/CourseResources.entity.ts`           | 12   |
| `ProjectsEntity`               | Class | `src/modules/projects/infrastructure/entities/Projects.entity.ts`                 | 18   |
| `ServicesFaqEntity`            | Class | `src/modules/services/infrastructure/entities/ServicesFaq.entity.ts`              | 13   |
| `PasswordResetTokenEntity`     | Class | `src/modules/users/infrastructure/entities/PasswordResetToken.entity.ts`          | 13   |
| `RefreshTokenEntity`           | Class | `src/modules/users/infrastructure/entities/RefreshToken.entity.ts`                | 9    |
| `UsersEntity`                  | Class | `src/modules/users/infrastructure/entities/Users.entity.ts`                       | 4    |
| `FormationAnswerEntity`        | Class | `src/modules/formations/infrastructure/entities/FormationAnswer.entity.ts`        | 13   |
| `FormationEscapeAttemptEntity` | Class | `src/modules/formations/infrastructure/entities/FormationEscapeAttempt.entity.ts` | 8    |
| `FormationFreeResponseEntity`  | Class | `src/modules/formations/infrastructure/entities/FormationFreeResponse.entity.ts`  | 23   |
| `FormationCourseContentEntity` | Class | `src/modules/formations/infrastructure/entities/FormationCourseContent.entity.ts` | 16   |
| `FormationScreenContentEntity` | Class | `src/modules/formations/infrastructure/entities/FormationScreenContent.entity.ts` | 23   |
| `ContenuDeCours`               | Class | `src/modules/formations/infrastructure/entities/contenu-de-cours.ts`              | 2    |
| `Ligne`                        | Class | `src/modules/formations/infrastructure/entities/ligne-de-participant.ts`          | 15   |
| `Suivi`                        | Class | `src/modules/formations/infrastructure/entities/ligne-de-participant.ts`          | 26   |
| `Ligne`                        | Class | `src/modules/formations/infrastructure/entities/ligne-de-seance.ts`               | 13   |
| `FormationParticipantEntity`   | Class | `src/modules/formations/infrastructure/entities/FormationParticipant.entity.ts`   | 13   |
| `FormationPulseEntity`         | Class | `src/modules/formations/infrastructure/entities/FormationPulse.entity.ts`         | 12   |
| `FormationScoreEntity`         | Class | `src/modules/formations/infrastructure/entities/FormationScore.entity.ts`         | 26   |
| `ContenuASlugUnique`           | Class | `src/common/infrastructure/typeorm/ColonnesDeContenu.ts`                          | 3    |

## How to Explore

1. `context({name: "ColonneDeCreation"})` — see callers and callees
2. `query({search_query: "entities"})` — find related execution flows
3. Read key files listed above for implementation details
4. `explain({target: "<file or symbol>"})` — persisted taint findings (source→sink data flows), when indexed with `--pdg`
