---
name: gitnexus-area-test
description: 'Skill for the Test area of portfolio-2025-back. 327 symbols across 62 files.'
---

# Test

327 symbols | 62 files | Cohesion: 72%

## When to Use

- Working with code in `test/`
- Understanding how getSharedLlmInFlightLimiter, confusionDominante, regrouperParQuestion work
- Modifying test-related functionality

## Key Files

| File                                                      | Symbols                                                                                                  |
| --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `test/formations-session.http-socket.spec.ts`             | get, parJeton, findById, findById, creerAnswersRepo (+41)                                                |
| `test/formations-e2e-seance-b2-01.db-integration.spec.ts` | ecrireLibrement, reponseLibre, jouerCoffre, jouerEcran, jouerEtayage (+39)                               |
| `test/formations-resilience.db-integration.spec.ts`       | commander, lireResultats, piloter, identifiantQuestion, demarrerSeance (+15)                             |
| `test/formations-classe-b2-01.db-integration.spec.ts`     | piloter, jouerActiviteLibre, jouerDefi, jouerEnigmes, jouerJalon (+13)                                   |
| `test/helpers/formations-banc-seance.ts`                  | codeDe, avecJeton, formateur, statutsEnEchec, attendreEcranNonServi (+10)                                |
| `test/formations-concurrence.db-integration.spec.ts`      | demarrer, ouvrir, identifiantQuestion, attendreRequeteBloquee, codesEnBase (+10)                         |
| `test/formations-charge.db-integration.spec.ts`           | repondreJuste, commander, preparerClasse, rejoindre, identiteDe (+9)                                     |
| `test/formations-capacite.db-integration.spec.ts`         | lireLeSujet, repondre, cheminDu, cle, evincer (+8)                                                       |
| `test/helpers/formations-harness.ts`                      | compilerModuleFormations, fournisseursFormations, monterApplicationFormations, formateur, formateur (+7) |
| `test/formations-seance.db-integration.spec.ts`           | conceptDe, dureeDe, estPiege, identifiantQuestion, trierParCle (+5)                                      |

## Entry Points

Start here when exploring this area:

- **`getSharedLlmInFlightLimiter`** (Function) — `src/modules/audit-requests/infrastructure/automation/llm-execution.guardrails.ts:126`
- **`confusionDominante`** (Function) — `src/modules/formations/domain/cours/ProductionSoumise.ts:235`
- **`regrouperParQuestion`** (Function) — `src/modules/formations/infrastructure/Answers.repository.typeorm.ts:39`
- **`correctionDesReponses`** (Function) — `src/modules/formations/infrastructure/contenus/briques.ts:205`
- **`ecranV2`** (Function) — `src/modules/formations/infrastructure/contenus/briques.ts:110`

## Key Symbols

| Symbol                        | Type     | File                                                                               | Line |
| ----------------------------- | -------- | ---------------------------------------------------------------------------------- | ---- |
| `LlmInFlightLimiter`          | Class    | `src/modules/audit-requests/infrastructure/automation/llm-execution.guardrails.ts` | 74   |
| `DomainExceptionFilter`       | Class    | `src/common/interfaces/filters/DomainExceptionFilter.ts`                           | 23   |
| `AllExceptionsFilter`         | Class    | `src/common/interfaces/filters/all-exceptions.filter.ts`                           | 27   |
| `PlaceDejaPriseError`         | Class    | `src/modules/formations/domain/errors/FormationErrors.ts`                          | 92   |
| `SeedPoolExhaustedError`      | Class    | `src/modules/formations/domain/errors/FormationErrors.ts`                          | 122  |
| `SeanceCompleteError`         | Class    | `src/modules/formations/domain/errors/FormationErrors.ts`                          | 82   |
| `getSharedLlmInFlightLimiter` | Function | `src/modules/audit-requests/infrastructure/automation/llm-execution.guardrails.ts` | 126  |
| `confusionDominante`          | Function | `src/modules/formations/domain/cours/ProductionSoumise.ts`                         | 235  |
| `regrouperParQuestion`        | Function | `src/modules/formations/infrastructure/Answers.repository.typeorm.ts`              | 39   |
| `correctionDesReponses`       | Function | `src/modules/formations/infrastructure/contenus/briques.ts`                        | 205  |
| `ecranV2`                     | Function | `src/modules/formations/infrastructure/contenus/briques.ts`                        | 110  |
| `suiviDeSaCorrection`         | Function | `src/modules/formations/infrastructure/contenus/briques.ts`                        | 174  |
| `useFactory`                  | Function | `src/modules/users/Users.module.ts`                                                | 111  |
| `bornerLesCorpsDeRequete`     | Function | `src/common/interfaces/http/corps-de-requete.ts`                                   | 4    |
| `compilerModuleFormations`    | Function | `test/helpers/formations-harness.ts`                                               | 212  |
| `fournisseursFormations`      | Function | `test/helpers/formations-harness.ts`                                               | 159  |
| `monterApplicationFormations` | Function | `test/helpers/formations-harness.ts`                                               | 231  |
| `jetonSigne`                  | Function | `test/helpers/identite-reelle.ts`                                                  | 21   |
| `signerLesIdentitesDeTest`    | Function | `test/helpers/identite-reelle.ts`                                                  | 59   |
| `activitesLibres`             | Function | `src/modules/formations/domain/cours/EcranServi.ts`                                | 110  |

## Execution Flows

| Flow                                   | Type            | Steps |
| -------------------------------------- | --------------- | ----- |
| `Appeler → ServeurHttpDe`              | cross_community | 10    |
| `Refresh → ServeurHttpDe`              | cross_community | 10    |
| `Appeler → RouteFormations`            | cross_community | 9     |
| `SyntheseDesRappels → QuestionsDe`     | cross_community | 9     |
| `Refresh → RouteFormations`            | cross_community | 9     |
| `Quartile → ServeurHttpDe`             | cross_community | 9     |
| `Quartile → RouteFormations`           | cross_community | 8     |
| `ExecuteForTeacher → ServeurHttpDe`    | cross_community | 8     |
| `ExecuteForTeacher → RouteFormations`  | cross_community | 7     |
| `InferTechFingerprint → ServeurHttpDe` | cross_community | 7     |

## How to Explore

1. `context({name: "getSharedLlmInFlightLimiter"})` — see callers and callees
2. `query({search_query: "test"})` — find related execution flows
3. Read key files listed above for implementation details
4. `explain({target: "<file or symbol>"})` — persisted taint findings (source→sink data flows), when indexed with `--pdg`
