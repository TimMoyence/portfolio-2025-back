import { Logger } from '@nestjs/common';
import { z } from 'zod';
import type Anthropic from '@anthropic-ai/sdk';
import { invokeAnthropicStructuredSection } from './anthropic-section-synthesis.util';

const section = z.object({
  summary: z.string().min(1),
  priority: z.number().int(),
});

type Section = z.infer<typeof section>;

function buildClient(responseOverride?: Partial<Anthropic.Message> | Error): {
  client: Anthropic;
  calls: Anthropic.MessageCreateParams[];
} {
  const calls: Anthropic.MessageCreateParams[] = [];
  const create = jest.fn(
    (params: Anthropic.MessageCreateParams): Promise<Anthropic.Message> => {
      calls.push(params);
      if (responseOverride instanceof Error) {
        return Promise.reject(responseOverride);
      }
      const toolName =
        (params.tool_choice as { name?: string } | undefined)?.name ??
        'emit_section';
      return Promise.resolve({
        id: 'msg_test',
        type: 'message',
        role: 'assistant',
        model: params.model,
        stop_reason: 'end_turn',
        stop_sequence: null,
        usage: {
          input_tokens: 10,
          output_tokens: 5,
          cache_creation_input_tokens: 0,
          cache_read_input_tokens: 20,
          server_tool_use: null,
          service_tier: null,
        } as Anthropic.Usage,
        content: [
          {
            type: 'tool_use',
            id: 'toolu_1',
            name: toolName,
            input: { summary: 'ok', priority: 1 },
          } as Anthropic.ToolUseBlock,
        ],
        ...(responseOverride ?? {}),
      } as Anthropic.Message);
    },
  );
  return {
    client: { messages: { create } } as unknown as Anthropic,
    calls,
  };
}

function buildMetrics() {
  return {
    llmTokensTotal: { inc: jest.fn() },
    llmLatencySeconds: { observe: jest.fn() },
    llmCallsTotal: { inc: jest.fn() },
  };
}

describe('invokeAnthropicStructuredSection', () => {
  it('applies cache_control ephemeral on the last system block', async () => {
    const { client, calls } = buildClient();
    const logger = new Logger('test');

    await invokeAnthropicStructuredSection<Section>({
      client,
      model: 'claude-sonnet-4-6',
      section: 'executive',
      locale: 'fr',
      schema: section,
      systemBlocks: ['disclaimer', 'main', 'retry'],
      userContent: 'user payload',
      logger,
    });

    expect(calls).toHaveLength(1);
    const systemBlocks = calls[0].system as Array<{
      type: string;
      text: string;
      cache_control?: { type: string };
    }>;
    expect(systemBlocks).toHaveLength(3);
    expect(systemBlocks[0].cache_control).toBeUndefined();
    expect(systemBlocks[1].cache_control).toBeUndefined();
    expect(systemBlocks[2].cache_control).toEqual({ type: 'ephemeral' });
    expect(systemBlocks[2].text).toBe('retry');
  });

  it('forces tool_use with the section-named tool and strict schema', async () => {
    const { client, calls } = buildClient();
    const logger = new Logger('test');

    await invokeAnthropicStructuredSection<Section>({
      client,
      model: 'claude-sonnet-4-6',
      section: 'priority',
      locale: 'fr',
      schema: section,
      systemBlocks: ['main'],
      userContent: 'user',
      logger,
    });

    expect(calls[0].tool_choice).toEqual({
      type: 'tool',
      name: 'emit_priority',
    });
    expect(calls[0].tools).toHaveLength(1);
    const tool = (calls[0].tools as Anthropic.Tool[])[0];
    expect(tool.name).toBe('emit_priority');
    const schema = tool.input_schema as Record<string, unknown>;
    expect(schema.type).toBe('object');
    expect(schema.$schema).toBeUndefined();
  });

  it('parses the tool_use input through the Zod schema', async () => {
    const { client } = buildClient();
    const logger = new Logger('test');

    const result = await invokeAnthropicStructuredSection<Section>({
      client,
      model: 'claude-sonnet-4-6',
      section: 'executive',
      locale: 'fr',
      schema: section,
      systemBlocks: ['main'],
      userContent: 'user',
      logger,
    });

    expect(result).toEqual({ summary: 'ok', priority: 1 });
  });

  it('records input/output/cache metrics on success', async () => {
    const { client } = buildClient();
    const metrics = buildMetrics();
    const logger = new Logger('test');

    await invokeAnthropicStructuredSection<Section>({
      client,
      model: 'claude-sonnet-4-6',
      section: 'executive',
      locale: 'fr',
      schema: section,
      systemBlocks: ['main'],
      userContent: 'user',
      logger,
      metrics: metrics as never,
    });

    const tokenCalls = metrics.llmTokensTotal.inc.mock.calls;
    const types = tokenCalls.map((call) => (call[0] as { type: string }).type);
    expect(types).toEqual(
      expect.arrayContaining(['input', 'output', 'cached']),
    );
    expect(metrics.llmCallsTotal.inc).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'success', section: 'executive' }),
    );
  });

  it('throws and records error status when tool_use is missing', async () => {
    const { client } = buildClient({
      content: [
        {
          type: 'text',
          text: 'no tool call here',
          citations: [],
        } as Anthropic.TextBlock,
      ] as Anthropic.ContentBlock[],
    } as Partial<Anthropic.Message>);
    const metrics = buildMetrics();
    const logger = new Logger('test');

    await expect(
      invokeAnthropicStructuredSection<Section>({
        client,
        model: 'claude-sonnet-4-6',
        section: 'executive',
        locale: 'fr',
        schema: section,
        systemBlocks: ['main'],
        userContent: 'user',
        logger,
        metrics: metrics as never,
      }),
    ).rejects.toThrow(/missing tool_use/);

    expect(metrics.llmCallsTotal.inc).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'error' }),
    );
  });

  it('throws and records error status when Zod validation fails', async () => {
    const { client } = buildClient({
      content: [
        {
          type: 'tool_use',
          id: 'toolu_1',
          name: 'emit_executive',
          input: { summary: '', priority: 'not-a-number' },
        } as Anthropic.ToolUseBlock,
      ] as Anthropic.ContentBlock[],
    } as Partial<Anthropic.Message>);
    const metrics = buildMetrics();
    const logger = new Logger('test');

    await expect(
      invokeAnthropicStructuredSection<Section>({
        client,
        model: 'claude-sonnet-4-6',
        section: 'executive',
        locale: 'fr',
        schema: section,
        systemBlocks: ['main'],
        userContent: 'user',
        logger,
        metrics: metrics as never,
      }),
    ).rejects.toThrow();

    expect(metrics.llmCallsTotal.inc).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'error' }),
    );
  });
});
