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

export abstract class LlmLimiteParLaConfig {
  protected readonly llmLimiter: LlmInFlightLimiter;

  constructor(
    @Inject(AUDIT_AUTOMATION_CONFIG)
    protected readonly config: AuditAutomationConfig,
  ) {
    this.llmLimiter = getSharedLlmInFlightLimiter(config.llmInflightMax);
  }
}

@Injectable()
export class SharedLlmExecutor
  extends LlmLimiteParLaConfig
  implements LlmExecutor
{
  execute<T>(fn: () => Promise<T>): Promise<T> {
    return this.llmLimiter.run(fn);
  }
}
