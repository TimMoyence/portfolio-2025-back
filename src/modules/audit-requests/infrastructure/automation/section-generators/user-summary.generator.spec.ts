import type { ChatOpenAI } from '@langchain/openai';
import { generateUserSummary } from './user-summary.generator';

describe('generateUserSummary', () => {
  it('retourne le summaryText extrait de la reponse LLM', async () => {
    const invokeTracked = jest
      .fn()
      .mockResolvedValue({ summaryText: 'Synthese test.' });

    const result = await generateUserSummary(
      { invokeTracked },
      {
        llm: {
          withStructuredOutput: jest
            .fn()
            .mockReturnValue({ invoke: jest.fn() }),
        } as unknown as ChatOpenAI,
        payload: { any: 'payload' },
        locale: 'fr',
      },
    );

    expect(result).toBe('Synthese test.');
    expect(invokeTracked).toHaveBeenCalledTimes(1);
    const [, messages, section] = invokeTracked.mock.calls[0];
    expect(section).toBe('user_summary');
    expect((messages as unknown[]).length).toBeGreaterThanOrEqual(3);
  });

  it('insere le retry constraint en retryMode=true', async () => {
    const invokeTracked = jest.fn().mockResolvedValue({ summaryText: 'x' });

    await generateUserSummary(
      { invokeTracked },
      {
        llm: {
          withStructuredOutput: jest
            .fn()
            .mockReturnValue({ invoke: jest.fn() }),
        } as unknown as ChatOpenAI,
        payload: {},
        locale: 'fr',
        retryMode: true,
      },
    );

    const [, messages] = invokeTracked.mock.calls[0] as [
      unknown,
      Array<{ role: string }>,
    ];
    const systemMessages = messages.filter((m) => m.role === 'system');
    expect(systemMessages.length).toBe(3);
  });
});
