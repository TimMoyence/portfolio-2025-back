import type Anthropic from '@anthropic-ai/sdk';
import { Logger } from '@nestjs/common';
import { z, type ZodType } from 'zod';
import type { MetricsService } from '../../../../common/interfaces/metrics/metrics.service';

/**
 * Invocation d'une section LLM via Anthropic Messages API avec prompt
 * caching ephemeral (cache_control sur les blocs system stables) et
 * structured output via `tool_use` force (Claude doit appeler l'outil
 * dont le schema correspond a notre Zod cible).
 *
 * Benefices :
 *   - cache_control ephemeral sur le system prompt : -70/-90% coup
 *     input tokens apres le premier appel de la serie (5 min TTL)
 *   - tool_use force → Claude renvoie obligatoirement un JSON conforme
 *     au schema JSON derive du Zod (zero parsing fragile de texte)
 *   - tracking Prometheus des tokens input/output/cache via MetricsService
 *     en parallele de l'OpenAI, meme etiquettes pour les dashboards
 *
 * Rejette si :
 *   - la reponse ne contient pas de tool_use block
 *   - le payload tool_use ne valide pas le schema Zod
 */

/** Parametres d'invocation d'une section Anthropic. */
export interface AnthropicStructuredSectionParams<T> {
  /** Client SDK ouvert (factory a deja verifie isEnabled()). */
  client: Anthropic;
  /** Nom du modele Anthropic (ex: claude-sonnet-4-6). */
  model: string;
  /** Label section pour les metriques + logs (ex: 'executive'). */
  section: string;
  /** Locale du rapport (fr/en). */
  locale: string;
  /** Schema Zod cible ; convertit automatiquement en JSON Schema. */
  schema: ZodType<T>;
  /**
   * Blocs system. Le dernier bloc porte cache_control=ephemeral pour
   * inclure tous les precedents dans le prefixe cacheable.
   */
  systemBlocks: string[];
  /** Payload utilisateur (contenu dynamique, jamais cache). */
  userContent: string;
  /** Limite de tokens de sortie. Defaut : 4000. */
  maxTokens?: number;
  /** Signal d'annulation. */
  signal?: AbortSignal;
  /** Tracking Prometheus optionnel. */
  metrics?: MetricsService | null;
  /** Logger Nest pour logs d'usage. */
  logger: Logger;
}

/** Compteurs d'usage remontes par Anthropic Messages API. */
interface AnthropicUsageSnapshot {
  inputTokens: number;
  outputTokens: number;
  cacheCreationInputTokens: number;
  cacheReadInputTokens: number;
}

const DEFAULT_MAX_TOKENS = 4000;

/**
 * Convertit un schema Zod en JSON Schema (Draft 2020-12) compatible
 * avec le format attendu par Anthropic pour un tool input. Supprime
 * la cle `$schema` qui n'est pas acceptee par Anthropic.
 */
function zodToAnthropicInputSchema(schema: ZodType<unknown>): object {
  const jsonSchema = z.toJSONSchema(schema, {
    target: 'draft-2020-12',
  }) as Record<string, unknown>;
  const cleaned = { ...jsonSchema };
  delete cleaned.$schema;
  return cleaned;
}

/**
 * Prefixe les blocs system avec cache_control=ephemeral sur le dernier
 * bloc. L'ordre est important : tools → system → messages ; poser le
 * marqueur sur le dernier bloc system cache tools+system ensemble.
 */
function buildCachedSystemBlocks(systemBlocks: string[]): Array<{
  type: 'text';
  text: string;
  cache_control?: { type: 'ephemeral' };
}> {
  return systemBlocks.map((text, index) => {
    const isLast = index === systemBlocks.length - 1;
    if (isLast) {
      return { type: 'text', text, cache_control: { type: 'ephemeral' } };
    }
    return { type: 'text', text };
  });
}

/**
 * Emet les metriques Prometheus (tokens input/output/cache) et un log
 * d'usage au niveau info. Le type cached est comptabilise sur les tokens
 * relus depuis le cache (cache hit), distinct de cache_creation qui
 * represente les tokens ecrits (cache miss, 1.25x cout).
 */
