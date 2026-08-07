import { Inject, Injectable } from '@nestjs/common';
import { AUDIT_AUTOMATION_CONFIG } from '../../domain/token';
import type { AuditAutomationConfig } from './audit.config';
import {
  getSharedLlmInFlightLimiter,
  type LlmInFlightLimiter,
} from './llm-execution.guardrails';

export const LLM_EXECUTOR = Symbol('LLM_EXECUTOR');

export interface LlmExecutor {
  execute<T>(fn: () => Promise<T>): Promise<T>;
}

@Injectable()
export class SharedLlmExecutor implements LlmExecutor {
  private readonly limiter: LlmInFlightLimiter;

  constructor(
    @Inject(AUDIT_AUTOMATION_CONFIG)
    config: AuditAutomationConfig,
  ) {
    this.limiter = getSharedLlmInFlightLimiter(config.llmInflightMax);
  }

  execute<T>(fn: () => Promise<T>): Promise<T> {
    return this.limiter.run(fn);
  }
}
