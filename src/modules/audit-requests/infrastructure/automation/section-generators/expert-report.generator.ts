import {
  expertReportSchema,
  type ExpertReport,
} from '../schemas/audit-report.schemas';
import { buildExpertReportSystemBlocks } from './section-prompts.builder';
import {
  invoquerOpenAi,
  type ArgsDeGeneration,
} from './cacheable-section.generators';

export function generateExpertReport(
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
  return invoquerOpenAi(llm, expertReportSchema, {
    systemBlocks,
    payload,
    signal,
  });
}
