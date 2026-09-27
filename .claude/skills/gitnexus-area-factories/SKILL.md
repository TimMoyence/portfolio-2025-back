---
name: gitnexus-area-factories
description: 'Skill for the Factories area of portfolio-2025-back. 176 symbols across 55 files.'
---

# Factories

176 symbols | 55 files | Cohesion: 80%

## When to Use

- Working with code in `test/`
- Understanding how buildCasAQuestionsLibres, buildCorrectionDExemple, buildCorrectionDeReponses work
- Modifying factories-related functionality

## Key Files

| File                                                                        | Symbols                                                                                                                                           |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `test/factories/cours.factory.ts`                                           | ecrans, buildCoursDuBaremeV1, buildQuestionNumeriqueFigee, numeriqueTest, bonne (+26)                                                             |
| `test/factories/formation.factory.ts`                                       | createMockFormationMailer, buildSessionRecord, createMockSessionsRepo, etatDeSeance, createMockParticipantsRepo (+14)                             |
| `test/factories/mailer.factory.ts`                                          | createMockTransporter, retirerSmtpEnv, setSmtpEnv, smtpSimule, restaurer (+7)                                                                     |
| `test/factories/ecrans-stockes.factory.ts`                                  | buildCasAQuestionsLibres, buildCorrectionDExemple, buildCorrectionDeReponses, buildEcranDeBrique, buildEcranDeTableau (+2)                        |
| `test/factories/corriges.factory.ts`                                        | buildCorrigeDefi, buildCorrigeClassement, buildCorrigeFeuille, buildCorrigeTableau, buildPlanFeuille (+1)                                         |
| `test/factories/newsletter-subscriber.factory.ts`                           | buildAbonnePersiste, buildNewsletterSubscriber, createMockEmailDripScheduler, createMockNewsletterMailer, createMockNewsletterSubscriberRepo (+1) |
| `test/helpers/formations-banc-seance.ts`                                    | installerBancDeSeance, monter, remonter, decrireSurLeDernierEcran, installerBancSurLeDernierEcran                                                 |
| `test/factories/audit-requests.factory.ts`                                  | buildAiBotsAccess, buildCitationWorthiness, buildPageExploree, buildStructuredDataQuality, buildUrlIndexabilityResult                             |
| `src/modules/formations/domain/cours/StructureCoursConfidentialite.spec.ts` | atelierAvec, coffre, production, rappel                                                                                                           |
| `test/factories/structure.factory.ts`                                       | buildEcranDAtelier, buildEcranDExemple, buildEcransStockesConformes, lireEcranStocke                                                              |

## Entry Points

Start here when exploring this area:

- **`buildCasAQuestionsLibres`** (Function) — `test/factories/ecrans-stockes.factory.ts:333`
- **`buildCorrectionDExemple`** (Function) — `test/factories/ecrans-stockes.factory.ts:431`
- **`buildCorrectionDeReponses`** (Function) — `test/factories/ecrans-stockes.factory.ts:412`
- **`buildEcranDeBrique`** (Function) — `test/factories/ecrans-stockes.factory.ts:343`
- **`buildEcranDeTableau`** (Function) — `test/factories/ecrans-stockes.factory.ts:360`

## Key Symbols

| Symbol                             | Type     | File                                                                                  | Line |
| ---------------------------------- | -------- | ------------------------------------------------------------------------------------- | ---- |
| `LireSujetUseCase`                 | Class    | `src/modules/formations/application/LireSujet.useCase.ts`                             | 22   |
| `ParticipationEnSeance`            | Class    | `src/modules/formations/application/ParticipationEnSeance.ts`                         | 31   |
| `FormationIncidentEntity`          | Class    | `src/modules/formations/infrastructure/entities/FormationIncident.entity.ts`          | 6    |
| `FormationTeacherAnnotationEntity` | Class    | `src/modules/formations/infrastructure/entities/FormationTeacherAnnotation.entity.ts` | 13   |
| `buildCasAQuestionsLibres`         | Function | `test/factories/ecrans-stockes.factory.ts`                                            | 333  |
| `buildCorrectionDExemple`          | Function | `test/factories/ecrans-stockes.factory.ts`                                            | 431  |
| `buildCorrectionDeReponses`        | Function | `test/factories/ecrans-stockes.factory.ts`                                            | 412  |
| `buildEcranDeBrique`               | Function | `test/factories/ecrans-stockes.factory.ts`                                            | 343  |
| `buildEcranDeTableau`              | Function | `test/factories/ecrans-stockes.factory.ts`                                            | 360  |
| `buildProprietesStockees`          | Function | `test/factories/ecrans-stockes.factory.ts`                                            | 312  |
| `buildNumeriqueStockee`            | Function | `test/factories/questions-stockees.factory.ts`                                        | 53   |
| `buildEcranDAtelier`               | Function | `test/factories/structure.factory.ts`                                                 | 110  |
| `buildEcranDExemple`               | Function | `test/factories/structure.factory.ts`                                                 | 128  |
| `buildEcransStockesConformes`      | Function | `test/factories/structure.factory.ts`                                                 | 33   |
| `lireEcranStocke`                  | Function | `test/factories/structure.factory.ts`                                                 | 72   |
| `createMockFormationMailer`        | Function | `test/factories/formation.factory.ts`                                                 | 563  |
| `installerEnvFormations`           | Function | `test/helpers/env-formations.ts`                                                      | 7    |
| `installerBancDeSeance`            | Function | `test/helpers/formations-banc-seance.ts`                                              | 140  |
| `monter`                           | Function | `test/helpers/formations-banc-seance.ts`                                              | 250  |
| `remonter`                         | Function | `test/helpers/formations-banc-seance.ts`                                              | 259  |

## Execution Flows

| Flow                       | Type            | Steps |
| -------------------------- | --------------- | ----- |
| `Execute → ConfusionsDe`   | cross_community | 10    |
| `VersEcran → ConfusionsDe` | cross_community | 8     |

## How to Explore

1. `context({name: "buildCasAQuestionsLibres"})` — see callers and callees
2. `query({search_query: "factories"})` — find related execution flows
3. Read key files listed above for implementation details
4. `explain({target: "<file or symbol>"})` — persisted taint findings (source→sink data flows), when indexed with `--pdg`
