import type { ChatOpenAI } from '@langchain/openai';
import type { AuditLocale } from '../../../domain/audit-locale.util';
import type {
  ClientCommsSection,
  ExecutiveSection,
  ExecutionSection,
  PrioritySection,
} from '../schemas/audit-report.schemas';
import {
  clientCommsSectionSchema,
  executiveSectionSchema,
  executionSectionSchema,
  prioritySectionSchema,
} from '../schemas/audit-report.schemas';
import { wrapUntrustedUserPayload } from '../shared/prompt-sanitize.util';
import { CachingSectionRunner } from './caching-section.runner';
import {
  buildClientCommsSystemBlocks,
  buildExecutionSystemBlocks,
  buildExecutiveSystemBlocks,
  buildPrioritySystemBlocks,
} from './section-prompts.builder';

/**
 * Generateurs des 4 sections structurees fan-out du pipeline audit
 * (executive / priority / execution / client comms). Chaque fonction :
 *   1. Construit les blocs system via les builders purs
 *   2. Delegue au `CachingSectionRunner` pour le routage Anthropic/OpenAI
 *   3. Fournit un fallback OpenAI inline (ChatOpenAI.withStructuredOutput)
 *      utilise si Anthropic est desactive ou leve
 *
 * Extraits du service orchestrateur pour :
 *   - reduire la LOC du service god-object
 *   - isoler la construction des prompts + des callbacks OpenAI
 *   - permettre un test unitaire de chaque section independamment
 */

/** Signature du callback de tracking fourni par le service parent. */

export type InvokeTrackedFn = <T>(
  chain: { invoke: (messages: any, options?: any) => Promise<T> },
  messages: unknown,
  section: string,
  locale: AuditLocale,
  signal?: AbortSignal,
) => Promise<T>;

/** Dependances communes injectees par le service aux generateurs. */
export interface CacheableSectionDeps {
  cachingRunner: CachingSectionRunner;
  invokeTracked: InvokeTrackedFn;
}

/** Parametres d'invocation d'une section cacheable. */
export interface CacheableSectionArgs {
  llm: ChatOpenAI;
  payload: Record<string, unknown>;
  locale: AuditLocale;
  retryMode: boolean;
  signal?: AbortSignal;
}

function buildOpenAiMessages(
  systemBlocks: string[],
  payload: Record<string, unknown>,
): Array<{ role: 'system' | 'user'; content: string }> {
  return [
    ...systemBlocks.map((content) => ({ role: 'system' as const, content })),
    { role: 'user' as const, content: wrapUntrustedUserPayload(payload) },
  ];
}

/** Executive Summary — resume strategique + reportExplanation + strengths. */
export function generateExecutiveSection(
  deps: CacheableSectionDeps,
  args: CacheableSectionArgs,
): Promise<ExecutiveSection> {
  const { llm, payload, locale, retryMode, signal } = args;
  const systemBlocks = buildExecutiveSystemBlocks(locale, retryMode);
  return deps.cachingRunner.run<ExecutiveSection>({
    section: 'executive',
    schema: executiveSectionSchema,
    systemBlocks,
    payload,
    locale,
    signal,
    openAiFallback: () => {
      const chain = llm.withStructuredOutput(executiveSectionSchema);
      return deps.invokeTracked(
        chain,
        buildOpenAiMessages(systemBlocks, payload),
        'executive',
        locale,
        signal,
      );
    },
  });
}

/** Priority Backlog — 8-10 priorites classees + urlLevelImprovements + seoFoundations. */
export function generatePrioritySection(
  deps: CacheableSectionDeps,
  args: CacheableSectionArgs,
): Promise<PrioritySection> {
  const { llm, payload, locale, retryMode, signal } = args;
  const systemBlocks = buildPrioritySystemBlocks(locale, retryMode);
  return deps.cachingRunner.run<PrioritySection>({
    section: 'priority',
    schema: prioritySectionSchema,
    systemBlocks,
    payload,
    locale,
    signal,
    openAiFallback: () => {
      const chain = llm.withStructuredOutput(prioritySectionSchema);
      return deps.invokeTracked(
        chain,
        buildOpenAiMessages(systemBlocks, payload),
        'priority',
        locale,
        signal,
      );
    },
  });
}

/** Execution Plan — techFingerprint + perPageAnalysis + implementationTodo + whatToFix*. */
export function generateExecutionSection(
  deps: CacheableSectionDeps,
  args: CacheableSectionArgs,
): Promise<ExecutionSection> {
  const { llm, payload, locale, retryMode, signal } = args;
  const systemBlocks = buildExecutionSystemBlocks(locale, retryMode);
  return deps.cachingRunner.run<ExecutionSection>({
    section: 'execution',
    schema: executionSectionSchema,
    systemBlocks,
    payload,
    locale,
    signal,
    openAiFallback: () => {
      const chain = llm.withStructuredOutput(executionSectionSchema);
      return deps.invokeTracked(
        chain,
        buildOpenAiMessages(systemBlocks, payload),
        'execution',
        locale,
        signal,
      );
    },
  });
}

/** Client Communications — clientMessageTemplate + clientLongEmail + clientEmailDraft. */
export function generateClientCommsSection(
  deps: CacheableSectionDeps,
  args: CacheableSectionArgs,
): Promise<ClientCommsSection> {
  const { llm, payload, locale, retryMode, signal } = args;
  const systemBlocks = buildClientCommsSystemBlocks(locale, retryMode);
  return deps.cachingRunner.run<ClientCommsSection>({
    section: 'client_comms',
    schema: clientCommsSectionSchema,
    systemBlocks,
    payload,
    locale,
    signal,
    openAiFallback: () => {
      const chain = llm.withStructuredOutput(clientCommsSectionSchema);
      return deps.invokeTracked(
        chain,
        buildOpenAiMessages(systemBlocks, payload),
        'client_comms',
        locale,
        signal,
      );
    },
  });
}
