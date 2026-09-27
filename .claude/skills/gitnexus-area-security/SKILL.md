---
name: gitnexus-area-security
description: 'Skill for the Security area of portfolio-2025-back. 37 symbols across 10 files.'
---

# Security

37 symbols | 10 files | Cohesion: 89%

## When to Use

- Working with code in `src/`
- Understanding how firstMatchingReason, scoreAbort, scoreMissingAcceptLanguage work
- Modifying security-related functionality

## Key Files

| File                                                                        | Symbols                                                                                     |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `src/common/interfaces/security/suspicious-request-scorer.ts`               | firstMatchingReason, scoreAbort, scoreMissingAcceptLanguage, scorePath, scoreRateLimit (+5) |
| `src/common/interfaces/security/suspicious-request.interceptor.ts`          | intercept, resolveIp, complete, error, evaluateAndLog (+3)                                  |
| `src/common/interfaces/security/suspicious-request.interceptor.spec.ts`     | buildContext, attendreRienDePersiste, intercept, ipsTraceesApresCreation, topIPs            |
| `src/common/interfaces/security/client-ip.util.ts`                          | normalizeIp, provenanceDeLaRequete, resolveClientIp, resolveClientIpOrUnknown               |
| `src/common/interfaces/security/ISecurityEventsStore.ts`                    | getTopIPs, recordEvent, ISecurityEventsStore                                                |
| `src/common/interfaces/security/in-memory-security-events-store.ts`         | getTopIPs, recordEvent, InMemorySecurityEventsStore                                         |
| `src/common/interfaces/metrics/metrics.controller.ts`                       | getSecuritySummary                                                                          |
| `src/modules/cookie-consents/interfaces/dto/cookie-consent.response.dto.ts` | CookieConsentResponseDto                                                                    |
| `src/modules/cookie-consents/interfaces/CookieConsents.controller.ts`       | create                                                                                      |
| `src/modules/users/interfaces/Auth.controller.ts`                           | extractIp                                                                                   |

## Entry Points

Start here when exploring this area:

- **`firstMatchingReason`** (Function) — `src/common/interfaces/security/suspicious-request-scorer.ts:69`
- **`scoreAbort`** (Function) — `src/common/interfaces/security/suspicious-request-scorer.ts:95`
- **`scoreMissingAcceptLanguage`** (Function) — `src/common/interfaces/security/suspicious-request-scorer.ts:117`
- **`scorePath`** (Function) — `src/common/interfaces/security/suspicious-request-scorer.ts:86`
- **`scoreRateLimit`** (Function) — `src/common/interfaces/security/suspicious-request-scorer.ts:90`

## Key Symbols

| Symbol                        | Type      | File                                                                        | Line |
| ----------------------------- | --------- | --------------------------------------------------------------------------- | ---- |
| `CookieConsentResponseDto`    | Class     | `src/modules/cookie-consents/interfaces/dto/cookie-consent.response.dto.ts` | 2    |
| `InMemorySecurityEventsStore` | Class     | `src/common/interfaces/security/in-memory-security-events-store.ts`         | 17   |
| `firstMatchingReason`         | Function  | `src/common/interfaces/security/suspicious-request-scorer.ts`               | 69   |
| `scoreAbort`                  | Function  | `src/common/interfaces/security/suspicious-request-scorer.ts`               | 95   |
| `scoreMissingAcceptLanguage`  | Function  | `src/common/interfaces/security/suspicious-request-scorer.ts`               | 117  |
| `scorePath`                   | Function  | `src/common/interfaces/security/suspicious-request-scorer.ts`               | 86   |
| `scoreRateLimit`              | Function  | `src/common/interfaces/security/suspicious-request-scorer.ts`               | 90   |
| `scoreRequest`                | Function  | `src/common/interfaces/security/suspicious-request-scorer.ts`               | 123  |
| `scoreSensitiveWrite`         | Function  | `src/common/interfaces/security/suspicious-request-scorer.ts`               | 108  |
| `scoreUltraFastWrite`         | Function  | `src/common/interfaces/security/suspicious-request-scorer.ts`               | 99   |
| `scoreUserAgent`              | Function  | `src/common/interfaces/security/suspicious-request-scorer.ts`               | 80   |
| `weigh`                       | Function  | `src/common/interfaces/security/suspicious-request-scorer.ts`               | 76   |
| `provenanceDeLaRequete`       | Function  | `src/common/interfaces/security/client-ip.util.ts`                          | 22   |
| `resolveClientIp`             | Function  | `src/common/interfaces/security/client-ip.util.ts`                          | 16   |
| `resolveClientIpOrUnknown`    | Function  | `src/common/interfaces/security/client-ip.util.ts`                          | 34   |
| `complete`                    | Function  | `src/common/interfaces/security/suspicious-request.interceptor.ts`          | 111  |
| `error`                       | Function  | `src/common/interfaces/security/suspicious-request.interceptor.ts`          | 110  |
| `evaluateAndLog`              | Function  | `src/common/interfaces/security/suspicious-request.interceptor.ts`          | 53   |
| `next`                        | Function  | `src/common/interfaces/security/suspicious-request.interceptor.ts`          | 109  |
| `ISecurityEventsStore`        | Interface | `src/common/interfaces/security/ISecurityEventsStore.ts`                    | 21   |

## Execution Flows

| Flow                             | Type            | Steps |
| -------------------------------- | --------------- | ----- |
| `Create → LocaleCode`            | cross_community | 7     |
| `GoogleAuth → NormalizeIp`       | cross_community | 6     |
| `Refresh → NormalizeIp`          | cross_community | 6     |
| `Create → DomainValidationError` | cross_community | 6     |
| `Create → CookieConsent`         | cross_community | 5     |
| `EvaluateAndLog → NormalizeIp`   | cross_community | 5     |
| `Logout → NormalizeIp`           | cross_community | 5     |
| `Create → MapDomainValidation`   | cross_community | 4     |
| `Create → Create`                | cross_community | 4     |
| `Create → Create`                | cross_community | 4     |

## How to Explore

1. `context({name: "firstMatchingReason"})` — see callers and callees
2. `query({search_query: "security"})` — find related execution flows
3. Read key files listed above for implementation details
4. `explain({target: "<file or symbol>"})` — persisted taint findings (source→sink data flows), when indexed with `--pdg`
