import {
  createStructuredOutputLlm,
  createStructuredOutputLlmStub,
} from '../../../../../../test/factories/section-generator.factory';
import {
  clientCommsSectionSchema,
  executiveSectionSchema,
  executionSectionSchema,
  prioritySectionSchema,
} from '../schemas/audit-report.schemas';
import { wrapUntrustedUserPayload } from '../shared/prompt-sanitize.util';
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

const runnerQuiReplieSurOpenAi = {
  run: jest.fn((params: { openAiFallback: () => Promise<unknown> }) =>
    params.openAiFallback(),
  ),
} as unknown as CachingSectionRunner;

describe('cacheable section generators', () => {
  const baseArgs = {
    llm: createStructuredOutputLlm(),
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
      await GENERATEURS_DE_SECTION[generateur](
        { cachingRunner: runner },
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
    await generateExecutiveSection(
      { cachingRunner: runner },
      { ...baseArgs, retryMode: true },
    );
    expect(runCalls[0].systemBlocks).toHaveLength(3);
  });

  it('replie sur OpenAI : schema de la section, blocs systeme puis charge emballee, signal transmis', async () => {
    const invoke = jest.fn().mockResolvedValue({ ok: 'ok' });
    const { llm, withStructuredOutput } = createStructuredOutputLlmStub(invoke);
    const { signal } = new AbortController();

    const resultat = await generateExecutiveSection(
      { cachingRunner: runnerQuiReplieSurOpenAi },
      { ...baseArgs, llm, signal },
    );

    expect(resultat).toEqual({ ok: 'ok' });
    expect(withStructuredOutput).toHaveBeenCalledWith(executiveSectionSchema);
    expect(invoke).toHaveBeenCalledWith(
      [
        ...buildSystemBlocks('executive', 'fr', false).map((content) => ({
          role: 'system',
          content,
        })),
        { role: 'user', content: wrapUntrustedUserPayload({ key: 'value' }) },
      ],
      { signal },
    );
  });

  it('propage l erreur du repli OpenAI', async () => {
    const invoke = jest.fn().mockRejectedValue(new Error('openai down'));

    await expect(
      generateExecutiveSection(
        { cachingRunner: runnerQuiReplieSurOpenAi },
        { ...baseArgs, llm: createStructuredOutputLlm(invoke) },
      ),
    ).rejects.toThrow('openai down');
  });
});
