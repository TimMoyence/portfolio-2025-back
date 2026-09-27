---
name: gitnexus-area-v1
description: 'Skill for the V1 area of portfolio-2025-back. 23 symbols across 5 files.'
---

# V1

23 symbols | 5 files | Cohesion: 71%

## When to Use

- Working with code in `src/`
- Understanding how expertReportCompactConstraint, expertReportRetryConstraint, expertReportStrictConstraint work
- Modifying v1-related functionality

## Key Files

| File                                                                                                      | Symbols                                                                                                                                                |
| --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/modules/audit-requests/infrastructure/automation/prompts/v1/audit-system-prompts.ts`                 | expertReportCompactConstraint, expertReportRetryConstraint, expertReportStrictConstraint, expertReportSystemMain, clientCommsRetryConstraint (+7)      |
| `src/modules/audit-requests/infrastructure/automation/section-generators/section-prompts.builder.ts`      | buildExpertReportSystemBlocks, buildClientCommsSystemBlocks, buildExecutionSystemBlocks, buildExecutiveSystemBlocks, buildUserSummarySystemBlocks (+1) |
| `src/modules/audit-requests/infrastructure/automation/section-generators/cacheable-section.generators.ts` | generateClientCommsSection, generateExecutionSection, generateExecutiveSection                                                                         |
| `src/modules/audit-requests/infrastructure/automation/section-generators/expert-report.generator.ts`      | generateExpertReport                                                                                                                                   |
| `src/modules/audit-requests/infrastructure/automation/langchain-audit-report.service.ts`                  | generateExpertReport                                                                                                                                   |

## Entry Points

Start here when exploring this area:

- **`expertReportCompactConstraint`** (Function) — `src/modules/audit-requests/infrastructure/automation/prompts/v1/audit-system-prompts.ts:64`
- **`expertReportRetryConstraint`** (Function) — `src/modules/audit-requests/infrastructure/automation/prompts/v1/audit-system-prompts.ts:69`
- **`expertReportStrictConstraint`** (Function) — `src/modules/audit-requests/infrastructure/automation/prompts/v1/audit-system-prompts.ts:59`
- **`expertReportSystemMain`** (Function) — `src/modules/audit-requests/infrastructure/automation/prompts/v1/audit-system-prompts.ts:54`
- **`generateExpertReport`** (Function) — `src/modules/audit-requests/infrastructure/automation/section-generators/expert-report.generator.ts:11`

## Key Symbols

| Symbol                          | Type     | File                                                                                                      | Line |
| ------------------------------- | -------- | --------------------------------------------------------------------------------------------------------- | ---- |
| `expertReportCompactConstraint` | Function | `src/modules/audit-requests/infrastructure/automation/prompts/v1/audit-system-prompts.ts`                 | 64   |
| `expertReportRetryConstraint`   | Function | `src/modules/audit-requests/infrastructure/automation/prompts/v1/audit-system-prompts.ts`                 | 69   |
| `expertReportStrictConstraint`  | Function | `src/modules/audit-requests/infrastructure/automation/prompts/v1/audit-system-prompts.ts`                 | 59   |
| `expertReportSystemMain`        | Function | `src/modules/audit-requests/infrastructure/automation/prompts/v1/audit-system-prompts.ts`                 | 54   |
| `generateExpertReport`          | Function | `src/modules/audit-requests/infrastructure/automation/section-generators/expert-report.generator.ts`      | 11   |
| `buildExpertReportSystemBlocks` | Function | `src/modules/audit-requests/infrastructure/automation/section-generators/section-prompts.builder.ts`      | 83   |
| `clientCommsRetryConstraint`    | Function | `src/modules/audit-requests/infrastructure/automation/prompts/v1/audit-system-prompts.ts`                 | 39   |
| `clientCommsSystemMain`         | Function | `src/modules/audit-requests/infrastructure/automation/prompts/v1/audit-system-prompts.ts`                 | 34   |
| `generateClientCommsSection`    | Function | `src/modules/audit-requests/infrastructure/automation/section-generators/cacheable-section.generators.ts` | 145  |
| `buildClientCommsSystemBlocks`  | Function | `src/modules/audit-requests/infrastructure/automation/section-generators/section-prompts.builder.ts`      | 61   |
| `executionRetryConstraint`      | Function | `src/modules/audit-requests/infrastructure/automation/prompts/v1/audit-system-prompts.ts`                 | 29   |
| `executionSystemMain`           | Function | `src/modules/audit-requests/infrastructure/automation/prompts/v1/audit-system-prompts.ts`                 | 24   |
| `generateExecutionSection`      | Function | `src/modules/audit-requests/infrastructure/automation/section-generators/cacheable-section.generators.ts` | 119  |
| `buildExecutionSystemBlocks`    | Function | `src/modules/audit-requests/infrastructure/automation/section-generators/section-prompts.builder.ts`      | 50   |
| `executiveRetryConstraint`      | Function | `src/modules/audit-requests/infrastructure/automation/prompts/v1/audit-system-prompts.ts`                 | 9    |
| `executiveSystemMain`           | Function | `src/modules/audit-requests/infrastructure/automation/prompts/v1/audit-system-prompts.ts`                 | 4    |
| `generateExecutiveSection`      | Function | `src/modules/audit-requests/infrastructure/automation/section-generators/cacheable-section.generators.ts` | 67   |
| `buildExecutiveSystemBlocks`    | Function | `src/modules/audit-requests/infrastructure/automation/section-generators/section-prompts.builder.ts`      | 28   |
| `userSummaryRetryConstraint`    | Function | `src/modules/audit-requests/infrastructure/automation/prompts/v1/audit-system-prompts.ts`                 | 49   |
| `userSummarySystemMain`         | Function | `src/modules/audit-requests/infrastructure/automation/prompts/v1/audit-system-prompts.ts`                 | 44   |

## Execution Flows

| Flow                                                       | Type            | Steps |
| ---------------------------------------------------------- | --------------- | ----- |
| `GenerateSequentialProfile → UserSummaryRetryConstraint`   | cross_community | 6     |
| `GenerateSequentialProfile → UserSummarySystemMain`        | cross_community | 6     |
| `GenerateSequentialProfile → Disclaimer`                   | cross_community | 6     |
| `GenerateCandidate → ExpertReportCompactConstraint`        | cross_community | 5     |
| `GenerateCandidate → ExpertReportStrictConstraint`         | cross_community | 5     |
| `GenerateCandidate → ExpertReportSystemMain`               | cross_community | 5     |
| `GenerateCandidate → WrapUntrustedUserPayload`             | cross_community | 5     |
| `GenerateSummaryWithDeadline → UserSummaryRetryConstraint` | cross_community | 5     |
| `GenerateSummaryWithDeadline → UserSummarySystemMain`      | cross_community | 5     |
| `GenerateCandidate → Disclaimer`                           | cross_community | 5     |

## How to Explore

1. `context({name: "expertReportCompactConstraint"})` — see callers and callees
2. `query({search_query: "v1"})` — find related execution flows
3. Read key files listed above for implementation details
4. `explain({target: "<file or symbol>"})` — persisted taint findings (source→sink data flows), when indexed with `--pdg`
