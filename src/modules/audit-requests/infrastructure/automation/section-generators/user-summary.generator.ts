import type { ChatOpenAI } from '@langchain/openai';
import type { AuditLocale } from '../../../domain/audit-locale.util';
import { userSummarySchema } from '../schemas/audit-report.schemas';
import { wrapUntrustedUserPayload } from '../shared/prompt-sanitize.util';
import { buildUserSummarySystemBlocks } from './section-prompts.builder';
import type { InvokeTrackedFn } from './cacheable-section.generators';

export async function generateUserSummary(
  deps: { invokeTracked: InvokeTrackedFn },
  args: {
    llm: ChatOpenAI;
    payload: Record<string, unknown>;
    locale: AuditLocale;
    retryMode?: boolean;
    signal?: AbortSignal;
  },
): Promise<string> {
  const { llm, payload, locale, retryMode = false, signal } = args;
  const systemBlocks = buildUserSummarySystemBlocks(locale, retryMode);
  const chain = llm.withStructuredOutput(userSummarySchema);
  const result = await deps.invokeTracked(
    chain,
    [
      ...systemBlocks.map((content) => ({ role: 'system' as const, content })),
      { role: 'user' as const, content: wrapUntrustedUserPayload(payload) },
    ],
    'user_summary',
    locale,
    signal,
  );
  return result.summaryText;
}
