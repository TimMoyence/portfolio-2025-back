import { userSummarySchema } from '../schemas/audit-report.schemas';
import { buildUserSummarySystemBlocks } from './section-prompts.builder';
import {
  buildOpenAiMessages,
  type ArgsDeGeneration,
  type InvokeTrackedFn,
} from './cacheable-section.generators';

export async function generateUserSummary(
  deps: { invokeTracked: InvokeTrackedFn },
  args: ArgsDeGeneration,
): Promise<string> {
  const { llm, payload, locale, retryMode = false, signal } = args;
  const systemBlocks = buildUserSummarySystemBlocks(locale, retryMode);
  const chain = llm.withStructuredOutput(userSummarySchema);
  const result = await deps.invokeTracked(
    chain,
    buildOpenAiMessages(systemBlocks, payload),
    'user_summary',
    locale,
    signal,
  );
  return result.summaryText;
}
