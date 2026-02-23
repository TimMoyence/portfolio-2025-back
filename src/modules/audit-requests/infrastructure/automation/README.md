# Automation Folder Architecture

This folder powers the `audit-requests` automation pipeline.

## Main flow

1. `audit-pipeline.service.ts`
2. `safe-fetch.service.ts` + `homepage-analyzer.service.ts`
3. `sitemap-discovery.service.ts` + `url-indexability.service.ts`
4. `deep-url-analysis.service.ts` + `page-ai-recap.service.ts`
5. `langchain-audit-report.service.ts`
6. `scoring.service.ts` + persistence/email side effects

## Shared utilities

- `shared/html-signals.util.ts`: CMS hints, internal links, header picks, cookie patterns.
- `shared/locale-text.util.ts`: locale text switch (`fr`/`en`).
- `shared/error.util.ts`: timeout detection helper.
- `shared/severity.util.ts`: severity ordering (`high` > `medium` > `low`).

## Decomposition guidelines

- Keep orchestration in `audit-pipeline.service.ts`; move pure transforms/builders to dedicated files.
- Keep LLM fallback/report shaping in dedicated builders (`langchain-fallback-report.builder.ts`).
- Reuse `shared/*` helpers before adding any new private utility in service classes.
- Prefer small step methods with explicit input objects over one long method body.

## Guardrails

- `automation-folder.guardrails.spec.ts` enforces:
  - no reintroduction of duplicated HTML signal helpers
  - no reintroduction of local `text/message` helpers
  - file size budgets on critical services
