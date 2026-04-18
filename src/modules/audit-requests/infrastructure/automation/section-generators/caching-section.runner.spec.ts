import { z } from 'zod';
import type { AnthropicChatFactory } from '../anthropic-chat.factory';
import { buildAuditAutomationConfig } from '../../../../../../test/factories/audit-config.factory';
import { CachingSectionRunner } from './caching-section.runner';

describe('CachingSectionRunner', () => {
  const schema = z.object({ ok: z.boolean() });
  const config = buildAuditAutomationConfig();

  function buildRunner(factory?: AnthropicChatFactory): CachingSectionRunner {
    return new CachingSectionRunner(config, undefined, factory);
  }

  it('takes the OpenAI path when the anthropic factory is absent', async () => {
    const runner = buildRunner();
    const openAi = jest.fn().mockResolvedValue({ ok: true });

    const result = await runner.run({
      section: 'executive',
      schema,
      systemBlocks: ['main'],
      payload: { dummy: 1 },
      locale: 'fr',
      openAiFallback: openAi,
    });

    expect(result).toEqual({ ok: true });
    expect(openAi).toHaveBeenCalledTimes(1);
  });

  it('takes the OpenAI path when the factory reports disabled', async () => {
    const createSpy = jest.fn();
    const factory: AnthropicChatFactory = {
      isEnabled: () => false,
      model: () => 'claude-sonnet-4-6',
      create: createSpy,
    };
    const runner = buildRunner(factory);
    const openAi = jest.fn().mockResolvedValue({ ok: true });

    await runner.run({
      section: 'executive',
      schema,
      systemBlocks: ['main'],
      payload: {},
      locale: 'fr',
      openAiFallback: openAi,
    });

    expect(createSpy).not.toHaveBeenCalled();
    expect(openAi).toHaveBeenCalledTimes(1);
  });

  it('falls back to OpenAI when the anthropic client throws a non-abort error', async () => {
    const failingClient = {
      messages: {
        create: jest
          .fn()
          .mockRejectedValue(new Error('Anthropic 503 Service Unavailable')),
      },
    };
    const createSpy = jest.fn().mockReturnValue(failingClient);
    const factory: AnthropicChatFactory = {
      isEnabled: () => true,
      model: () => 'claude-sonnet-4-6',
      create: createSpy,
    };
    const runner = buildRunner(factory);
    const openAi = jest.fn().mockResolvedValue({ ok: true });

    const result = await runner.run({
      section: 'priority',
      schema,
      systemBlocks: ['main'],
      payload: {},
      locale: 'fr',
      openAiFallback: openAi,
    });

    expect(result).toEqual({ ok: true });
    expect(createSpy).toHaveBeenCalledTimes(1);
    expect(openAi).toHaveBeenCalledTimes(1);
  });

  it('propagates AbortError without falling back when the signal is aborted', async () => {
    const abortError = new Error('AbortError');
    const abortedClient = {
      messages: { create: jest.fn().mockRejectedValue(abortError) },
    };
    const factory: AnthropicChatFactory = {
      isEnabled: () => true,
      model: () => 'claude-sonnet-4-6',
      create: jest.fn().mockReturnValue(abortedClient),
    };
    const runner = buildRunner(factory);
    const openAi = jest.fn().mockResolvedValue({ ok: true });
    const controller = new AbortController();
    controller.abort();

    await expect(
      runner.run({
        section: 'priority',
        schema,
        systemBlocks: ['main'],
        payload: {},
        locale: 'fr',
        signal: controller.signal,
        openAiFallback: openAi,
      }),
    ).rejects.toBe(abortError);

    expect(openAi).not.toHaveBeenCalled();
  });

  it('returns the Anthropic payload without calling OpenAI on success', async () => {
    const anthropicClient = {
      messages: {
        create: jest.fn().mockResolvedValue({
          content: [
            {
              type: 'tool_use',
              id: 'toolu_1',
              name: 'emit_executive',
              input: { ok: true },
            },
          ],
          usage: {
            input_tokens: 10,
            output_tokens: 5,
            cache_creation_input_tokens: 0,
            cache_read_input_tokens: 0,
          },
        }),
      },
    };
    const factory: AnthropicChatFactory = {
      isEnabled: () => true,
      model: () => 'claude-sonnet-4-6',
      create: jest.fn().mockReturnValue(anthropicClient),
    };
    const runner = buildRunner(factory);
    const openAi = jest.fn();

    const result = await runner.run({
      section: 'executive',
      schema,
      systemBlocks: ['main'],
      payload: {},
      locale: 'fr',
      openAiFallback: openAi,
    });

    expect(result).toEqual({ ok: true });
    expect(openAi).not.toHaveBeenCalled();
  });
});
