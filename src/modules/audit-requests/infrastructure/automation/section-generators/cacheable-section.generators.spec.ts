import type { ChatOpenAI } from '@langchain/openai';
import {
  clientCommsSectionSchema,
  executiveSectionSchema,
  executionSectionSchema,
  prioritySectionSchema,
} from '../schemas/audit-report.schemas';
import { GENERATEURS_DE_SECTION } from './cacheable-section.generators';
import type { CachingSectionRunner } from './caching-section.runner';
import { buildSystemBlocks } from './section-prompts.builder';

const generateExecutiveSection = GENERATEURS_DE_SECTION.executiveSection;

interface RunSpy {
  runner: CachingSectionRunner;
  runCalls: Array<Parameters<CachingSectionRunner['run']>[0]>;
}

function buildRunnerSpy<T>(resolved: T): RunSpy {
  const runCalls: Array<Parameters<CachingSectionRunner['run']>[0]> = [];
  const run = jest.fn((params: Parameters<CachingSectionRunner['run']>[0]) => {
    runCalls.push(params);
    return Promise.resolve(resolved as unknown);
  });
  return {
    runner: { run } as unknown as CachingSectionRunner,
    runCalls,
  };
}

function buildLlmStub(): {
  llm: ChatOpenAI;
  withStructuredOutputSpy: jest.Mock;
} {
  const invoke = jest.fn();
  const withStructuredOutputSpy = jest.fn().mockReturnValue({ invoke });
  return {
    llm: {
      withStructuredOutput: withStructuredOutputSpy,
    } as unknown as ChatOpenAI,
    withStructuredOutputSpy,
  };
}

describe('cacheable section generators', () => {
  const baseArgs = {
    llm: buildLlmStub().llm,
    payload: { key: 'value' },
    locale: 'fr' as const,
    retryMode: false,
  };

  it.each([
    ['executiveSection', 'executive', executiveSectionSchema],
    ['prioritySection', 'priority', prioritySectionSchema],
    ['executionSection', 'execution', executionSectionSchema],
    ['clientCommsSection', 'client_comms', clientCommsSectionSchema],
  ] as const)(
    '%s delegue au runner sa section, son schema et ses blocs systeme',
    async (generateur, section, schema) => {
      const { runner, runCalls } = buildRunnerSpy({ ok: true });
      const invokeTracked = jest.fn();
      await GENERATEURS_DE_SECTION[generateur](
        { cachingRunner: runner, invokeTracked },
        baseArgs,
      );
      expect(runCalls[0]).toEqual(
        expect.objectContaining({
          section,
          schema,
          payload: { key: 'value' },
          systemBlocks: buildSystemBlocks(section, 'fr', false),
        }),
      );
    },
  );

  it('ajoute le retry constraint aux systemBlocks quand retryMode=true', async () => {
    const { runner, runCalls } = buildRunnerSpy({});
    const invokeTracked = jest.fn();
    await generateExecutiveSection(
      { cachingRunner: runner, invokeTracked },
      { ...baseArgs, retryMode: true },
    );
    expect(runCalls[0].systemBlocks).toHaveLength(3);
  });

  it('invoque le fallback OpenAI via llm.withStructuredOutput quand appele', async () => {
    const runner = {
      run: jest.fn((params: { openAiFallback: () => Promise<unknown> }) =>
        params.openAiFallback(),
      ),
    } as unknown as CachingSectionRunner;
    const invokeTracked = jest.fn().mockResolvedValue({ ok: 'ok' });
    const { llm, withStructuredOutputSpy } = buildLlmStub();

    await generateExecutiveSection(
      { cachingRunner: runner, invokeTracked },
      { ...baseArgs, llm },
    );

    expect(withStructuredOutputSpy).toHaveBeenCalled();
    expect(invokeTracked).toHaveBeenCalledTimes(1);
  });
});
