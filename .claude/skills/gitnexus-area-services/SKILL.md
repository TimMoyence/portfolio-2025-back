---
name: gitnexus-area-services
description: 'Skill for the Services area of portfolio-2025-back. 43 symbols across 22 files.'
---

# Services

43 symbols | 22 files | Cohesion: 71%

## When to Use

- Working with code in `src/`
- Understanding how buildAuthResult, createMockEmailVerificationTokensRepo, UserNotFoundError work
- Modifying services-related functionality

## Key Files

| File                                                                    | Symbols                                                                               |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `src/modules/users/application/services/JwtTokenService.ts`             | getKid, parseExpiresIn, sign, toJwtPayload, toVerificationError (+5)                  |
| `src/modules/users/application/services/PasswordService.ts`             | equalizeVerifyTiming, hash, needsRehash, onModuleInit, precomputeTimingDecoyHash (+3) |
| `src/modules/users/interfaces/Auth.controller.ts`                       | changePassword, pourLeCompteConnecte, setPassword                                     |
| `src/modules/users/application/services/email-verification-dispatch.ts` | buildVerificationUrl, envoyer, EnvoiDeVerificationEmail                               |
| `test/auth-flow.http-socket.spec.ts`                                    | sessionSigneePour, signerPour                                                         |
| `src/common/domain/errors/UserNotFoundError.ts`                         | UserNotFoundError                                                                     |
| `src/modules/users/application/AuthenticateUser.useCase.spec.ts`        | attendreConnexionRefuseeSansVerification                                              |
| `src/modules/users/application/AuthenticateUser.useCase.ts`             | execute                                                                               |
| `src/modules/users/application/CasDUsageUtilisateurs.ts`                | utilisateurExistant                                                                   |
| `src/modules/users/application/ChangePassword.useCase.ts`               | execute                                                                               |

## Entry Points

Start here when exploring this area:

- **`buildAuthResult`** (Function) — `test/factories/user.factory.ts:77`
- **`createMockEmailVerificationTokensRepo`** (Function) — `test/factories/email-verification-token.factory.ts:16`
- **`UserNotFoundError`** (Class) — `src/common/domain/errors/UserNotFoundError.ts:2`
- **`EnvoiDeVerificationEmail`** (Class) — `src/modules/users/application/services/email-verification-dispatch.ts:28`
- **`execute`** (Method) — `src/modules/users/application/AuthenticateUser.useCase.ts:29`

## Key Symbols

| Symbol                                  | Type     | File                                                                    | Line |
| --------------------------------------- | -------- | ----------------------------------------------------------------------- | ---- |
| `UserNotFoundError`                     | Class    | `src/common/domain/errors/UserNotFoundError.ts`                         | 2    |
| `EnvoiDeVerificationEmail`              | Class    | `src/modules/users/application/services/email-verification-dispatch.ts` | 28   |
| `buildAuthResult`                       | Function | `test/factories/user.factory.ts`                                        | 77   |
| `createMockEmailVerificationTokensRepo` | Function | `test/factories/email-verification-token.factory.ts`                    | 16   |
| `execute`                               | Method   | `src/modules/users/application/AuthenticateUser.useCase.ts`             | 29   |
| `utilisateurExistant`                   | Method   | `src/modules/users/application/CasDUsageUtilisateurs.ts`                | 14   |
| `execute`                               | Method   | `src/modules/users/application/ChangePassword.useCase.ts`               | 8    |
| `execute`                               | Method   | `src/modules/users/application/SetPassword.useCase.ts`                  | 9    |
| `execute`                               | Method   | `src/modules/users/application/UpdateProfile.useCase.ts`                | 8    |
| `execute`                               | Method   | `src/modules/users/application/UpdateUsers.useCase.ts`                  | 8    |
| `equalizeVerifyTiming`                  | Method   | `src/modules/users/application/services/PasswordService.ts`             | 30   |
| `hash`                                  | Method   | `src/modules/users/application/services/PasswordService.ts`             | 42   |
| `needsRehash`                           | Method   | `src/modules/users/application/services/PasswordService.ts`             | 56   |
| `onModuleInit`                          | Method   | `src/modules/users/application/services/PasswordService.ts`             | 26   |
| `precomputeTimingDecoyHash`             | Method   | `src/modules/users/application/services/PasswordService.ts`             | 35   |
| `verify`                                | Method   | `src/modules/users/application/services/PasswordService.ts`             | 46   |
| `verifyLegacy`                          | Method   | `src/modules/users/application/services/PasswordService.ts`             | 80   |
| `verifyWithSalt`                        | Method   | `src/modules/users/application/services/PasswordService.ts`             | 60   |
| `update`                                | Method   | `src/modules/users/domain/IUsers.repository.ts`                         | 8    |
| `update`                                | Method   | `src/modules/users/infrastructure/Users.repository.typeORM.ts`          | 31   |

## Execution Flows

| Flow                                 | Type            | Steps |
| ------------------------------------ | --------------- | ----- |
| `Refresh → ServeurHttpDe`            | cross_community | 10    |
| `Refresh → RouteFormations`          | cross_community | 9     |
| `Refresh → ParseExpiresIn`           | cross_community | 6     |
| `UpdateProfile → OptionalMetadata`   | cross_community | 5     |
| `Envoyer → AbsoluteScheme`           | cross_community | 5     |
| `Envoyer → EscapeHtml`               | cross_community | 5     |
| `Envoyer → EscapeHtml`               | cross_community | 4     |
| `ChangePassword → UserNotFoundError` | intra_community | 4     |
| `ChangePassword → FindById`          | cross_community | 4     |
| `ChangePassword → FindById`          | cross_community | 4     |

## How to Explore

1. `context({name: "buildAuthResult"})` — see callers and callees
2. `query({search_query: "services"})` — find related execution flows
3. Read key files listed above for implementation details
4. `explain({target: "<file or symbol>"})` — persisted taint findings (source→sink data flows), when indexed with `--pdg`
