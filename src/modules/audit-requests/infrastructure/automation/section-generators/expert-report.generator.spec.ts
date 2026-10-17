import { generateExpertReport } from './expert-report.generator';
import { buildExpertReport } from '../../../../../../test/factories/audit-requests.factory';
import {
  buildSectionGeneratorArgs,
  createStructuredOutputLlmStub,
  systemMessagesOf,
  type SectionGeneratorArgs,
} from '../../../../../../test/factories/section-generator.factory';
import { expertReportSchema } from '../schemas/audit-report.schemas';

describe('generateExpertReport', () => {
  function genererAvec(overrides: Partial<SectionGeneratorArgs> = {}) {
    const rapport = buildExpertReport();
    const invoke = jest.fn().mockResolvedValue(rapport);
    const { llm, withStructuredOutput } = createStructuredOutputLlmStub(invoke);
    const resultat = generateExpertReport(
      buildSectionGeneratorArgs({ llm, ...overrides }),
    );
    return { rapport, invoke, withStructuredOutput, resultat };
  }

  it('structure la reponse par expertReportSchema et la rend telle quelle', async () => {
    const { rapport, withStructuredOutput, resultat } = genererAvec();

    await expect(resultat).resolves.toBe(rapport);
    expect(withStructuredOutput).toHaveBeenCalledWith(expertReportSchema);
  });

  it('ajoute compact constraint en compactMode', async () => {
    const { invoke, resultat } = genererAvec({ compactMode: true });

    await resultat;

    expect(systemMessagesOf(invoke)).toHaveLength(4);
  });

  it('ajoute retry constraint en retryMode', async () => {
    const { invoke, resultat } = genererAvec({ retryMode: true });

    await resultat;

    expect(systemMessagesOf(invoke)).toHaveLength(4);
  });
});
