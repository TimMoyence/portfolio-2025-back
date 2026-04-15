import { Inject, Injectable } from '@nestjs/common';
import { ChatOpenAI } from '@langchain/openai';
import { AUDIT_AUTOMATION_CONFIG } from '../../domain/token';
import type { AuditAutomationConfig } from './audit.config';

/** Token d'injection Nest pour le port `ChatOpenAIFactory`. */
export const CHAT_OPENAI_FACTORY = Symbol('CHAT_OPENAI_FACTORY');

/**
 * Port de construction d'instances `ChatOpenAI` typees. Extrait la
 * dependance concrete `new ChatOpenAI(...)` du service consommateur
 * pour permettre un stub injectable en tests unitaires, sans patcher
 * le module `@langchain/openai` globalement.
 */
export interface ChatOpenAIFactory {
  /**
   * Cree une instance ChatOpenAI avec le timeout fourni. Les autres
   * parametres (apiKey, model, temperature, maxRetries) sont derives
   * de la configuration d'audit.
   */
  create(timeoutMs: number): ChatOpenAI;
}

/**
 * Implementation par defaut adossee a la configuration audit injectee.
 * Reproduit strictement le comportement historique du service
 * `LangchainAuditReportService.createLlm(...)`.
 */
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
