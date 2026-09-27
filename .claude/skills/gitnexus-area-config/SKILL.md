---
name: gitnexus-area-config
description: 'Skill for the Config area of portfolio-2025-back. 18 symbols across 6 files.'
---

# Config

18 symbols | 6 files | Cohesion: 97%

## When to Use

- Working with code in `src/`
- Understanding how loadSecurityConfig, envBool, envFloat work
- Modifying config-related functionality

## Key Files

| File                                                                   | Symbols                                                                                       |
| ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `src/config/env.validation.ts`                                         | addSmtpIssues, allowsHeaderInjection, angledAddress, declaresSeveralMailboxes, envSchema (+4) |
| `src/config/env-readers.util.ts`                                       | envBool, envFloat, envInt, envString                                                          |
| `src/modules/formations/infrastructure/StreamCapacity.service.ts`      | constructor, options                                                                          |
| `src/common/interfaces/security/security.config.ts`                    | loadSecurityConfig                                                                            |
| `src/modules/audit-requests/infrastructure/automation/audit.config.ts` | loadAuditAutomationConfig                                                                     |
| `src/config/env-examples.spec.ts`                                      | demarrer                                                                                      |

## Entry Points

Start here when exploring this area:

- **`loadSecurityConfig`** (Function) — `src/common/interfaces/security/security.config.ts:8`
- **`envBool`** (Function) — `src/config/env-readers.util.ts:12`
- **`envFloat`** (Function) — `src/config/env-readers.util.ts:6`
- **`envInt`** (Function) — `src/config/env-readers.util.ts:0`
- **`envString`** (Function) — `src/config/env-readers.util.ts:19`

## Key Symbols

| Symbol                             | Type     | File                                                                   | Line |
| ---------------------------------- | -------- | ---------------------------------------------------------------------- | ---- |
| `loadSecurityConfig`               | Function | `src/common/interfaces/security/security.config.ts`                    | 8    |
| `envBool`                          | Function | `src/config/env-readers.util.ts`                                       | 12   |
| `envFloat`                         | Function | `src/config/env-readers.util.ts`                                       | 6    |
| `envInt`                           | Function | `src/config/env-readers.util.ts`                                       | 0    |
| `envString`                        | Function | `src/config/env-readers.util.ts`                                       | 19   |
| `loadAuditAutomationConfig`        | Function | `src/modules/audit-requests/infrastructure/automation/audit.config.ts` | 59   |
| `validateEnv`                      | Function | `src/config/env.validation.ts`                                         | 365  |
| `constructor`                      | Method   | `src/modules/formations/infrastructure/StreamCapacity.service.ts`      | 64   |
| `options`                          | Method   | `src/modules/formations/infrastructure/StreamCapacity.service.ts`      | 131  |
| `addSmtpIssues`                    | Function | `src/config/env.validation.ts`                                         | 28   |
| `allowsHeaderInjection`            | Function | `src/config/env.validation.ts`                                         | 301  |
| `angledAddress`                    | Function | `src/config/env.validation.ts`                                         | 309  |
| `declaresSeveralMailboxes`         | Function | `src/config/env.validation.ts`                                         | 305  |
| `envSchema`                        | Function | `src/config/env.validation.ts`                                         | 218  |
| `findDuplicateCryptographicSecret` | Function | `src/config/env.validation.ts`                                         | 12   |
| `isValidMailbox`                   | Function | `src/config/env.validation.ts`                                         | 324  |
| `demarrer`                         | Function | `src/config/env-examples.spec.ts`                                      | 31   |
| `resolveAliases`                   | Function | `src/config/env.validation.ts`                                         | 332  |

## How to Explore

1. `context({name: "loadSecurityConfig"})` — see callers and callees
2. `query({search_query: "config"})` — find related execution flows
3. Read key files listed above for implementation details
4. `explain({target: "<file or symbol>"})` — persisted taint findings (source→sink data flows), when indexed with `--pdg`
