import Anthropic from '@anthropic-ai/sdk';
import { Inject, Injectable } from '@nestjs/common';
import { AUDIT_AUTOMATION_CONFIG } from '../../domain/token';
import type { AuditAutomationConfig } from './audit.config';

export const ANTHROPIC_CHAT_FACTORY = Symbol('ANTHROPIC_CHAT_FACTORY');

export interface AnthropicChatFactory {
  isEnabled(): boolean;

  model(): string;

  create(timeoutMs: number): Anthropic;
}

@Injectable()
export class DefaultAnthropicChatFactory implements AnthropicChatFactory {
  constructor(
    @Inject(AUDIT_AUTOMATION_CONFIG)
    private readonly config: AuditAutomationConfig,
  ) {}

  isEnabled(): boolean {
    return (
      this.config.enableAnthropicCaching === true &&
      typeof this.config.anthropicApiKey === 'string' &&
      this.config.anthropicApiKey.length > 0
    );
  }

  model(): string {
    return this.config.anthropicModel;
  }

  create(timeoutMs: number): Anthropic {
    if (!this.isEnabled()) {
      throw new Error(
        'AnthropicChatFactory.create() called while disabled — verify isEnabled() first',
      );
    }
    return new Anthropic({
      apiKey: this.config.anthropicApiKey,
      timeout: timeoutMs,
      maxRetries: 0,
    });
  }
}
