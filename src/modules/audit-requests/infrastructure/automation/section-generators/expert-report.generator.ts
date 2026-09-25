import {
  expertReportSchema,
  type ExpertReport,
} from '../schemas/audit-report.schemas';
import { buildExpertReportSystemBlocks } from './section-prompts.builder';
import {
  buildOpenAiMessages,
  type ArgsDeGeneration,
  type InvokeTrackedFn,
} from './cacheable-section.generators';

export function generateExpertReport(
  deps: { invokeTracked: InvokeTrackedFn },
  args: ArgsDeGeneration & { compactMode?: boolean },
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
    buildOpenAiMessages(systemBlocks, payload),
    'expert_report',
    locale,
    signal,
  );
}
