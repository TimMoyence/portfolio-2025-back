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

function disclaimer(locale: AuditLocale): string {
  return locale === 'fr'
    ? UNTRUSTED_DATA_DISCLAIMER_FR
    : UNTRUSTED_DATA_DISCLAIMER_EN;
}

export function buildExecutiveSystemBlocks(
  locale: AuditLocale,
  retryMode: boolean,
): string[] {
  return [
    disclaimer(locale),
    executiveSystemMain(locale),
    ...(retryMode ? [executiveRetryConstraint(locale)] : []),
  ];
}

export function buildPrioritySystemBlocks(
  locale: AuditLocale,
  retryMode: boolean,
): string[] {
  return [
    disclaimer(locale),
    prioritySystemMain(locale),
    ...(retryMode ? [priorityRetryConstraint(locale)] : []),
  ];
}

export function buildExecutionSystemBlocks(
  locale: AuditLocale,
  retryMode: boolean,
): string[] {
  return [
    disclaimer(locale),
    executionSystemMain(locale),
    ...(retryMode ? [executionRetryConstraint(locale)] : []),
  ];
}

export function buildClientCommsSystemBlocks(
  locale: AuditLocale,
  retryMode: boolean,
): string[] {
  return [
    disclaimer(locale),
    clientCommsSystemMain(locale),
    ...(retryMode ? [clientCommsRetryConstraint(locale)] : []),
  ];
}

export function buildUserSummarySystemBlocks(
  locale: AuditLocale,
  retryMode: boolean,
): string[] {
  return [
    disclaimer(locale),
    userSummarySystemMain(locale),
    ...(retryMode ? [userSummaryRetryConstraint(locale)] : []),
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
