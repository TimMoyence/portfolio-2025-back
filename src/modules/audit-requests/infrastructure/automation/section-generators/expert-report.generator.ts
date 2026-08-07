import type { ChatOpenAI } from '@langchain/openai';
import type { AuditLocale } from '../../../domain/audit-locale.util';
import {
  expertReportSchema,
  type ExpertReport,
} from '../schemas/audit-report.schemas';
import { wrapUntrustedUserPayload } from '../shared/prompt-sanitize.util';
import { buildExpertReportSystemBlocks } from './section-prompts.builder';
import type { InvokeTrackedFn } from './cacheable-section.generators';

export function generateExpertReport(
  deps: { invokeTracked: InvokeTrackedFn },
  args: {
    llm: ChatOpenAI;
    payload: Record<string, unknown>;
    locale: AuditLocale;
    retryMode?: boolean;
    compactMode?: boolean;
    signal?: AbortSignal;
  },
): Promise<ExpertReport> {
  const {
    llm,
    payload,
    locale,
    retryMode = false,
    compactMode = false,
    signal,
  } = args;
  const systemBlocks = buildExpertReportSystemBlocks(
    locale,
    compactMode,
    retryMode,
  );
  const chain = llm.withStructuredOutput(expertReportSchema);
  return deps.invokeTracked(
    chain,
    [
      ...systemBlocks.map((content) => ({ role: 'system' as const, content })),
      { role: 'user' as const, content: wrapUntrustedUserPayload(payload) },
    ],
    'expert_report',
    locale,
    signal,
  );
}
