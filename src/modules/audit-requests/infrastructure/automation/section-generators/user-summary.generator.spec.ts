import { generateUserSummary } from './user-summary.generator';
import {
  buildSectionGeneratorArgs,
  createStructuredOutputLlmStub,
  systemMessagesOf,
} from '../../../../../../test/factories/section-generator.factory';
import { userSummarySchema } from '../schemas/audit-report.schemas';

describe('generateUserSummary', () => {
  it('retourne le summaryText extrait de la reponse LLM', async () => {
    const invoke = jest
      .fn()
      .mockResolvedValue({ summaryText: 'Synthese test.' });
    const { llm, withStructuredOutput } = createStructuredOutputLlmStub(invoke);

    const result = await generateUserSummary(
      buildSectionGeneratorArgs({ llm, payload: { any: 'payload' } }),
    );

    expect(result).toBe('Synthese test.');
    expect(withStructuredOutput).toHaveBeenCalledWith(userSummarySchema);
    expect(invoke).toHaveBeenCalledTimes(1);
    const [messages] = invoke.mock.calls[0] as [unknown[]];
    expect(messages.length).toBeGreaterThanOrEqual(3);
  });

  it('insere le retry constraint en retryMode=true', async () => {
    const invoke = jest.fn().mockResolvedValue({ summaryText: 'x' });
    const { llm } = createStructuredOutputLlmStub(invoke);

    await generateUserSummary(
      buildSectionGeneratorArgs({ llm, retryMode: true }),
    );

    expect(systemMessagesOf(invoke)).toHaveLength(3);
  });
});
