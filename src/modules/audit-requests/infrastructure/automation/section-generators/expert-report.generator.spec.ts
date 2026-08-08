import { generateExpertReport } from './expert-report.generator';
import type { ExpertReport } from '../schemas/audit-report.schemas';
import {
  buildSectionGeneratorArgs,
  systemMessagesOf,
} from '../../../../../../test/factories/section-generator.factory';

describe('generateExpertReport', () => {
  function buildStubReport(): ExpertReport {
    return {
      priorities: [],
      urlLevelImprovements: [],
    } as unknown as ExpertReport;
  }

  function stubInvokeTracked(): jest.Mock {
    return jest.fn().mockResolvedValue(buildStubReport());
  }

  it('appelle invokeTracked avec la section expert_report', async () => {
    const invokeTracked = stubInvokeTracked();

    await generateExpertReport({ invokeTracked }, buildSectionGeneratorArgs());

    const [, , section] = invokeTracked.mock.calls[0];
    expect(section).toBe('expert_report');
  });

  it('ajoute compact constraint en compactMode', async () => {
    const invokeTracked = stubInvokeTracked();

    await generateExpertReport(
      { invokeTracked },
      buildSectionGeneratorArgs({ compactMode: true }),
    );

    expect(systemMessagesOf(invokeTracked)).toHaveLength(4);
  });

  it('ajoute retry constraint en retryMode', async () => {
    const invokeTracked = stubInvokeTracked();

    await generateExpertReport(
      { invokeTracked },
      buildSectionGeneratorArgs({ retryMode: true }),
    );

    expect(systemMessagesOf(invokeTracked)).toHaveLength(4);
  });
});
