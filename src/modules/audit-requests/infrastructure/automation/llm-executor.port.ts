import { Inject, Injectable } from '@nestjs/common';
import { AUDIT_AUTOMATION_CONFIG } from '../../domain/token';
import type { AuditAutomationConfig } from './audit.config';
import {
  getSharedLlmInFlightLimiter,
  type LlmInFlightLimiter,
} from './llm-execution.guardrails';

/** Token d'injection Nest pour le port `LlmExecutor`. */
export const LLM_EXECUTOR = Symbol('LLM_EXECUTOR');

/**
 * Port d'execution d'appels LLM avec controle de concurrence in-flight.
 *
 * Permet aux consommateurs (orchestrateur LangChain et, apres C4b, ses
 * sous-services) d'invoquer un LLM tout en respectant la limite globale
 * de requetes concurrentes. L'implementation concrete est injectable
 * pour autoriser des stubs triviaux en test unitaire.
 */
export interface LlmExecutor {
  /**
   * Execute `fn` sous la contrainte de concurrence du limiter. Retourne
   * la valeur produite par `fn` ou propage toute erreur levee.
   */
  execute<T>(fn: () => Promise<T>): Promise<T>;
}

/**
 * Implementation par defaut adossee au `LlmInFlightLimiter` partage
 * (singleton module-level). Owner unique du limiter dans le module audit.
 */
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
