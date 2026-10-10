import type { AuditLocale } from '../../../domain/audit-locale.util';
import {
  clientCommsRetryConstraint,
  clientCommsSystemMain,
  executiveRetryConstraint,
  executiveSystemMain,
  executionRetryConstraint,
  executionSystemMain,
  expertReportCompactConstraint,
  expertReportRetryConstraint,
  expertReportStrictConstraint,
  expertReportSystemMain,
  priorityRetryConstraint,
  prioritySystemMain,
  userSummaryRetryConstraint,
  userSummarySystemMain,
} from '../prompts/v1/audit-system-prompts';
import {
  UNTRUSTED_DATA_DISCLAIMER_EN,
  UNTRUSTED_DATA_DISCLAIMER_FR,
} from '../shared/prompt-sanitize.util';

type Prompt = (locale: AuditLocale) => string;

const PROMPTS_DE_SECTION = {
  executive: {
    principal: executiveSystemMain,
    reprise: executiveRetryConstraint,
  },
  priority: { principal: prioritySystemMain, reprise: priorityRetryConstraint },
  execution: {
    principal: executionSystemMain,
    reprise: executionRetryConstraint,
  },
  client_comms: {
    principal: clientCommsSystemMain,
    reprise: clientCommsRetryConstraint,
  },
  user_summary: {
    principal: userSummarySystemMain,
    reprise: userSummaryRetryConstraint,
  },
} as const satisfies Record<string, { principal: Prompt; reprise: Prompt }>;

export type SectionAPrompt = keyof typeof PROMPTS_DE_SECTION;

function disclaimer(locale: AuditLocale): string {
  return locale === 'fr'
    ? UNTRUSTED_DATA_DISCLAIMER_FR
    : UNTRUSTED_DATA_DISCLAIMER_EN;
}

export function buildSystemBlocks(
  section: SectionAPrompt,
  locale: AuditLocale,
  retryMode: boolean,
): string[] {
  const { principal, reprise } = PROMPTS_DE_SECTION[section];
  return [
    disclaimer(locale),
    principal(locale),
    ...(retryMode ? [reprise(locale)] : []),
  ];
}

export function buildExpertReportSystemBlocks(
  locale: AuditLocale,
  compactMode: boolean,
  retryMode: boolean,
): string[] {
  return [
    disclaimer(locale),
    expertReportSystemMain(locale),
    expertReportStrictConstraint(locale),
    ...(compactMode ? [expertReportCompactConstraint(locale)] : []),
    ...(retryMode ? [expertReportRetryConstraint(locale)] : []),
  ];
}
