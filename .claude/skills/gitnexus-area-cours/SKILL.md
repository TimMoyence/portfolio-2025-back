---
name: gitnexus-area-cours
description: 'Skill for the Cours area of portfolio-2025-back. 427 symbols across 79 files.'
---

# Cours

427 symbols | 79 files | Cohesion: 75%

## When to Use

- Working with code in `src/`
- Understanding how analyser, appliquer, arrondirMoitieLoinDeZero work
- Modifying cours-related functionality

## Key Files

| File                                                          | Symbols                                                                                                          |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `src/modules/formations/domain/cours/Formule.ts`              | Analyseur, Evaluation, analyser, appliquer, arrondirMoitieLoinDeZero (+59)                                       |
| `src/modules/formations/domain/cours/StructureCours.ts`       | aretes, controlerCloture, controlerCorrections, controlerCycles, controlerOuverture (+48)                        |
| `src/modules/formations/domain/cours/Tirage.ts`               | billet, donneesDe, donneesDeBrique, enregistrerBanque, entreesDuVote (+19)                                       |
| `src/modules/formations/domain/cours/CoursStocke.ts`          | mapperAuMoinsUn, questionDuQuiz, seuilDe, socleDe, versEcran (+18)                                               |
| `src/modules/formations/domain/cours/GardeConfidentialite.ts` | chainesDe, chiffresSignificatifs, enFrancais, formesDesAttendus, fuitesDesAttendus (+18)                         |
| `src/modules/formations/domain/cours/ProprietesStockees.ts`   | controleDeProduction, controlerProductionDuPlan, proprietesEnigmes, quizNote, signaler (+10)                     |
| `src/modules/formations/domain/cours/StructureCours.spec.ts`  | avecAtelierDe, avecNotesDeCitation, avecCorrection, renvoyer, renvoyer (+7)                                      |
| `src/modules/formations/domain/cours/DeroulePresentateur.ts`  | corrigeDeLEcran, corrigeDeProduction, enonceDeProduction, questionDuDeroule, seuilDe (+6)                        |
| `src/modules/formations/domain/errors/FormationErrors.ts`     | ActiviteInconnueError, EcranNonServiError, PhaseFermeeError, EnigmeDejaResolueError, EnigmeVerrouilleeError (+5) |
| `src/modules/formations/domain/cours/PilotageEcrans.ts`       | assertEtapeNonCorrigee, assertPhaseOuverte, assertPilotageCompatible, refuser, assertReglagesDeLaMachine (+5)    |

## Entry Points

Start here when exploring this area:

- **`analyser`** (Function) — `src/modules/formations/domain/cours/Formule.ts:398`
- **`appliquer`** (Function) — `src/modules/formations/domain/cours/Formule.ts:445`
- **`arrondirMoitieLoinDeZero`** (Function) — `src/modules/formations/domain/cours/Formule.ts:425`
- **`comparer`** (Function) — `src/modules/formations/domain/cours/Formule.ts:434`
- **`decouper`** (Function) — `src/modules/formations/domain/cours/Formule.ts:216`

## Key Symbols

| Symbol                        | Type     | File                                                      | Line |
| ----------------------------- | -------- | --------------------------------------------------------- | ---- |
| `Analyseur`                   | Class    | `src/modules/formations/domain/cours/Formule.ts`          | 235  |
| `Evaluation`                  | Class    | `src/modules/formations/domain/cours/Formule.ts`          | 540  |
| `ActiviteInconnueError`       | Class    | `src/modules/formations/domain/errors/FormationErrors.ts` | 148  |
| `EcranNonServiError`          | Class    | `src/modules/formations/domain/errors/FormationErrors.ts` | 276  |
| `PhaseFermeeError`            | Class    | `src/modules/formations/domain/errors/FormationErrors.ts` | 208  |
| `EnigmeDejaResolueError`      | Class    | `src/modules/formations/domain/errors/FormationErrors.ts` | 258  |
| `EnigmeVerrouilleeError`      | Class    | `src/modules/formations/domain/errors/FormationErrors.ts` | 248  |
| `ProductionInvalideError`     | Class    | `src/modules/formations/domain/errors/FormationErrors.ts` | 184  |
| `ProductionVideError`         | Class    | `src/modules/formations/domain/errors/FormationErrors.ts` | 174  |
| `TiragesInsuffisantsError`    | Class    | `src/modules/formations/domain/cours/OuvertureTirages.ts` | 18   |
| `PilotageIncompatibleError`   | Class    | `src/modules/formations/domain/errors/FormationErrors.ts` | 192  |
| `ContenuDeCoursInvalideError` | Class    | `src/modules/formations/domain/cours/CoursStocke.ts`      | 31   |
| `CoursNonConformeError`       | Class    | `src/modules/formations/domain/errors/FormationErrors.ts` | 324  |
| `FeuilleHorsLimitesError`     | Class    | `src/modules/formations/domain/cours/Formule.ts`          | 21   |
| `TirageAmbiguError`           | Class    | `src/modules/formations/domain/cours/Tirage.ts`           | 42   |
| `PhaseNonMonotoneError`       | Class    | `src/modules/formations/domain/errors/FormationErrors.ts` | 198  |
| `analyser`                    | Function | `src/modules/formations/domain/cours/Formule.ts`          | 398  |
| `appliquer`                   | Function | `src/modules/formations/domain/cours/Formule.ts`          | 445  |
| `arrondirMoitieLoinDeZero`    | Function | `src/modules/formations/domain/cours/Formule.ts`          | 425  |
| `comparer`                    | Function | `src/modules/formations/domain/cours/Formule.ts`          | 434  |

## Execution Flows

| Flow                                      | Type            | Steps |
| ----------------------------------------- | --------------- | ----- |
| `EvaluerCellule → Puissance`              | cross_community | 10    |
| `EvaluerCellule → Suite`                  | cross_community | 10    |
| `EvaluerCellule → Courant`                | cross_community | 10    |
| `ControlerConfidentialite → EstFinie`     | cross_community | 10    |
| `ControlerConfidentialite → SeConfondent` | cross_community | 10    |
| `Execute → QuestionVote`                  | cross_community | 10    |
| `Execute → DefinitionFixe`                | cross_community | 10    |
| `Execute → VersPiege`                     | cross_community | 10    |
| `Strategies → VersEcranDeRecit`           | cross_community | 10    |
| `Strategies → ConfusionsDuCorrige`        | cross_community | 10    |

## How to Explore

1. `context({name: "analyser"})` — see callers and callees
2. `query({search_query: "cours"})` — find related execution flows
3. Read key files listed above for implementation details
4. `explain({target: "<file or symbol>"})` — persisted taint findings (source→sink data flows), when indexed with `--pdg`
