---
name: gitnexus-area-contrat
description: 'Skill for the Contrat area of portfolio-2025-back. 48 symbols across 26 files.'
---

# Contrat

48 symbols | 26 files | Cohesion: 100%

## When to Use

- Working with code in `src/`
- Understanding how DureeDeReponse, SubmitDefiRequestDto, SubmitProductionRequestDto work
- Modifying contrat-related functionality

## Key Files

| File                                                                             | Symbols                                                                                                                                         |
| -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/modules/formations/interfaces/dto/contrat/session-results.response.dto.ts`  | RapportQuestionResponseDto, RegleDeNotationResponseDto, ResultatQuestionResponseDto, ComptesJalonResponseDto, ProgressionEnigmeResponseDto (+1) |
| `src/modules/formations/domain/contrats/resultats.ts`                            | RapportQuestion, ResultatQuestion, ComptesJalon, ProgressionEnigme, ResumeBareme                                                                |
| `src/modules/formations/interfaces/dto/contrat/sujet.response.dto.ts`            | EcranPublicResponseDto, CoursPublicCatalogueResponseDto, SujetResponseDto                                                                       |
| `src/modules/formations/domain/contrats/tirage.ts`                               | EcranPublic, CoursPublic, CoursPublicCatalogue                                                                                                  |
| `src/modules/formations/interfaces/dto/session-results.response.dto.ts`          | RapportQuestionResponseDto, RegleDeNotationResponseDto, ResultatQuestionResponseDto                                                             |
| `src/modules/formations/interfaces/dto/contrat/control-session.request.dto.ts`   | PilotageEcranRequestDto, EstReglageNumerique, ControlSessionRequestDto                                                                          |
| `src/modules/formations/interfaces/dto/contrat/submit-production.request.dto.ts` | SubmitProductionRequestDto, versProduction                                                                                                      |
| `src/modules/formations/interfaces/dto/contrat/deroule.response.dto.ts`          | EcranDerouleResponseDto, DerouleResponseDto                                                                                                     |
| `src/modules/formations/domain/contrats/deroule.ts`                              | EcranDeroule, DerouleCours                                                                                                                      |
| `src/modules/formations/interfaces/dto/contrat/rappels.response.dto.ts`          | OptionPubliqueResponseDto, SpacedQuestionPubliqueResponseDto                                                                                    |

## Entry Points

Start here when exploring this area:

- **`DureeDeReponse`** (Function) — `src/modules/formations/interfaces/dto/duree-de-reponse.decorator.ts:6`
- **`SubmitDefiRequestDto`** (Class) — `src/modules/formations/interfaces/dto/contrat/submit-defi.request.dto.ts:4`
- **`SubmitProductionRequestDto`** (Class) — `src/modules/formations/interfaces/dto/contrat/submit-production.request.dto.ts:156`
- **`TenterEnigmeRequestDto`** (Class) — `src/modules/formations/interfaces/dto/contrat/tenter-enigme.request.dto.ts:4`
- **`SaveFreeResponseRequestDto`** (Class) — `src/modules/formations/interfaces/dto/save-free-response.request.dto.ts:4`

## Key Symbols

| Symbol                            | Type  | File                                                                             | Line |
| --------------------------------- | ----- | -------------------------------------------------------------------------------- | ---- |
| `SubmitDefiRequestDto`            | Class | `src/modules/formations/interfaces/dto/contrat/submit-defi.request.dto.ts`       | 4    |
| `SubmitProductionRequestDto`      | Class | `src/modules/formations/interfaces/dto/contrat/submit-production.request.dto.ts` | 156  |
| `TenterEnigmeRequestDto`          | Class | `src/modules/formations/interfaces/dto/contrat/tenter-enigme.request.dto.ts`     | 4    |
| `SaveFreeResponseRequestDto`      | Class | `src/modules/formations/interfaces/dto/save-free-response.request.dto.ts`        | 4    |
| `SubmitAnswerRequestDto`          | Class | `src/modules/formations/interfaces/dto/submit-answer.request.dto.ts`             | 5    |
| `EcranDerouleResponseDto`         | Class | `src/modules/formations/interfaces/dto/contrat/deroule.response.dto.ts`          | 206  |
| `EcranPublicResponseDto`          | Class | `src/modules/formations/interfaces/dto/contrat/sujet.response.dto.ts`            | 11   |
| `EcranPublicResponseDto`          | Class | `src/modules/formations/interfaces/dto/sujet.response.dto.ts`                    | 2    |
| `RapportQuestionResponseDto`      | Class | `src/modules/formations/interfaces/dto/contrat/session-results.response.dto.ts`  | 26   |
| `RapportQuestionResponseDto`      | Class | `src/modules/formations/interfaces/dto/session-results.response.dto.ts`          | 2    |
| `RegleDeNotationResponseDto`      | Class | `src/modules/formations/interfaces/dto/contrat/session-results.response.dto.ts`  | 107  |
| `RegleDeNotationResponseDto`      | Class | `src/modules/formations/interfaces/dto/session-results.response.dto.ts`          | 133  |
| `CoursPublicCatalogueResponseDto` | Class | `src/modules/formations/interfaces/dto/contrat/sujet.response.dto.ts`            | 32   |
| `SujetResponseDto`                | Class | `src/modules/formations/interfaces/dto/contrat/sujet.response.dto.ts`            | 24   |
| `PilotageEcranRequestDto`         | Class | `src/modules/formations/interfaces/dto/contrat/control-session.request.dto.ts`   | 37   |
| `ResultatQuestionResponseDto`     | Class | `src/modules/formations/interfaces/dto/contrat/session-results.response.dto.ts`  | 59   |
| `ResultatQuestionResponseDto`     | Class | `src/modules/formations/interfaces/dto/session-results.response.dto.ts`          | 83   |
| `ControlSessionRequestDto`        | Class | `src/modules/formations/interfaces/dto/contrat/control-session.request.dto.ts`   | 97   |
| `ControlSessionRequestDto`        | Class | `src/modules/formations/interfaces/dto/control-session.request.dto.ts`           | 18   |
| `DerouleResponseDto`              | Class | `src/modules/formations/interfaces/dto/contrat/deroule.response.dto.ts`          | 245  |

## How to Explore

1. `context({name: "DureeDeReponse"})` — see callers and callees
2. `query({search_query: "contrat"})` — find related execution flows
3. Read key files listed above for implementation details
4. `explain({target: "<file or symbol>"})` — persisted taint findings (source→sink data flows), when indexed with `--pdg`
