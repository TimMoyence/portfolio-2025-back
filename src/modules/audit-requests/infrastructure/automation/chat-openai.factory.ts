import { Inject, Injectable } from '@nestjs/common';
import { ChatOpenAI } from '@langchain/openai';
import { AUDIT_AUTOMATION_CONFIG } from '../../domain/token';
import type { AuditAutomationConfig } from './audit.config';

export const CHAT_OPENAI_FACTORY = Symbol('CHAT_OPENAI_FACTORY');

export interface ChatOpenAIFactory {
  create(timeoutMs: number): ChatOpenAI;
}

@Injectable()
export class DefaultChatOpenAIFactory implements ChatOpenAIFactory {
  constructor(
    @Inject(AUDIT_AUTOMATION_CONFIG)
    private readonly config: AuditAutomationConfig,
  ) {}

  create(timeoutMs: number): ChatOpenAI {
    return new ChatOpenAI({
      apiKey: this.config.openAiApiKey,
      model: this.config.llmModel,
      timeout: timeoutMs,
      maxRetries: 0,
      temperature: 0.2,
    });
  }
}
