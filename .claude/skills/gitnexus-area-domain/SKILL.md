---
name: gitnexus-area-domain
description: 'Skill for the Domain area of portfolio-2025-back. 273 symbols across 120 files.'
---

# Domain

273 symbols | 120 files | Cohesion: 69%

## When to Use

- Working with code in `src/`
- Understanding how requireHttpUrl, requireText, requireValidDate work
- Modifying domain-related functionality

## Key Files

| File                                                           | Symbols                                                                                                 |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `src/modules/formations/domain/SessionReport.ts`               | buildRapportSession, completionDe, compteCommeReponse, conceptsFragilesDe, signalerTiragesEnEchec (+10) |
| `src/modules/formations/domain/Bareme.ts`                      | estConcept, findQuestion, questionDuBareme, questionsAAgreger, questionsDuBareme (+7)                   |
| `src/modules/formations/domain/ResultatsSeance.ts`             | agregerQuestion, agregerResultats, compterParCle, moyenneDesScores, cleDeVote (+3)                      |
| `src/modules/newsletter/domain/NewsletterSubscriber.ts`        | NewsletterSubscriber, confirm, create, canResendConfirmation, isConfirmTokenExpired (+2)                |
| `src/modules/formations/domain/SessionReport.spec.ts`          | avertir, ecrite, ecriteAuTirage, premiereReponseDe, rapportDuTirage (+2)                                |
| `src/modules/formations/application/ControlSession.useCase.ts` | assertDansLesBornesDuCours, intervalleValide, pilotageFusionne, validerEtProjeter, publier (+1)         |
| `src/modules/users/domain/User.ts`                             | parsePhone, requireBoolean, requireEmail, requireName, requirePasswordHash (+1)                         |
| `src/modules/audit-requests/domain/SelfAuditGuard.ts`          | SelfAuditForbiddenError, constructor, ensureNotSelf, extractHostname, matches (+1)                      |
| `src/common/domain/validation/domain-validators.ts`            | requireHttpUrl, requireText, requireValidDate, optionalHttpUrl, optionalText                            |
| `src/modules/formations/domain/ISessions.repository.ts`        | findActiveByCode, lireEtat, create, isCodeTaken, update                                                 |

## Entry Points

Start here when exploring this area:

- **`requireHttpUrl`** (Function) — `src/common/domain/validation/domain-validators.ts:39`
- **`requireText`** (Function) — `src/common/domain/validation/domain-validators.ts:2`
- **`requireValidDate`** (Function) — `src/common/domain/validation/domain-validators.ts:30`
- **`isFreeRangeValid`** (Function) — `src/modules/formations/domain/PacingMode.ts:9`
- **`buildAuditRequest`** (Function) — `test/factories/audit-requests.factory.ts:21`

## Key Symbols

| Symbol                       | Type  | File                                                                                  | Line |
| ---------------------------- | ----- | ------------------------------------------------------------------------------------- | ---- |
| `DomainValidationError`      | Class | `src/common/domain/errors/DomainValidationError.ts`                                   | 2    |
| `EmailAddress`               | Class | `src/common/domain/value-objects/EmailAddress.ts`                                     | 0    |
| `LocaleCode`                 | Class | `src/common/domain/value-objects/LocaleCode.ts`                                       | 2    |
| `PhoneNumber`                | Class | `src/common/domain/value-objects/PhoneNumber.ts`                                      | 0    |
| `AuditRequest`               | Class | `src/modules/audit-requests/domain/AuditRequest.ts`                                   | 20   |
| `Contacts`                   | Class | `src/modules/contacts/domain/Contacts.ts`                                             | 11   |
| `NewsletterSubscriber`       | Class | `src/modules/newsletter/domain/NewsletterSubscriber.ts`                               | 22   |
| `Slug`                       | Class | `src/common/domain/value-objects/Slug.ts`                                             | 2    |
| `Courses`                    | Class | `src/modules/courses/domain/Courses.ts`                                               | 13   |
| `Projects`                   | Class | `src/modules/projects/domain/Projects.ts`                                             | 18   |
| `Redirects`                  | Class | `src/modules/redirects/domain/Redirects.ts`                                           | 12   |
| `Services`                   | Class | `src/modules/services/domain/Services.ts`                                             | 21   |
| `InvalidSessionCodeError`    | Class | `src/modules/formations/domain/errors/FormationErrors.ts`                             | 6    |
| `MessageLeadMagnetResponse`  | Class | `src/modules/lead-magnets/domain/MessageLeadMagnetResponse.ts`                        | 0    |
| `LeadMagnetResponseDto`      | Class | `src/modules/lead-magnets/interfaces/dto/lead-magnet.response.dto.ts`                 | 2    |
| `BlankFieldError`            | Class | `src/modules/formations/domain/errors/FormationErrors.ts`                             | 12   |
| `TokenHash`                  | Class | `src/modules/users/domain/TokenHash.ts`                                               | 2    |
| `ImprimeriePdf`              | Class | `src/common/infrastructure/pdf/ImprimeriePdf.ts`                                      | 19   |
| `AuditPdfGeneratorService`   | Class | `src/modules/audit-requests/infrastructure/automation/audit-pdf-generator.service.ts` | 11   |
| `ToolkitPdfGeneratorService` | Class | `src/modules/lead-magnets/infrastructure/ToolkitPdfGenerator.service.ts`              | 8    |

## Execution Flows

| Flow                                   | Type            | Steps |
| -------------------------------------- | --------------- | ----- |
| `Execute → VersEcranDeRecit`           | cross_community | 10    |
| `Execute → ConfusionsDuCorrige`        | cross_community | 10    |
| `Tenter → QuestionVote`                | cross_community | 10    |
| `Tenter → DefinitionFixe`              | cross_community | 10    |
| `Tenter → VersPiege`                   | cross_community | 10    |
| `Execute → QuestionVote`               | cross_community | 10    |
| `Execute → DefinitionFixe`             | cross_community | 10    |
| `Execute → VersPiege`                  | cross_community | 10    |
| `Create → DomainValidationError`       | cross_community | 8     |
| `Tenter → ContenuDeCoursInvalideError` | cross_community | 8     |

## How to Explore

1. `context({name: "requireHttpUrl"})` — see callers and callees
2. `query({search_query: "domain"})` — find related execution flows
3. Read key files listed above for implementation details
4. `explain({target: "<file or symbol>"})` — persisted taint findings (source→sink data flows), when indexed with `--pdg`
