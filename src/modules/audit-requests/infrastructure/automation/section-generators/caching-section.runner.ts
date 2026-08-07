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

export interface CachingSectionParams<T> {
  section: string;
  schema: ZodType<T>;
  systemBlocks: string[];
  payload: Record<string, unknown>;
  locale: AuditLocale;
  signal?: AbortSignal;
  openAiFallback: () => Promise<T>;
}

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
