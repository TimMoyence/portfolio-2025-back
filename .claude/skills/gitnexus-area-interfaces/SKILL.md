---
name: gitnexus-area-interfaces
description: 'Skill for the Interfaces area of portfolio-2025-back. 117 symbols across 51 files.'
---

# Interfaces

117 symbols | 51 files | Cohesion: 79%

## When to Use

- Working with code in `src/`
- Understanding how pageDemandee, reponsePaginee, LimiteParParticipant work
- Modifying interfaces-related functionality

## Key Files

| File                                                                  | Symbols                                                                                                 |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `src/modules/users/interfaces/Auth.controller.ts`                     | AuthController, googleAuth, login, ouvrirSession, refresh (+5)                                          |
| `src/modules/formations/interfaces/FormationsStudent.controller.ts`   | FormationsStudentController, constructor, estCodeSansSeance, join, answer (+4)                          |
| `src/modules/newsletter/interfaces/Newsletter.controller.ts`          | constructor, NewsletterController, assertValidToken, confirmEndpoint, handleUnsubscribe (+2)            |
| `src/modules/formations/interfaces/ParticipantToken.service.ts`       | verify, correspond, identiteSignee, lireLeJeton, verifierIdentite (+2)                                  |
| `src/modules/formations/interfaces/formations-throttling.ts`          | LimiteParParticipant, LimiteParMinute, identiteSigneeSansLever, parAdresse, suivreParCodeDeSession (+1) |
| `src/modules/articles/interfaces/article-moderation.controller.ts`    | articleIdOf, approveBroadcast, cancelBroadcast, restore, withdraw                                       |
| `src/common/interfaces/http/routes-de-catalogue.ts`                   | pageDemandee, reponsePaginee, CreationAdmin, ListePubliquePaginee                                       |
| `src/modules/formations/interfaces/formations-acces.ts`               | ControleurFormateur, LectureDeSeance, PilotageDeSeance, acteurDe                                        |
| `src/modules/formations/interfaces/FormationsPresenter.controller.ts` | FormationsPresenterController, exportReport, getResults, syntheseDesRappels                             |
| `src/modules/articles/interfaces/articles.controller.ts`              | ArticlesController, getBySlug, list, publicArticle                                                      |

## Entry Points

Start here when exploring this area:

- **`pageDemandee`** (Function) — `src/common/interfaces/http/routes-de-catalogue.ts:36`
- **`reponsePaginee`** (Function) — `src/common/interfaces/http/routes-de-catalogue.ts:101`
- **`LimiteParParticipant`** (Function) — `src/modules/formations/interfaces/formations-throttling.ts:60`
- **`buildFormationsStudentController`** (Function) — `test/factories/formations-controllers.factory.ts:49`
- **`Roles`** (Function) — `src/common/interfaces/auth/roles.decorator.ts:4`

## Key Symbols

| Symbol                             | Type  | File                                                                     | Line |
| ---------------------------------- | ----- | ------------------------------------------------------------------------ | ---- |
| `CourseResponseDto`                | Class | `src/modules/courses/interfaces/dto/course.response.dto.ts`              | 3    |
| `PublicFormProtectionService`      | Class | `src/common/interfaces/security/public-form-protection.service.ts`       | 11   |
| `FormationsStudentController`      | Class | `src/modules/formations/interfaces/FormationsStudent.controller.ts`      | 97   |
| `CoursesController`                | Class | `src/modules/courses/interfaces/Courses.controller.ts`                   | 17   |
| `ProjectsController`               | Class | `src/modules/projects/interfaces/Projects.controller.ts`                 | 18   |
| `RedirectsController`              | Class | `src/modules/redirects/interfaces/Redirects.controller.ts`               | 17   |
| `ServicesController`               | Class | `src/modules/services/interfaces/Services.controller.ts`                 | 18   |
| `FormationsAnnotationsController`  | Class | `src/modules/formations/interfaces/FormationsAnnotations.controller.ts`  | 23   |
| `FormationsParticipantsController` | Class | `src/modules/formations/interfaces/FormationsParticipants.controller.ts` | 49   |
| `FormationsPresenterController`    | Class | `src/modules/formations/interfaces/FormationsPresenter.controller.ts`    | 67   |
| `AppController`                    | Class | `src/app.controller.ts`                                                  | 8    |
| `HealthController`                 | Class | `src/common/interfaces/health/health.controller.ts`                      | 13   |
| `ArticlesController`               | Class | `src/modules/articles/interfaces/articles.controller.ts`                 | 29   |
| `CookieConsentsController`         | Class | `src/modules/cookie-consents/interfaces/CookieConsents.controller.ts`    | 17   |
| `PresentationsController`          | Class | `src/modules/presentations/interfaces/Presentations.controller.ts`       | 14   |
| `AuthController`                   | Class | `src/modules/users/interfaces/Auth.controller.ts`                        | 67   |
| `AuditsController`                 | Class | `src/modules/audit-requests/interfaces/Audits.controller.ts`             | 41   |
| `ContactsController`               | Class | `src/modules/contacts/interfaces/Contacts.controller.ts`                 | 16   |
| `LeadMagnetsController`            | Class | `src/modules/lead-magnets/interfaces/LeadMagnets.controller.ts`          | 32   |
| `NewsletterController`             | Class | `src/modules/newsletter/interfaces/Newsletter.controller.ts`             | 47   |

## Execution Flows

| Flow                                               | Type            | Steps |
| -------------------------------------------------- | --------------- | ----- |
| `SyntheseDesRappels → VersEcran`                   | cross_community | 10    |
| `SyntheseDesRappels → VersProduction`              | cross_community | 10    |
| `SyntheseDesRappels → QuestionDeVote`              | cross_community | 10    |
| `Refresh → ServeurHttpDe`                          | cross_community | 10    |
| `SyntheseDesRappels → ContenuDeCoursInvalideError` | cross_community | 9     |
| `SyntheseDesRappels → QuestionsDe`                 | cross_community | 9     |
| `SyntheseDesRappels → DoublonsDe`                  | cross_community | 9     |
| `Refresh → RouteFormations`                        | cross_community | 9     |
| `FreeResponse → ToDomain`                          | cross_community | 8     |
| `Production → ToDomain`                            | cross_community | 8     |

## How to Explore

1. `context({name: "pageDemandee"})` — see callers and callees
2. `query({search_query: "interfaces"})` — find related execution flows
3. Read key files listed above for implementation details
4. `explain({target: "<file or symbol>"})` — persisted taint findings (source→sink data flows), when indexed with `--pdg`
