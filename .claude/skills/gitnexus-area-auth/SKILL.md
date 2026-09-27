---
name: gitnexus-area-auth
description: 'Skill for the Auth area of portfolio-2025-back. 19 symbols across 14 files.'
---

# Auth

19 symbols | 14 files | Cohesion: 77%

## When to Use

- Working with code in `src/`
- Understanding how createHttpExecutionContext, buildJwtPayload, canActivate work
- Modifying auth-related functionality

## Key Files

| File                                                           | Symbols                                                                                           |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `src/common/interfaces/auth/jwt-auth.guard.ts`                 | canActivate, ensureAccountExistsAndEmailVerified, isEmailVerificationExempt, AuthenticatedRequest |
| `src/common/interfaces/auth/jwt-auth.guard.spec.ts`            | createMockContext, givenVerifiedToken                                                             |
| `src/common/interfaces/auth/roles.guard.spec.ts`               | contexteExigeant, createMockContext                                                               |
| `src/modules/users/application/GetCurrentUser.useCase.ts`      | execute                                                                                           |
| `src/modules/users/application/ListOneUser.useCase.ts`         | execute                                                                                           |
| `src/modules/users/application/RefreshTokens.useCase.ts`       | ouvrirUneSession                                                                                  |
| `src/modules/users/domain/IUsers.repository.ts`                | findById                                                                                          |
| `src/modules/users/infrastructure/Users.repository.typeORM.ts` | findById                                                                                          |
| `src/modules/users/interfaces/Auth.controller.ts`              | me                                                                                                |
| `src/modules/users/interfaces/Users.controller.ts`             | findOne                                                                                           |

## Entry Points

Start here when exploring this area:

- **`createHttpExecutionContext`** (Function) — `test/factories/execution-context.factory.ts:20`
- **`buildJwtPayload`** (Function) — `test/factories/user.factory.ts:64`
- **`canActivate`** (Method) — `src/common/interfaces/auth/jwt-auth.guard.ts:35`
- **`ensureAccountExistsAndEmailVerified`** (Method) — `src/common/interfaces/auth/jwt-auth.guard.ts:71`
- **`isEmailVerificationExempt`** (Method) — `src/common/interfaces/auth/jwt-auth.guard.ts:83`

## Key Symbols

| Symbol                                | Type      | File                                                           | Line |
| ------------------------------------- | --------- | -------------------------------------------------------------- | ---- |
| `createHttpExecutionContext`          | Function  | `test/factories/execution-context.factory.ts`                  | 20   |
| `buildJwtPayload`                     | Function  | `test/factories/user.factory.ts`                               | 64   |
| `canActivate`                         | Method    | `src/common/interfaces/auth/jwt-auth.guard.ts`                 | 35   |
| `ensureAccountExistsAndEmailVerified` | Method    | `src/common/interfaces/auth/jwt-auth.guard.ts`                 | 71   |
| `isEmailVerificationExempt`           | Method    | `src/common/interfaces/auth/jwt-auth.guard.ts`                 | 83   |
| `execute`                             | Method    | `src/modules/users/application/GetCurrentUser.useCase.ts`      | 13   |
| `execute`                             | Method    | `src/modules/users/application/ListOneUser.useCase.ts`         | 6    |
| `ouvrirUneSession`                    | Method    | `src/modules/users/application/RefreshTokens.useCase.ts`       | 61   |
| `findById`                            | Method    | `src/modules/users/domain/IUsers.repository.ts`                | 5    |
| `findById`                            | Method    | `src/modules/users/infrastructure/Users.repository.typeORM.ts` | 19   |
| `me`                                  | Method    | `src/modules/users/interfaces/Auth.controller.ts`              | 403  |
| `findOne`                             | Method    | `src/modules/users/interfaces/Users.controller.ts`             | 59   |
| `createMockContext`                   | Function  | `src/common/interfaces/auth/jwt-auth.guard.spec.ts`            | 39   |
| `givenVerifiedToken`                  | Function  | `src/common/interfaces/auth/jwt-auth.guard.spec.ts`            | 48   |
| `contexteExigeant`                    | Function  | `src/common/interfaces/auth/roles.guard.spec.ts`               | 24   |
| `createMockContext`                   | Function  | `src/common/interfaces/auth/roles.guard.spec.ts`               | 20   |
| `AuthenticatedRequest`                | Interface | `src/common/interfaces/auth/jwt-auth.guard.ts`                 | 22   |
| `ArticleRequest`                      | Interface | `src/modules/articles/interfaces/article-hmac.guard.ts`        | 9    |
| `Request`                             | Interface | `src/types/express.d.ts`                                       | 8    |

## Execution Flows

| Flow                                | Type            | Steps |
| ----------------------------------- | --------------- | ----- |
| `Refresh → ServeurHttpDe`           | cross_community | 10    |
| `Refresh → RouteFormations`         | cross_community | 9     |
| `Refresh → ParseExpiresIn`          | cross_community | 6     |
| `ChangePassword → FindById`         | cross_community | 4     |
| `ChangePassword → FindById`         | cross_community | 4     |
| `Refresh → FindById`                | cross_community | 4     |
| `Refresh → FindById`                | cross_community | 4     |
| `Refresh → InvalidCredentialsError` | cross_community | 4     |
| `UpdateProfile → FindById`          | cross_community | 4     |
| `UpdateProfile → FindById`          | cross_community | 4     |

## How to Explore

1. `context({name: "createHttpExecutionContext"})` — see callers and callees
2. `query({search_query: "auth"})` — find related execution flows
3. Read key files listed above for implementation details
4. `explain({target: "<file or symbol>"})` — persisted taint findings (source→sink data flows), when indexed with `--pdg`
