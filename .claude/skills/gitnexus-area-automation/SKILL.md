---
name: gitnexus-area-automation
description: 'Skill for the Automation area of portfolio-2025-back. 377 symbols across 71 files.'
---

# Automation

377 symbols | 71 files | Cohesion: 80%

## When to Use

- Working with code in `src/`
- Understanding how hasLanguageMismatch, impactLocalise, priorityFromFinding work
- Modifying automation-related functionality

## Key Files

| File                                                                                         | Symbols                                                                                                                    |
| -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `src/modules/audit-requests/infrastructure/automation/audit-report-html-renderer.service.ts` | css, effortLabel, escapeHtml, formatDate, impactLabel (+20)                                                                |
| `src/modules/audit-requests/infrastructure/automation/report-quality-gate.service.ts`        | appendPriorities, apply, buildPillarAction, buildPriorities, cleanText (+17)                                               |
| `src/modules/audit-requests/infrastructure/automation/deep-url-analysis.service.ts`          | stripTrailingSlashes, classifyContentDepth, classifyInternalLinks, collectContentMetrics, collectIndexabilityMetrics (+17) |
| `src/modules/audit-requests/infrastructure/automation/audit-pipeline.service.ts`             | pushUnique, buildLocaleCoverage, normalizeCandidateUrl, selectUrlsForLocale, enqueueUpdate (+17)                           |
| `src/modules/audit-requests/infrastructure/automation/langchain-client-report.service.ts`    | averageScore, buildFallback, buildFallbackExecutiveSummary, buildFallbackQuickWins, buildRemainingFindingsSentence (+15)   |
| `src/modules/audit-requests/infrastructure/automation/page-ai-recap.service.ts`              | maybeOpenBreaker, recapForPage, priorityFromScore, analyzeSinglePage, buildFallbackRecap (+15)                             |
| `src/modules/audit-requests/infrastructure/automation/langchain-audit-report.service.ts`     | applyWarningsToReport, buildAdminReport, createLlm, fallback, generate (+13)                                               |
| `src/modules/audit-requests/infrastructure/automation/langchain-fallback-report.builder.ts`  | buildFallbackPerPageAnalysis, defaultEngineScore, ensurePriorityDepth, roundCurrency, sumHours (+6)                        |
| `src/modules/audit-requests/infrastructure/automation/llm-payload.builder.ts`                | payloadBytes, buildEvidenceBuckets, buildPayload, buildSampledUrlsSummary, buildSectionPayloads (+6)                       |
| `src/modules/audit-requests/infrastructure/automation/scoring.service.ts`                    | clamp, compute, computeSampledCoverage, copy, scoreAiVisibility (+6)                                                       |

## Entry Points

Start here when exploring this area:

- **`hasLanguageMismatch`** (Function) — `src/modules/audit-requests/infrastructure/automation/report-quality-gate/language-check.util.ts:38`
- **`impactLocalise`** (Function) — `src/modules/audit-requests/infrastructure/automation/shared/finding-priority.util.ts:19`
- **`priorityFromFinding`** (Function) — `src/modules/audit-requests/infrastructure/automation/shared/finding-priority.util.ts:30`
- **`localizedText`** (Function) — `src/modules/audit-requests/infrastructure/automation/shared/locale-text.util.ts:2`
- **`safeHtml`** (Function) — `src/common/infrastructure/mail/html-escape.util.ts:67`

## Key Symbols

