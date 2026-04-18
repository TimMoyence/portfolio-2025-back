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

/**
 * Builders purs qui assemblent les blocs system d'une section LLM en
 * respectant l'ordre : disclaimer untrusted → prompt principal → retry
 * constraint optionnel. Extraits du service orchestrateur pour :
 *   - deduquer la construction identique entre le chemin Anthropic
 *     (cache_control sur le dernier bloc) et le chemin OpenAI (roles
 *     `system` successifs)
 *   - permettre aux tests unitaires de snapshot les prompts sans
 *     instancier le service complet
 */
function disclaimer(locale: AuditLocale): string {
  return locale === 'fr'
    ? UNTRUSTED_DATA_DISCLAIMER_FR
    : UNTRUSTED_DATA_DISCLAIMER_EN;
}

/** Blocs system de la section Executive Summary. */
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

/** Blocs system de la section Priority Backlog. */
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

/** Blocs system de la section Execution Plan. */
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

/** Blocs system de la section Client Communications. */
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

/** Blocs system pour le resume utilisateur (user summary). */
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

/**
 * Blocs system pour le rapport expert — trois contraintes cumulatives :
 * main + strict + (compact OU retry).
 */
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
