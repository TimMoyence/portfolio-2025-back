import type { BaseLanguageModelInput } from '@langchain/core/language_models/base';
import type { RunnableConfig } from '@langchain/core/runnables';
import type { ChatOpenAI } from '@langchain/openai';
import type { AuditLocale } from '../../../domain/audit-locale.util';
import type {
  ClientCommsSection,
  ExecutiveSection,
  ExecutionSection,
  FanoutSection,
  FanoutSectionName,
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

export type InvokeTrackedFn = <T>(
  chain: {
    invoke: (
      messages: BaseLanguageModelInput,
      options?: Partial<RunnableConfig>,
    ) => Promise<T>;
  },
  messages: unknown,
  section: string,
  locale: AuditLocale,
  signal?: AbortSignal,
) => Promise<T>;

export interface CacheableSectionDeps {
  cachingRunner: CachingSectionRunner;
  invokeTracked: InvokeTrackedFn;
}

export interface CacheableSectionArgs {
  llm: ChatOpenAI;
  payload: Record<string, unknown>;
  locale: AuditLocale;
  retryMode: boolean;
  signal?: AbortSignal;
}

export type ArgsDeGeneration = Omit<CacheableSectionArgs, 'retryMode'> & {
  retryMode?: boolean;
};

export function buildOpenAiMessages(
  systemBlocks: string[],
  payload: Record<string, unknown>,
): Array<{ role: 'system' | 'user'; content: string }> {
  return [
    ...systemBlocks.map((content) => ({ role: 'system' as const, content })),
    { role: 'user' as const, content: wrapUntrustedUserPayload(payload) },
  ];
}

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

export const GENERATEURS_DE_SECTION: Record<
  FanoutSectionName,
  (
    deps: CacheableSectionDeps,
    args: CacheableSectionArgs,
  ) => Promise<FanoutSection>
> = {
  executiveSection: generateExecutiveSection,
  prioritySection: generatePrioritySection,
  executionSection: generateExecutionSection,
  clientCommsSection: generateClientCommsSection,
};
