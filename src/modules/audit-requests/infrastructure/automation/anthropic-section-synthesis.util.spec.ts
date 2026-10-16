import { Logger } from '@nestjs/common';
import { z } from 'zod';
import type Anthropic from '@anthropic-ai/sdk';
import { espionnerLeLoggerAChaqueTest } from '../../../../../test/helpers/silence-nest-logger';
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

function invokeSection(
  client: Anthropic,
  overrides: {
    section?: string;
    systemBlocks?: string[];
  } = {},
): Promise<Section> {
  const { section: sectionName = 'executive', systemBlocks = ['main'] } =
    overrides;
  return invokeAnthropicStructuredSection<Section>({
    client,
    model: 'claude-sonnet-4-6',
    section: sectionName,
    schema: section,
    systemBlocks,
    userContent: 'user',
    logger: new Logger('test'),
  });
}

describe('invokeAnthropicStructuredSection', () => {
  const journal = espionnerLeLoggerAChaqueTest('log');

  it('applies cache_control ephemeral on the last system block', async () => {
    const { client, calls } = buildClient();

    await invokeSection(client, {
      systemBlocks: ['disclaimer', 'main', 'retry'],
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

    await invokeSection(client, { section: 'priority' });

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

    const result = await invokeSection(client);

    expect(result).toEqual({ summary: 'ok', priority: 1 });
  });

  it.each([
    [
      { cache_read_input_tokens: 0, cache_creation_input_tokens: 0 },
      'cacheRead=0 cacheCreate=0 hitRate=0%',
    ],
    [
      { cache_read_input_tokens: 20, cache_creation_input_tokens: 30 },
      'cacheRead=20 cacheCreate=30 hitRate=67%',
    ],
  ])(
    'journalise les jetons consommés et la part lue en cache (%o)',
    async (cache, attendu) => {
      const { client } = buildClient({
        usage: {
          input_tokens: 10,
          output_tokens: 5,
          server_tool_use: null,
          service_tier: null,
          ...cache,
        } as Anthropic.Usage,
      });

      await invokeSection(client);

      expect(journal()).toHaveBeenCalledWith(
        `Anthropic executive ok in=10 out=5 ${attendu}`,
      );
    },
  );

  it.each([
    [
      'tool_use is missing',
      {
        type: 'text',
        text: 'no tool call here',
        citations: [],
      } as Anthropic.TextBlock,
      /missing tool_use/,
    ],
    [
      'Zod validation fails',
      {
        type: 'tool_use',
        id: 'toolu_1',
        name: 'emit_executive',
        input: { summary: '', priority: 'not-a-number' },
      } as Anthropic.ToolUseBlock,
      undefined,
    ],
  ])(
    'throws without journaling a success when %s',
    async (_cas, bloc: Anthropic.ContentBlock, erreurAttendue) => {
      const { client } = buildClient({
        content: [bloc],
      } as Partial<Anthropic.Message>);

      await expect(invokeSection(client)).rejects.toThrow(erreurAttendue);

      expect(journal()).not.toHaveBeenCalled();
    },
  );
});
