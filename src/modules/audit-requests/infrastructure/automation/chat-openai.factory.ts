import { Inject, Injectable } from '@nestjs/common';
import { ChatOpenAI } from '@langchain/openai';
import { AUDIT_AUTOMATION_CONFIG } from '../../domain/token';
import type { AuditAutomationConfig } from './audit.config';

export const CHAT_OPENAI_FACTORY = Symbol('CHAT_OPENAI_FACTORY');

interface ChatOpenAIOptions {
  temperature?: number;
}

export interface ChatOpenAIFactory {
  create(timeoutMs: number, options?: ChatOpenAIOptions): ChatOpenAI;
}

@Injectable()
export class DefaultChatOpenAIFactory implements ChatOpenAIFactory {
  constructor(
    @Inject(AUDIT_AUTOMATION_CONFIG)
    private readonly config: AuditAutomationConfig,
  ) {}

  create(timeoutMs: number, options: ChatOpenAIOptions = {}): ChatOpenAI {
    return new ChatOpenAI({
      apiKey: this.config.openAiApiKey,
      model: this.config.llmModel,
      timeout: timeoutMs,
      maxRetries: 0,
      temperature: options.temperature ?? 0.2,
    });
  }
}
