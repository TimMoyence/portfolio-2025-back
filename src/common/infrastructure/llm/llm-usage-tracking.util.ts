import type { Callbacks } from '@langchain/core/callbacks/manager';
import type { MetricsService } from '../../interfaces/metrics/metrics.service';

export interface LlmInvocationContext {
  section: string;
  locale: string;
  model: string;
}

export interface LlmTokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cachedInputTokens?: number;
}

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
