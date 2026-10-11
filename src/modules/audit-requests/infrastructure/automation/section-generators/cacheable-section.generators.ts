import type { BaseLanguageModelInput } from '@langchain/core/language_models/base';
import type { RunnableConfig } from '@langchain/core/runnables';
import type { ChatOpenAI } from '@langchain/openai';
import type { ZodType } from 'zod';
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
  buildSystemBlocks,
  type SectionAPrompt,
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

interface CacheableSectionDeps {
  cachingRunner: CachingSectionRunner;
  invokeTracked: InvokeTrackedFn;
}

interface CacheableSectionArgs {
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

type GenerateurDeSection<T> = (
  deps: CacheableSectionDeps,
  args: CacheableSectionArgs,
) => Promise<T>;

function generateurDeSection<T extends FanoutSection>(
  section: Exclude<SectionAPrompt, 'user_summary'>,
  schema: ZodType<T>,
): GenerateurDeSection<T> {
  return (deps, { llm, payload, locale, retryMode, signal }) => {
    const systemBlocks = buildSystemBlocks(section, locale, retryMode);
    return deps.cachingRunner.run<T>({
      section,
      schema,
      systemBlocks,
      payload,
      locale,
      signal,
      openAiFallback: () =>
        deps.invokeTracked(
          llm.withStructuredOutput<T>(schema),
          buildOpenAiMessages(systemBlocks, payload),
          section,
          locale,
          signal,
        ),
    });
  };
}

export const GENERATEURS_DE_SECTION: Record<
  FanoutSectionName,
  GenerateurDeSection<FanoutSection>
> = {
  executiveSection: generateurDeSection<ExecutiveSection>(
    'executive',
    executiveSectionSchema,
  ),
  prioritySection: generateurDeSection<PrioritySection>(
    'priority',
    prioritySectionSchema,
  ),
  executionSection: generateurDeSection<ExecutionSection>(
    'execution',
    executionSectionSchema,
  ),
  clientCommsSection: generateurDeSection<ClientCommsSection>(
    'client_comms',
    clientCommsSectionSchema,
  ),
};
