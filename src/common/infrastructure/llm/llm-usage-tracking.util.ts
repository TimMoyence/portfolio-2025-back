import type { Callbacks } from '@langchain/core/callbacks/manager';
import type { MetricsService } from '../../interfaces/metrics/metrics.service';

/**
 * Contexte d'invocation LLM pour attribuer les metriques
 * (section du pipeline audit, locale du rapport, modele utilise).
 */
export interface LlmInvocationContext {
  section: string;
  locale: string;
  model: string;
}

/** Compteurs de tokens extraits de la reponse LangChain `usage_metadata`. */
export interface LlmTokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cachedInputTokens?: number;
}

/**
 * Construit un callback LangChain qui capture `usage_metadata` a la fin
 * de chaque appel LLM et le fait suivre au consommateur via `onEnd`.
 *
 * Usage typique (interne a `invokeWithLlmTracking`) :
 * ```ts
 * const handler = buildUsageCallback((usage, latencyMs) => { ... });
 * chain.invoke(messages, { callbacks: [handler] });
 * ```
 *
 * Fonction non-typee (`unknown` handler) car `@langchain/core/callbacks`
 * expose une surface trop stricte pour un extension ad-hoc — on
 * contrainte via l'utilisateur de `invokeWithLlmTracking`.
 */
function buildUsageCallback(
  onEnd: (usage: LlmTokenUsage | null, latencyMs: number) => void,
): {
  name: 'llm-usage-tracker';
  handleLLMStart(): void;
  handleLLMEnd(output: unknown): void;
  handleLLMError(): void;
} {
  let startedAt = 0;
  return {
    name: 'llm-usage-tracker',
    handleLLMStart(): void {
      startedAt = Date.now();
    },
    handleLLMEnd(output: unknown): void {
      const latencyMs = Date.now() - startedAt;
      const usage = extractUsage(output);
      onEnd(usage, latencyMs);
    },
    handleLLMError(): void {
      // Latence et usage geres par l'appelant (status=error)
    },
  };
}

/**
 * Extrait `usage_metadata` du payload LangChain. Supporte deux formats :
 *   - `llmOutput.tokenUsage` (OpenAI legacy)
 *   - `generations[0][0].message.usage_metadata` (AIMessage format 2024+)
 */
function extractUsage(output: unknown): LlmTokenUsage | null {
  if (!output || typeof output !== 'object') return null;

  const typed = output as {
    llmOutput?: {
      tokenUsage?: {
        promptTokens?: number;
        completionTokens?: number;
        totalTokens?: number;
      };
    };
    generations?: Array<
      Array<{
        message?: {
          usage_metadata?: {
            input_tokens?: number;
            output_tokens?: number;
            total_tokens?: number;
            input_token_details?: { cache_read?: number };
          };
        };
      }>
    >;
  };

  const tokenUsage = typed.llmOutput?.tokenUsage;
  if (tokenUsage?.totalTokens) {
    return {
      inputTokens: tokenUsage.promptTokens ?? 0,
      outputTokens: tokenUsage.completionTokens ?? 0,
      totalTokens: tokenUsage.totalTokens,
    };
  }

  const usageMetadata = typed.generations?.[0]?.[0]?.message?.usage_metadata;
  if (usageMetadata?.total_tokens) {
    return {
      inputTokens: usageMetadata.input_tokens ?? 0,
      outputTokens: usageMetadata.output_tokens ?? 0,
      totalTokens: usageMetadata.total_tokens,
      cachedInputTokens: usageMetadata.input_token_details?.cache_read,
    };
  }

  return null;
}

/**
 * Enveloppe une invocation LangChain `chain.invoke(messages, options)` en
 * capturant les metriques d'usage (tokens + latence + statut) via callback
 * LangChain. Pousse les metriques dans `MetricsService` (Prometheus) et
 * retourne le resultat parse tel quel.
 *
 * Couvre les 6 invocations du pipeline audit (4 sections fan-out +
 * generateUserSummary + generateExpertReport). Chaque call site passe
 * juste `{ section: 'executive' | ..., locale, model }`.
 */
/**
 * Options passees a `chain.invoke`. `callbacks` est type comme
 * `Callbacks` de LangChain, `signal` comme `AbortSignal` standard.
 * Les autres champs `RunnableConfig` ne sont pas utilises ici.
 */
export interface LlmInvocationOptions {
  signal?: AbortSignal;
  callbacks?: Callbacks;
  [key: string]: unknown;
}

export async function invokeWithLlmTracking<TResult>(
  invoke: (
    messages: unknown,
    options: LlmInvocationOptions,
  ) => Promise<TResult>,
  messages: unknown,
  context: LlmInvocationContext,
  metrics: MetricsService | null,
  signal?: AbortSignal,
): Promise<TResult> {
  const startedAt = Date.now();
  let usage: LlmTokenUsage | null = null;

  const callback = buildUsageCallback((capturedUsage) => {
    usage = capturedUsage;
  });

  try {
    const result = await invoke(messages, {
      signal,
      callbacks: [callback] as unknown as Callbacks,
    });

    const latencyMs = Date.now() - startedAt;

    if (metrics) {
      metrics.llmCallsTotal.inc({
        model: context.model,
        section: context.section,
        locale: context.locale,
        status: 'success',
      });
      metrics.llmLatencySeconds.observe(
        {
          model: context.model,
          section: context.section,
          locale: context.locale,
          status: 'success',
        },
        latencyMs / 1000,
      );
      if (usage) {
        const typedUsage = usage as LlmTokenUsage;
        metrics.llmTokensTotal.inc(
          {
            model: context.model,
            section: context.section,
            locale: context.locale,
            type: 'input',
          },
          typedUsage.inputTokens,
        );
        metrics.llmTokensTotal.inc(
          {
            model: context.model,
            section: context.section,
            locale: context.locale,
            type: 'output',
          },
          typedUsage.outputTokens,
        );
        if (typedUsage.cachedInputTokens !== undefined) {
          metrics.llmTokensTotal.inc(
            {
              model: context.model,
              section: context.section,
              locale: context.locale,
              type: 'cached',
            },
            typedUsage.cachedInputTokens,
          );
        }
      }
    }

    return result;
  } catch (error) {
    const latencyMs = Date.now() - startedAt;
    if (metrics) {
      metrics.llmCallsTotal.inc({
        model: context.model,
        section: context.section,
        locale: context.locale,
        status: 'error',
      });
      metrics.llmLatencySeconds.observe(
        {
          model: context.model,
          section: context.section,
          locale: context.locale,
          status: 'error',
        },
        latencyMs / 1000,
      );
    }
    throw error;
  }
}
