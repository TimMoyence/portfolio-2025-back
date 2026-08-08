import { generateUserSummary } from './user-summary.generator';
import {
  buildSectionGeneratorArgs,
  systemMessagesOf,
} from '../../../../../../test/factories/section-generator.factory';

describe('generateUserSummary', () => {
  it('retourne le summaryText extrait de la reponse LLM', async () => {
    const invokeTracked = jest
      .fn()
      .mockResolvedValue({ summaryText: 'Synthese test.' });

    const result = await generateUserSummary(
      { invokeTracked },
      buildSectionGeneratorArgs({ payload: { any: 'payload' } }),
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
      buildSectionGeneratorArgs({ retryMode: true }),
    );

    expect(systemMessagesOf(invokeTracked)).toHaveLength(3);
  });
});
