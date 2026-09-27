---
name: gitnexus-area-infrastructure
description: 'Skill for the Infrastructure area of portfolio-2025-back. 377 symbols across 173 files.'
---

# Infrastructure

377 symbols | 173 files | Cohesion: 74%

## When to Use

- Working with code in `src/`
- Understanding how mapDomainValidation, optionalMetadata, valeursDeProvenance work
- Modifying infrastructure-related functionality

## Key Files

| File                                                                               | Symbols                                                                                                                                |
| ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `src/modules/newsletter/infrastructure/NewsletterMailer.service.ts`                | trimSlashes, buildApiUrl, buildConfirmationHtml, buildGreeting, buildUnsubscribeAckHtml (+10)                                          |
| `src/modules/formations/infrastructure/FormationMailer.service.ts`                 | neutraliserCelluleCsv, sendSyntheseFormateur, syntheseHtml, syntheseTexte, toCsv (+5)                                                  |
| `src/modules/newsletter/infrastructure/NewsletterSubscriber.repository.typeorm.ts` | create, findByConfirmToken, findByEmailAndSource, findByUnsubscribeToken, toDomain (+4)                                                |
| `src/modules/lead-magnets/infrastructure/ToolkitHtmlRenderer.service.ts`           | render, renderCheatsheet, renderCover, renderGeneratedPrompt, renderPrompts (+4)                                                       |
| `src/modules/formations/infrastructure/Answers.repository.typeorm.ts`              | correctionDe, create, existsFor, remplacer, toDomain (+3)                                                                              |
| `src/modules/articles/infrastructure/article-broadcast.mailer.ts`                  | itemHtml, bareAddress, emailSections, text, truncate (+3)                                                                              |
| `src/modules/formations/infrastructure/FormationMailer.service.spec.ts`            | buildCopie, buildParticipant, buildRapport, buildRapportAvecReponses, copie (+3)                                                       |
| `src/modules/formations/domain/errors/FormationErrors.ts`                          | SessionCodeAlreadyActiveError, AnswerAlreadySubmittedError, TypeDeQuestionError, RevisionDeSeanceObsoleteError, EcranInconnuError (+2) |
| `src/modules/formations/infrastructure/Participants.repository.typeorm.ts`         | ParticipantsRepositoryTypeORM, assurerUnePlaceLibre, inscrireSousVerrou, readmettre, verrouillerLaSeance (+2)                          |
| `src/modules/lead-magnets/infrastructure/ToolkitContentAssembler.service.ts`       | assemble, buildCheatsheet, buildPrompts, buildTemplates, buildWorkflows (+2)                                                           |

## Entry Points

Start here when exploring this area:

- **`mapDomainValidation`** (Function) — `src/common/application/mappers/map-domain-validation.ts:3`
- **`optionalMetadata`** (Function) — `src/common/domain/validation/domain-validators.ts:62`
- **`valeursDeProvenance`** (Function) — `src/common/infrastructure/typeorm/ColonnesDeProvenance.ts:29`
- **`wrapUntrustedUserPayload`** (Function) — `src/modules/audit-requests/infrastructure/automation/shared/prompt-sanitize.util.ts:27`
- **`issueAuthSession`** (Function) — `src/modules/users/application/services/issue-auth-session.ts:24`

## Key Symbols

| Symbol                                 | Type  | File                                                                              | Line |
| -------------------------------------- | ----- | --------------------------------------------------------------------------------- | ---- |
| `CookieConsent`                        | Class | `src/modules/cookie-consents/domain/CookieConsent.ts`                             | 33   |
| `SessionCodeAlreadyActiveError`        | Class | `src/modules/formations/domain/errors/FormationErrors.ts`                         | 308  |
| `LeadMagnetRequest`                    | Class | `src/modules/lead-magnets/domain/LeadMagnetRequest.ts`                            | 18   |
| `AnswerAlreadySubmittedError`          | Class | `src/modules/formations/domain/errors/FormationErrors.ts`                         | 128  |
| `TypeDeQuestionError`                  | Class | `src/modules/formations/domain/errors/FormationErrors.ts`                         | 166  |
| `EscapeRepositoryTypeORM`              | Class | `src/modules/formations/infrastructure/Escape.repository.typeorm.ts`              | 17   |
| `IncidentsRepositoryTypeORM`           | Class | `src/modules/formations/infrastructure/Incidents.repository.typeorm.ts`           | 11   |
| `MasteryRepositoryTypeORM`             | Class | `src/modules/formations/infrastructure/Mastery.repository.typeorm.ts`             | 12   |
| `PublicationDesCoursRepositoryTypeORM` | Class | `src/modules/formations/infrastructure/PublicationDesCours.repository.typeorm.ts` | 35   |
| `PulsesRepositoryTypeORM`              | Class | `src/modules/formations/infrastructure/Pulses.repository.typeorm.ts`              | 40   |
| `RappelsServisRepositoryTypeORM`       | Class | `src/modules/formations/infrastructure/RappelsServis.repository.typeorm.ts`       | 10   |
| `ScoresRepositoryTypeORM`              | Class | `src/modules/formations/infrastructure/Scores.repository.typeorm.ts`              | 15   |
| `DepotEnDomaine`                       | Class | `src/common/infrastructure/typeorm/DepotEnDomaine.ts`                             | 8    |
| `AnswersRepositoryTypeORM`             | Class | `src/modules/formations/infrastructure/Answers.repository.typeorm.ts`             | 66   |
| `FreeResponsesRepositoryTypeORM`       | Class | `src/modules/formations/infrastructure/FreeResponses.repository.typeorm.ts`       | 26   |
| `ParticipantsRepositoryTypeORM`        | Class | `src/modules/formations/infrastructure/Participants.repository.typeorm.ts`        | 25   |
| `SessionsRepositoryTypeORM`            | Class | `src/modules/formations/infrastructure/Sessions.repository.typeorm.ts`            | 33   |
| `TeacherAnnotationsRepositoryTypeORM`  | Class | `src/modules/formations/infrastructure/TeacherAnnotations.repository.typeorm.ts`  | 14   |
| `ExpediteurSmtp`                       | Class | `src/common/infrastructure/mail/expediteur-smtp.ts`                               | 5    |
| `LeadMagnetMailerService`              | Class | `src/modules/lead-magnets/infrastructure/LeadMagnetMailer.service.ts`             | 10   |

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

1. `context({name: "mapDomainValidation"})` — see callers and callees
2. `query({search_query: "infrastructure"})` — find related execution flows
3. Read key files listed above for implementation details
4. `explain({target: "<file or symbol>"})` — persisted taint findings (source→sink data flows), when indexed with `--pdg`
