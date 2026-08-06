import type { MetricsService } from '../../../interfaces/metrics/metrics.service';
import {
  invokeWithLlmTracking,
  type LlmInvocationContext,
  type LlmInvocationOptions,
} from '../llm-usage-tracking.util';

interface UsageCallback {
  handleLLMStart(): void;
  handleLLMEnd(output: unknown): void;
  handleLLMError(): void;
}

const CONTEXT: LlmInvocationContext = {
  section: 'executive',
  locale: 'fr',
  model: 'gpt-test',
};

function createMockMetrics() {
  return {
    llmCallsTotal: { inc: jest.fn() },
    llmLatencySeconds: { observe: jest.fn() },
    llmTokensTotal: { inc: jest.fn() },
  };
}

/** Payload LangChain moderne (`AIMessage.usage_metadata`). */
function buildUsageMetadataOutput(overrides: Record<string, unknown> = {}) {
  return {
    generations: [
      [
        {
          message: {
            usage_metadata: {
              input_tokens: 100,
              output_tokens: 40,
              total_tokens: 140,
              ...overrides,
            },
          },
        },
      ],
    ],
  };
}

/**
 * Extrait le callback de tracking passe a `invoke` et rejoue le cycle de
 * vie LangChain (start -> end) avec le payload fourni.
 */
async function runTracked(
  output: unknown,
  metrics: ReturnType<typeof createMockMetrics> | null,
) {
  const invoke = jest.fn(
    (_messages: unknown, options: LlmInvocationOptions): Promise<string> => {
      const [callback] = (options.callbacks ??
        []) as unknown as UsageCallback[];
      callback.handleLLMStart();
      if (output !== undefined) callback.handleLLMEnd(output);
      return Promise.resolve('resultat');
    },
  );

  const result = await invokeWithLlmTracking(
    invoke,
    ['message'],
    CONTEXT,
    metrics as unknown as MetricsService | null,
  );

  return { result, invoke };
}

describe('invokeWithLlmTracking', () => {
  it('retourne le resultat de l’invocation telle quelle', async () => {
    const metrics = createMockMetrics();

    const { result } = await runTracked(buildUsageMetadataOutput(), metrics);

    expect(result).toBe('resultat');
  });

  it('compte l’appel et observe la latence en succes', async () => {
    const metrics = createMockMetrics();

    await runTracked(buildUsageMetadataOutput(), metrics);

    expect(metrics.llmCallsTotal.inc).toHaveBeenCalledWith({
      model: 'gpt-test',
      section: 'executive',
      locale: 'fr',
      status: 'success',
    });
    expect(metrics.llmLatencySeconds.observe).toHaveBeenCalledTimes(1);
    const [, latencySeconds] = metrics.llmLatencySeconds.observe.mock
      .calls[0] as [unknown, number];
    // Borne haute indispensable : l'histogramme Prometheus est en
    // SECONDES. Sans elle, une regression d'unite (facteur 1000, valeur
    // en millisecondes) satisferait encore l'assertion.
    expect(latencySeconds).toBeGreaterThanOrEqual(0);
    expect(latencySeconds).toBeLessThan(5);
  });

  it('extrait les tokens du format usage_metadata (LangChain 2024+)', async () => {
    const metrics = createMockMetrics();

    await runTracked(buildUsageMetadataOutput(), metrics);

    expect(metrics.llmTokensTotal.inc).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'input' }),
      100,
    );
    expect(metrics.llmTokensTotal.inc).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'output' }),
      40,
    );
  });

  it('extrait les tokens du format tokenUsage (OpenAI legacy)', async () => {
    const metrics = createMockMetrics();

    await runTracked(
      {
        llmOutput: {
          tokenUsage: {
            promptTokens: 7,
            completionTokens: 3,
            totalTokens: 10,
          },
        },
      },
      metrics,
    );

    expect(metrics.llmTokensTotal.inc).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'input' }),
      7,
    );
  });

  it('compte les tokens lus en cache quand le detail est fourni', async () => {
    const metrics = createMockMetrics();

    await runTracked(
      buildUsageMetadataOutput({ input_token_details: { cache_read: 64 } }),
      metrics,
    );

    expect(metrics.llmTokensTotal.inc).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'cached' }),
      64,
    );
  });

  it('n’emet aucune metrique de tokens sur un payload sans usage', async () => {
    const metrics = createMockMetrics();

    await runTracked({ generations: [[{ message: {} }]] }, metrics);

    // L'appel reste compte : seule la ventilation par tokens est absente.
    expect(metrics.llmCallsTotal.inc).toHaveBeenCalledTimes(1);
    expect(metrics.llmTokensTotal.inc).not.toHaveBeenCalled();
  });

  it('fonctionne sans MetricsService (metrics desactivees)', async () => {
    const { result } = await runTracked(buildUsageMetadataOutput(), null);

    expect(result).toBe('resultat');
  });

  it('propage l’erreur d’invocation sans avaler l’exception', async () => {
    const metrics = createMockMetrics();
    const invoke = jest.fn().mockRejectedValue(new Error('LLM down'));

    await expect(
      invokeWithLlmTracking(
        invoke,
        ['message'],
        CONTEXT,
        metrics as unknown as MetricsService,
      ),
    ).rejects.toThrow('LLM down');
  });

  it('transmet le signal d’annulation a l’invocation', async () => {
    const controller = new AbortController();
    let received: LlmInvocationOptions | undefined;
    const invoke = (
      _messages: unknown,
      options: LlmInvocationOptions,
    ): Promise<string> => {
      received = options;
      return Promise.resolve('ok');
    };

    await invokeWithLlmTracking(
      invoke,
      ['message'],
      CONTEXT,
      null,
      controller.signal,
    );

    expect(received?.signal).toBe(controller.signal);
  });
});
