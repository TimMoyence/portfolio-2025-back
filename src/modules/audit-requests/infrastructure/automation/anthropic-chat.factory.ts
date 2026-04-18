import Anthropic from '@anthropic-ai/sdk';
import { Inject, Injectable } from '@nestjs/common';
import { AUDIT_AUTOMATION_CONFIG } from '../../domain/token';
import type { AuditAutomationConfig } from './audit.config';

/** Token d'injection Nest pour le port `AnthropicChatFactory`. */
export const ANTHROPIC_CHAT_FACTORY = Symbol('ANTHROPIC_CHAT_FACTORY');

/**
 * Port de construction d'une instance client `@anthropic-ai/sdk`. Le port
 * isole la dependance concrete pour permettre un stub en tests unitaires
 * sans patcher le module globalement, et centralise la configuration
 * (apiKey, modele par defaut, activation feature flag).
 */
export interface AnthropicChatFactory {
  /** Vrai si Anthropic est active (feature flag ET apiKey presente). */
  isEnabled(): boolean;

  /** Nom du modele Anthropic utilise pour les sections migrees. */
  model(): string;

  /**
   * Construit une instance du client Anthropic avec le timeout fourni.
   * Les autres parametres (apiKey, maxRetries) sont derives de la config.
   * Leve une exception si `isEnabled()` est faux — l'appelant doit verifier
   * l'activation avant d'appeler `create()`.
   */
  create(timeoutMs: number): Anthropic;
}

/**
 * Implementation par defaut adossee a la configuration audit injectee.
 * Lit `AUDIT_ANTHROPIC_API_KEY` et `AUDIT_ANTHROPIC_MODEL` via
 * `AuditAutomationConfig`. L'activation depend aussi du flag
 * `enableAnthropicCaching` pour pouvoir desactiver rapidement en prod.
 */
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
