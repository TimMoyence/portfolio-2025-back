import { z } from 'zod';
import type { AnthropicChatFactory } from '../anthropic-chat.factory';
import { buildAuditAutomationConfig } from '../../../../../../test/factories/audit-config.factory';
import { CachingSectionRunner } from './caching-section.runner';

describe('CachingSectionRunner', () => {
  const schema = z.object({ ok: z.boolean() });
  const config = buildAuditAutomationConfig();

  function fabrique(
    isEnabled: boolean,
    create: jest.Mock = jest.fn(),
  ): AnthropicChatFactory {
    return {
      isEnabled: () => isEnabled,
      model: () => 'claude-sonnet-4-6',
      create,
    };
  }

  function fabriqueDeClient(messagesCreate: jest.Mock) {
    const create = jest
      .fn()
      .mockReturnValue({ messages: { create: messagesCreate } });
    return { create, factory: fabrique(true, create) };
  }

  function executer(
    factory: AnthropicChatFactory | undefined,
    options: {
      section?: 'executive' | 'priority';
      payload?: Record<string, unknown>;
      signal?: AbortSignal;
      openAiFallback?: jest.Mock;
    } = {},
  ) {
    const openAiFallback =
      options.openAiFallback ?? jest.fn().mockResolvedValue({ ok: true });
    const resultat = new CachingSectionRunner(config, undefined, factory).run({
      section: options.section ?? 'executive',
      schema,
      systemBlocks: ['main'],
      payload: options.payload ?? {},
      locale: 'fr',
      signal: options.signal,
      openAiFallback,
    });
    return { resultat, openAi: openAiFallback };
  }

  it('takes the OpenAI path when the anthropic factory is absent', async () => {
    const { resultat, openAi } = executer(undefined, { payload: { dummy: 1 } });

    expect(await resultat).toEqual({ ok: true });
    expect(openAi).toHaveBeenCalledTimes(1);
  });

  it('takes the OpenAI path when the factory reports disabled', async () => {
    const createSpy = jest.fn();
    const { resultat, openAi } = executer(fabrique(false, createSpy));

    await resultat;

    expect(createSpy).not.toHaveBeenCalled();
    expect(openAi).toHaveBeenCalledTimes(1);
  });

  it('falls back to OpenAI when the anthropic client throws a non-abort error', async () => {
    const { create, factory } = fabriqueDeClient(
      jest
        .fn()
        .mockRejectedValue(new Error('Anthropic 503 Service Unavailable')),
    );
    const { resultat, openAi } = executer(factory, { section: 'priority' });

    expect(await resultat).toEqual({ ok: true });
    expect(create).toHaveBeenCalledTimes(1);
    expect(openAi).toHaveBeenCalledTimes(1);
  });

  it('propagates AbortError without falling back when the signal is aborted', async () => {
    const abortError = new Error('AbortError');
    const { factory } = fabriqueDeClient(
      jest.fn().mockRejectedValue(abortError),
    );
    const controller = new AbortController();
    controller.abort();

    const { resultat, openAi } = executer(factory, {
      section: 'priority',
      signal: controller.signal,
    });

    await expect(resultat).rejects.toBe(abortError);
    expect(openAi).not.toHaveBeenCalled();
  });

  it('returns the Anthropic payload without calling OpenAI on success', async () => {
    const { factory } = fabriqueDeClient(
      jest.fn().mockResolvedValue({
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
    );

    const { resultat, openAi } = executer(factory, {
      openAiFallback: jest.fn(),
    });

    expect(await resultat).toEqual({ ok: true });
    expect(openAi).not.toHaveBeenCalled();
  });
});
