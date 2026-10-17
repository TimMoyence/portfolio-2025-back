import { userSummarySchema } from '../schemas/audit-report.schemas';
import { buildSystemBlocks } from './section-prompts.builder';
import {
  invoquerOpenAi,
  type ArgsDeGeneration,
} from './cacheable-section.generators';

export async function generateUserSummary(
  args: ArgsDeGeneration,
): Promise<string> {
  const { llm, payload, locale, retryMode = false, signal } = args;
  const systemBlocks = buildSystemBlocks('user_summary', locale, retryMode);
  const result = await invoquerOpenAi(llm, userSummarySchema, {
    systemBlocks,
    payload,
    signal,
  });
  return result.summaryText;
}