| Symbol                         | Type     | File                                                                                              | Line |
| ------------------------------ | -------- | ------------------------------------------------------------------------------------------------- | ---- |
| `DeadlineBudget`               | Class    | `src/modules/audit-requests/infrastructure/automation/llm-execution.guardrails.ts`                | 7    |
| `AuditRequestResponseDto`      | Class    | `src/modules/audit-requests/interfaces/dto/audit-request.response.dto.ts`                         | 3    |
| `AiHeadersAnalyzerService`     | Class    | `src/modules/audit-requests/infrastructure/automation/ai-headers-analyzer.service.ts`             | 20   |
| `CitationWorthinessService`    | Class    | `src/modules/audit-requests/infrastructure/automation/citation-worthiness.service.ts`             | 27   |
| `StructuredDataQualityService` | Class    | `src/modules/audit-requests/infrastructure/automation/structured-data-quality.service.ts`         | 44   |
| `UrlIndexabilityService`       | Class    | `src/modules/audit-requests/infrastructure/automation/url-indexability.service.ts`                | 75   |
| `DeadlineExceededError`        | Class    | `src/modules/audit-requests/infrastructure/automation/llm-execution.guardrails.ts`                | 0    |
| `SitemapDiscoveryService`      | Class    | `src/modules/audit-requests/infrastructure/automation/sitemap-discovery.service.ts`               | 23   |
| `DefaultChatOpenAIFactory`     | Class    | `src/modules/audit-requests/infrastructure/automation/chat-openai.factory.ts`                     | 12   |
| `ReportQualityGateService`     | Class    | `src/modules/audit-requests/infrastructure/automation/report-quality-gate.service.ts`             | 237  |
| `LangchainClientReportService` | Class    | `src/modules/audit-requests/infrastructure/automation/langchain-client-report.service.ts`         | 116  |
| `LlmLimiteParLaConfig`         | Class    | `src/modules/audit-requests/infrastructure/automation/llm-executor.port.ts`                       | 14   |
| `SharedLlmExecutor`            | Class    | `src/modules/audit-requests/infrastructure/automation/llm-executor.port.ts`                       | 26   |
| `PageAiRecapService`           | Class    | `src/modules/audit-requests/infrastructure/automation/page-ai-recap.service.ts`                   | 99   |
| `LlmsTxtAnalyzerService`       | Class    | `src/modules/audit-requests/infrastructure/automation/llms-txt-analyzer.service.ts`               | 9    |
| `DefaultAnthropicChatFactory`  | Class    | `src/modules/audit-requests/infrastructure/automation/anthropic-chat.factory.ts`                  | 16   |
| `AuditPipelineService`         | Class    | `src/modules/audit-requests/infrastructure/automation/audit-pipeline.service.ts`                  | 41   |
| `AuditQueueService`            | Class    | `src/modules/audit-requests/infrastructure/automation/audit-queue.service.ts`                     | 23   |
| `AuditWorkerService`           | Class    | `src/modules/audit-requests/infrastructure/automation/audit-worker.service.ts`                    | 13   |
| `hasLanguageMismatch`          | Function | `src/modules/audit-requests/infrastructure/automation/report-quality-gate/language-check.util.ts` | 38   |

## Execution Flows

| Flow                                                     | Type            | Steps |
| -------------------------------------------------------- | --------------- | ----- |
| `InferTechFingerprint → ServeurHttpDe`                   | cross_community | 7     |
| `GenerateFanoutSectionsWithDeadline → Acquire`           | cross_community | 6     |
| `GenerateFanoutSectionsWithDeadline → Release`           | cross_community | 6     |
| `GenerateSequentialProfile → WrapUntrustedUserPayload`   | cross_community | 6     |
| `GenerateSequentialProfile → UserSummaryRetryConstraint` | cross_community | 6     |
| `GenerateSequentialProfile → UserSummarySystemMain`      | cross_community | 6     |
| `GenerateSequentialProfile → Disclaimer`                 | cross_community | 6     |
| `GenerateAndSend → SafeHtml`                             | cross_community | 6     |
| `GenerateParallelSectionsProfile → Acquire`              | cross_community | 6     |
| `InferTechFingerprint → RouteFormations`                 | cross_community | 6     |

## How to Explore

1. `context({name: "hasLanguageMismatch"})` — see callers and callees
2. `query({search_query: "automation"})` — find related execution flows
3. Read key files listed above for implementation details
4. `explain({target: "<file or symbol>"})` — persisted taint findings (source→sink data flows), when indexed with `--pdg`
