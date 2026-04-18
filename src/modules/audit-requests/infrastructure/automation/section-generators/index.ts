/**
 * Barrel du module `section-generators/` — expose les generateurs de
 * section utilises par `LangchainAuditReportService`. Conserve une
 * frontiere explicite entre l'orchestration (service) et la construction
 * des prompts/invocations LLM (generators).
 */
export {
  CachingSectionRunner,
  type CachingSectionParams,
} from './caching-section.runner';
export {
  generateExecutiveSection,
  generatePrioritySection,
  generateExecutionSection,
  generateClientCommsSection,
  type CacheableSectionDeps,
  type CacheableSectionArgs,
  type InvokeTrackedFn,
} from './cacheable-section.generators';
export { generateUserSummary } from './user-summary.generator';
export { generateExpertReport } from './expert-report.generator';
export {
  buildClientCommsSystemBlocks,
  buildExecutionSystemBlocks,
  buildExecutiveSystemBlocks,
  buildExpertReportSystemBlocks,
  buildPrioritySystemBlocks,
  buildUserSummarySystemBlocks,
} from './section-prompts.builder';