function emitUsageMetrics(
  usage: AnthropicUsageSnapshot,
  params: Pick<
    AnthropicStructuredSectionParams<unknown>,
    'metrics' | 'model' | 'section' | 'locale' | 'logger'
  >,
  status: 'success' | 'error',
  latencyMs: number,
): void {
  const { metrics, model, section, locale, logger } = params;
  if (metrics) {
    metrics.llmCallsTotal.inc({
      model,
      section,
      locale,
      status,
    });
    metrics.llmLatencySeconds.observe(
      { model, section, locale, status },
      latencyMs / 1000,
    );
    if (status === 'success') {
      metrics.llmTokensTotal.inc(
        { model, section, locale, type: 'input' },
        usage.inputTokens,
      );
      metrics.llmTokensTotal.inc(
        { model, section, locale, type: 'output' },
        usage.outputTokens,
      );
      if (usage.cacheReadInputTokens > 0) {
        metrics.llmTokensTotal.inc(
          { model, section, locale, type: 'cached' },
          usage.cacheReadInputTokens,
        );
      }
      if (usage.cacheCreationInputTokens > 0) {
        metrics.llmTokensTotal.inc(
          { model, section, locale, type: 'cache_write' },
          usage.cacheCreationInputTokens,
        );
      }
    }
  }
  if (status === 'success') {
    const hitRate =
      usage.cacheReadInputTokens + usage.inputTokens > 0
        ? Math.round(
            (usage.cacheReadInputTokens /
              (usage.cacheReadInputTokens + usage.inputTokens)) *
              100,
          )
        : 0;
    logger.log(
      `Anthropic ${section} ok in=${usage.inputTokens} out=${usage.outputTokens} cacheRead=${usage.cacheReadInputTokens} cacheCreate=${usage.cacheCreationInputTokens} hitRate=${hitRate}%`,
    );
  }
}

/**
 * Invoque Anthropic Messages API pour une section structuree.
 * Utilise `tool_use` force pour garantir un output conforme au schema.
 */
export async function invokeAnthropicStructuredSection<T>(
  params: AnthropicStructuredSectionParams<T>,
): Promise<T> {
  const {
    client,
    model,
    section,
    schema,
    systemBlocks,
    userContent,
    maxTokens = DEFAULT_MAX_TOKENS,
    signal,
  } = params;

  const toolName = `emit_${section}`;
  const inputSchema = zodToAnthropicInputSchema(schema);

  const start = Date.now();
  let status: 'success' | 'error' = 'error';
  try {
    const response = await client.messages.create(
      {
        model,
        max_tokens: maxTokens,
        system: buildCachedSystemBlocks(systemBlocks),
        tools: [
          {
            name: toolName,
            description: `Emit the ${section} section payload strictly matching the provided schema.`,
            // Anthropic accepts any valid JSON Schema object for inputs.
            input_schema: inputSchema as never,
          },
        ],
        tool_choice: { type: 'tool', name: toolName },
        messages: [
          {
            role: 'user',
            content: userContent,
          },
        ],
      },
      { signal },
    );

    const toolUseBlock = response.content.find(
      (
        block,
      ): block is Extract<
        (typeof response.content)[number],
        { type: 'tool_use' }
      > => block.type === 'tool_use' && block.name === toolName,
    );

    if (!toolUseBlock) {
      throw new Error(
        `Anthropic ${section}: response missing tool_use block for ${toolName}`,
      );
    }

    const parsed = schema.parse(toolUseBlock.input);

    const usage: AnthropicUsageSnapshot = {
      inputTokens: response.usage?.input_tokens ?? 0,
      outputTokens: response.usage?.output_tokens ?? 0,
      cacheCreationInputTokens:
        response.usage?.cache_creation_input_tokens ?? 0,
      cacheReadInputTokens: response.usage?.cache_read_input_tokens ?? 0,
    };

    status = 'success';
    emitUsageMetrics(usage, params, status, Date.now() - start);

    return parsed;
  } catch (error) {
    emitUsageMetrics(
      {
        inputTokens: 0,
        outputTokens: 0,
        cacheCreationInputTokens: 0,
        cacheReadInputTokens: 0,
      },
      params,
      status,
      Date.now() - start,
    );
    throw error;
  }
}
