import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import type { ZodType } from 'zod';
import { MetricsService } from '../../../../../common/interfaces/metrics/metrics.service';
import type { AuditLocale } from '../../../domain/audit-locale.util';
import { AUDIT_AUTOMATION_CONFIG } from '../../../domain/token';
import {
  ANTHROPIC_CHAT_FACTORY,
  type AnthropicChatFactory,
} from '../anthropic-chat.factory';
import { invokeAnthropicStructuredSection } from '../anthropic-section-synthesis.util';
import type { AuditAutomationConfig } from '../audit.config';
import { wrapUntrustedUserPayload } from '../shared/prompt-sanitize.util';

/**
 * Parametres d'une invocation "Anthropic-first + OpenAI fallback" pour
 * une section structuree du pipeline audit. Le schema Zod cible est
 * utilise a la fois pour la conversion en JSON Schema (tool_use cote
 * Anthropic) et pour la validation du resultat.
 */
export interface CachingSectionParams<T> {
  /** Nom de section pour les logs et metriques (ex: 'executive'). */
  section: string;
  /** Schema Zod de validation de la sortie. */
  schema: ZodType<T>;
  /** Blocs system (disclaimer + main + retry). Le dernier porte le cache_control. */
  systemBlocks: string[];
  /** Payload utilisateur — sera enveloppe via wrapUntrustedUserPayload. */
  payload: Record<string, unknown>;
  /** Locale du rapport (fr/en). */
  locale: AuditLocale;
  /** Signal d'annulation eventuel. */
  signal?: AbortSignal;
  /** Fallback OpenAI execute si Anthropic est desactive ou echoue. */
  openAiFallback: () => Promise<T>;
}

/**
 * Runner dedie aux sections LLM structurees qui beneficient du prompt
 * caching Anthropic ephemeral. Extrait du service orchestrateur pour
 * respecter la separation des responsabilites : le service connait le
 * "quand" (strategy) et delegue le "comment" (adapter) au runner.
 *
 * Ordre de preference :
 *   1. Anthropic Messages API + cache_control ephemeral (si factory active)
 *   2. OpenAI path historique (ChatOpenAI.withStructuredOutput) via le
 *      callback `openAiFallback` fourni par l'appelant
 *
 * Garanties :
 *   - Si le signal est deja `aborted` quand une exception survient, elle
 *     est propagee telle quelle (pas de fallback sur annulation).
 *   - Toute autre exception Anthropic (5xx, Zod invalide, tool_use
 *     manquant) declenche le fallback OpenAI, loggue en warn.
 */
@Injectable()
export class CachingSectionRunner {
  private readonly logger = new Logger(CachingSectionRunner.name);

  constructor(
    @Inject(AUDIT_AUTOMATION_CONFIG)
    private readonly config: AuditAutomationConfig,
    @Optional()
    private readonly metricsService?: MetricsService,
    @Optional()
    @Inject(ANTHROPIC_CHAT_FACTORY)
    private readonly anthropicChatFactory?: AnthropicChatFactory,
  ) {}

  async run<T>(params: CachingSectionParams<T>): Promise<T> {
    const {
      section,
      schema,
      systemBlocks,
      payload,
      locale,
      signal,
      openAiFallback,
    } = params;

    if (!this.anthropicChatFactory?.isEnabled()) {
      return openAiFallback();
    }

    try {
      const timeoutMs = this.config.llmSectionTimeoutMs;
      const client = this.anthropicChatFactory.create(timeoutMs);
      return await invokeAnthropicStructuredSection<T>({
        client,
        model: this.anthropicChatFactory.model(),
        section,
        locale,
        schema,
        systemBlocks,
        userContent: wrapUntrustedUserPayload(payload),
        signal,
        metrics: this.metricsService ?? null,
        logger: this.logger,
      });
    } catch (error) {
      if (signal?.aborted) {
        throw error;
      }
      this.logger.warn(
        `Anthropic ${section} failed, fallback to OpenAI: ${String(error)}`,
      );
      return openAiFallback();
    }
  }
}
