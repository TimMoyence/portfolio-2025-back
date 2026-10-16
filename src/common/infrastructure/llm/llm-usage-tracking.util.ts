import type { Callbacks } from '@langchain/core/callbacks/manager';
import { estObjet } from '../../domain/est-objet';
import type { MetricsService } from '../../interfaces/metrics/metrics.service';

export interface LlmInvocationContext {
  section: string;
  locale: string;
  model: string;
}

interface LlmTokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cachedInputTokens?: number;
}

function buildUsageCallback(onEnd: (usage: LlmTokenUsage | null) => void): {
  name: 'llm-usage-tracker';
  handleLLMEnd(output: unknown): void;
  handleLLMError(): void;
} {
  return {
    name: 'llm-usage-tracker',
    handleLLMEnd(output: unknown): void {
      onEnd(extractUsage(output));
    },
    handleLLMError(): void {
      // Latence et usage geres par l'appelant (status=error)
    },
  };
}

function extractUsage(output: unknown): LlmTokenUsage | null {
  if (!estObjet(output)) return null;

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

    if (metrics) {
      compterLAppel(metrics, context, 'success', startedAt);
      if (usage) {
        const typedUsage = usage as LlmTokenUsage;
        compterLesJetons(metrics, context, {
          input: typedUsage.inputTokens,
          output: typedUsage.outputTokens,
          cached: typedUsage.cachedInputTokens,
        });
      }
    }

    return result;
  } catch (error) {
    if (metrics) {
      compterLAppel(metrics, context, 'error', startedAt);
    }
    throw error;
  }
}

interface JetonsConsommes {
  input: number;
  output: number;
  cached?: number;
  cacheWrite?: number;
}

export function compterLesJetons(
  metrics: MetricsService,
  context: LlmInvocationContext,
  jetons: JetonsConsommes,
): void {
  const compter = (type: string, valeur: number): void => {
    metrics.llmTokensTotal.inc(
      {
        model: context.model,
        section: context.section,
        locale: context.locale,
        type,
      },
      valeur,
    );
  };
  compter('input', jetons.input);
  compter('output', jetons.output);
  if (jetons.cached && jetons.cached > 0) compter('cached', jetons.cached);
  if (jetons.cacheWrite && jetons.cacheWrite > 0) {
    compter('cache_write', jetons.cacheWrite);
  }
}

export function compterLAppel(
  metrics: MetricsService,
  context: LlmInvocationContext,
  status: 'success' | 'error',
  startedAt: number,
): void {
  const latencyMs = Date.now() - startedAt;
  const labels = {
    model: context.model,
    section: context.section,
    locale: context.locale,
    status,
  };
  metrics.llmCallsTotal.inc(labels);
  metrics.llmLatencySeconds.observe(labels, latencyMs / 1000);
}
