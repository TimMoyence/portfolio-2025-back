---
name: gitnexus-area-dto
description: 'Skill for the Dto area of portfolio-2025-back. 90 symbols across 70 files.'
---

# Dto

90 symbols | 70 files | Cohesion: 87%

## When to Use

- Working with code in `src/`
- Understanding how MotDePasseRobuste, RolesValides, TelephoneOptionnel work
- Modifying dto-related functionality

## Key Files

| File                                                                                 | Symbols                                                          |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------------------- |
| `src/common/interfaces/dto/champs-de-contenu.decorator.ts`                           | RangDAffichage, SlugDeContenu, StatutDePublication, StatutPublie |
| `src/modules/users/interfaces/dto/regles-de-saisie.ts`                               | MotDePasseRobuste, RolesValides, TelephoneOptionnel              |
| `src/common/interfaces/dto/champs-de-contenu.decorator.spec.ts`                      | ContenuTemoin, ReponseTemoin                                     |
| `src/common/interfaces/dto/pagination.query.dto.ts`                                  | PaginationQueryDto, ChoixOptionnel                               |
| `src/modules/redirects/interfaces/dto/redirect-list.query.dto.ts`                    | RedirectListQueryDto, parseBooleanQueryValue                     |
| `src/modules/lead-magnets/interfaces/dto/toolkit-page.response.dto.ts`               | ToolkitPageResponseDto, fromContent                              |
| `src/modules/presentations/interfaces/dto/presentation-interactions.response.dto.ts` | PresentationInteractionsResponseDto, fromDomain                  |
| `src/modules/redirects/interfaces/dto/redirect.response.dto.ts`                      | RedirectResponseDto, fromDomain                                  |
| `src/modules/redirects/interfaces/Redirects.controller.ts`                           | create, findAll                                                  |
| `src/modules/services/interfaces/dto/service.response.dto.ts`                        | ServiceResponseDto, fromDomain                                   |

## Entry Points

Start here when exploring this area:

- **`MotDePasseRobuste`** (Function) — `src/modules/users/interfaces/dto/regles-de-saisie.ts:13`
- **`RolesValides`** (Function) — `src/modules/users/interfaces/dto/regles-de-saisie.ts:35`
- **`TelephoneOptionnel`** (Function) — `src/modules/users/interfaces/dto/regles-de-saisie.ts:26`
- **`RangDAffichage`** (Function) — `src/common/interfaces/dto/champs-de-contenu.decorator.ts:45`
- **`SlugDeContenu`** (Function) — `src/common/interfaces/dto/champs-de-contenu.decorator.ts:15`

## Key Symbols

| Symbol                                | Type  | File                                                                                 | Line |
| ------------------------------------- | ----- | ------------------------------------------------------------------------------------ | ---- |
| `ChangePasswordDto`                   | Class | `src/modules/users/interfaces/dto/ChangePassword.dto.ts`                             | 5    |
| `CreateUserDto`                       | Class | `src/modules/users/interfaces/dto/CreateUser.dto.ts`                                 | 15   |
| `ResetPasswordDto`                    | Class | `src/modules/users/interfaces/dto/ResetPassword.dto.ts`                              | 5    |
| `SetPasswordDto`                      | Class | `src/modules/users/interfaces/dto/SetPassword.dto.ts`                                | 4    |
| `UpdateProfileDto`                    | Class | `src/modules/users/interfaces/dto/UpdateProfile.dto.ts`                              | 5    |
| `UpdateUserDto`                       | Class | `src/modules/users/interfaces/dto/UpdateUser.dto.ts`                                 | 9    |
| `CourseRequestDto`                    | Class | `src/modules/courses/interfaces/dto/course.request.dto.ts`                           | 4    |
| `ProjectRequestDto`                   | Class | `src/modules/projects/interfaces/dto/project.request.dto.ts`                         | 20   |
| `RedirectRequestDto`                  | Class | `src/modules/redirects/interfaces/dto/redirect.request.dto.ts`                       | 4    |
| `ServiceRequestDto`                   | Class | `src/modules/services/interfaces/dto/service.request.dto.ts`                         | 9    |
| `PaginationQueryDto`                  | Class | `src/common/interfaces/dto/pagination.query.dto.ts`                                  | 24   |
| `CourseListQueryDto`                  | Class | `src/modules/courses/interfaces/dto/course-list.query.dto.ts`                        | 8    |
| `ProjectListQueryDto`                 | Class | `src/modules/projects/interfaces/dto/project-list.query.dto.ts`                      | 10   |
| `RedirectListQueryDto`                | Class | `src/modules/redirects/interfaces/dto/redirect-list.query.dto.ts`                    | 30   |
| `ServiceListQueryDto`                 | Class | `src/modules/services/interfaces/dto/service-list.query.dto.ts`                      | 9    |
| `ToolkitPageResponseDto`              | Class | `src/modules/lead-magnets/interfaces/dto/toolkit-page.response.dto.ts`               | 3    |
| `PresentationInteractionsResponseDto` | Class | `src/modules/presentations/interfaces/dto/presentation-interactions.response.dto.ts` | 3    |
| `RedirectResponseDto`                 | Class | `src/modules/redirects/interfaces/dto/redirect.response.dto.ts`                      | 3    |
| `ServiceResponseDto`                  | Class | `src/modules/services/interfaces/dto/service.response.dto.ts`                        | 5    |
| `AuthResponseDto`                     | Class | `src/modules/users/interfaces/dto/Auth.response.dto.ts`                              | 4    |

## Execution Flows

| Flow                               | Type            | Steps |
| ---------------------------------- | --------------- | ----- |
| `Create → DomainValidationError`   | cross_community | 8     |
| `Create → DomainValidationError`   | cross_community | 7     |
| `Create → Slug`                    | cross_community | 6     |
| `Create → Slug`                    | cross_community | 6     |
| `Create → Slug`                    | cross_community | 6     |
| `Create → DomainValidationError`   | cross_community | 6     |
| `Create → Projects`                | cross_community | 5     |
| `Create → Redirects`               | cross_community | 5     |
| `Create → Services`                | cross_community | 5     |
| `UpdateProfile → OptionalMetadata` | cross_community | 5     |

## How to Explore

1. `context({name: "MotDePasseRobuste"})` — see callers and callees
2. `query({search_query: "dto"})` — find related execution flows
3. Read key files listed above for implementation details
4. `explain({target: "<file or symbol>"})` — persisted taint findings (source→sink data flows), when indexed with `--pdg`
