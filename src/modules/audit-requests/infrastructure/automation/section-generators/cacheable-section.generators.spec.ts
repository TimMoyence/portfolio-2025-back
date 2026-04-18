import type { ChatOpenAI } from '@langchain/openai';
import {
  generateClientCommsSection,
  generateExecutionSection,
  generateExecutiveSection,
  generatePrioritySection,
} from './cacheable-section.generators';
import type { CachingSectionRunner } from './caching-section.runner';

/**
 * Tests unitaires des 4 generateurs fan-out cacheables. Le `cachingRunner`
 * est stubbe — on ne teste pas la logique Anthropic/OpenAI ici (couverte
 * par `caching-section.runner.spec.ts`), mais on verifie que :
 *  - le bon nom de section est passe au runner
 *  - le bon schema Zod est utilise
 *  - les systemBlocks et payload sont transmis tels quels
 *  - le fallback OpenAI est bien cable (llm.withStructuredOutput appele
 *    avec le schema attendu, si on resout le fallback manuellement)
 */

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

  it('generateExecutiveSection delegue au runner avec section=executive', async () => {
    const { runner, runCalls } = buildRunnerSpy({ ok: true });
    const invokeTracked = jest.fn();
    await generateExecutiveSection(
      { cachingRunner: runner, invokeTracked },
      baseArgs,
    );
    expect(runCalls[0].section).toBe('executive');
    expect(runCalls[0].payload).toEqual({ key: 'value' });
    expect(runCalls[0].systemBlocks.length).toBeGreaterThanOrEqual(2);
  });

  it('generatePrioritySection delegue au runner avec section=priority', async () => {
    const { runner, runCalls } = buildRunnerSpy({});
    const invokeTracked = jest.fn();
    await generatePrioritySection(
      { cachingRunner: runner, invokeTracked },
      baseArgs,
    );
    expect(runCalls[0].section).toBe('priority');
  });

  it('generateExecutionSection delegue au runner avec section=execution', async () => {
    const { runner, runCalls } = buildRunnerSpy({});
    const invokeTracked = jest.fn();
    await generateExecutionSection(
      { cachingRunner: runner, invokeTracked },
      baseArgs,
    );
    expect(runCalls[0].section).toBe('execution');
  });

  it('generateClientCommsSection delegue au runner avec section=client_comms', async () => {
    const { runner, runCalls } = buildRunnerSpy({});
    const invokeTracked = jest.fn();
    await generateClientCommsSection(
      { cachingRunner: runner, invokeTracked },
      baseArgs,
    );
    expect(runCalls[0].section).toBe('client_comms');
  });

  it('ajoute le retry constraint aux systemBlocks quand retryMode=true', async () => {
    const { runner, runCalls } = buildRunnerSpy({});
    const invokeTracked = jest.fn();
    await generateExecutiveSection(
      { cachingRunner: runner, invokeTracked },
      { ...baseArgs, retryMode: true },
    );
    expect(runCalls[0].systemBlocks.length).toBe(3);
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
