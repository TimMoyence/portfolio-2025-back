import type { ChatOpenAI } from '@langchain/openai';
import { generateExpertReport } from './expert-report.generator';
import type { ExpertReport } from '../schemas/audit-report.schemas';

describe('generateExpertReport', () => {
  function buildStubReport(): ExpertReport {
    return {
      priorities: [],
      urlLevelImprovements: [],
    } as unknown as ExpertReport;
  }

  it('appelle invokeTracked avec la section expert_report', async () => {
    const invokeTracked = jest.fn().mockResolvedValue(buildStubReport());

    await generateExpertReport(
      { invokeTracked },
      {
        llm: {
          withStructuredOutput: jest
            .fn()
            .mockReturnValue({ invoke: jest.fn() }),
        } as unknown as ChatOpenAI,
        payload: {},
        locale: 'fr',
      },
    );

    const [, , section] = invokeTracked.mock.calls[0];
    expect(section).toBe('expert_report');
  });

  it('ajoute compact constraint en compactMode', async () => {
    const invokeTracked = jest.fn().mockResolvedValue(buildStubReport());

    await generateExpertReport(
      { invokeTracked },
      {
        llm: {
          withStructuredOutput: jest
            .fn()
            .mockReturnValue({ invoke: jest.fn() }),
        } as unknown as ChatOpenAI,
        payload: {},
        locale: 'fr',
        compactMode: true,
      },
    );

    const [, messages] = invokeTracked.mock.calls[0] as [
      unknown,
      Array<{ role: string }>,
    ];
    // disclaimer + main + strict + compact = 4 system messages
    expect(messages.filter((m) => m.role === 'system').length).toBe(4);
  });

  it('ajoute retry constraint en retryMode', async () => {
    const invokeTracked = jest.fn().mockResolvedValue(buildStubReport());

    await generateExpertReport(
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
    // disclaimer + main + strict + retry = 4 system messages
    expect(messages.filter((m) => m.role === 'system').length).toBe(4);
  });
});
