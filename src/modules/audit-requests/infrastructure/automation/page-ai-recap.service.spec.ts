/* eslint-disable @typescript-eslint/unbound-method */
import { buildAuditAutomationConfig } from '../../../../../test/factories/audit-config.factory';
import {
  buildAiBotsAccess,
  buildCitationWorthiness,
  buildEngineCoverage,
  buildPageExploree,
  buildStructuredDataQuality,
} from '../../../../../test/factories/audit-requests.factory';
import {
  createChatOpenAIFactoryQuiInvoque,
  createChatOpenAIFactoryStub,
} from '../../../../../test/factories/section-generator.factory';
import {
  attendreUnPayloadEmballe,
  BALISE_FERMANTE_INJECTEE,
} from '../../../../../test/helpers/appels-llm';
import type { AuditLocale } from '../../domain/audit-locale.util';
import { nonVerifiable } from '../../domain/non-verifiable';
import type { AuditAutomationConfig } from './audit.config';
import { PageAiRecapService } from './page-ai-recap.service';
import { UNTRUSTED_DATA_DISCLAIMER_EN } from './shared/prompt-sanitize.util';
import type { UrlIndexabilityResult } from './url-indexability.service';

describe('PageAiRecapService', () => {
  const config: AuditAutomationConfig = buildAuditAutomationConfig({
    fetchTimeoutMs: 8_000,
    rateHourlyMin: 90,
    rateHourlyMax: 130,
    openAiApiKey: undefined,
  });

  const page = buildPageExploree('/about', {
    ttfbMs: 120,
    totalResponseMs: 560,
    contentLength: 32000,
    title: 'About us',
    metaDescription: 'Learn more about our services.',
    h1Texts: ['About us'],
    htmlLang: 'en',
    responseTimeMs: 560,
    wordCount: 210,
    hasStructuredData: false,
    openGraphTagCount: 1,
    twitterTags: ['twitter:title'],
    hasForms: false,
    ctaHints: [],
    textExcerpt:
      'We help businesses grow through technical SEO and conversion design.',
    internalLinkCount: 1,
  });

  const analyserSansLlm = (
    locale: AuditLocale,
    pages: UrlIndexabilityResult[],
  ) =>
    new PageAiRecapService(config, createChatOpenAIFactoryStub()).analyzePages({
      locale,
      websiteName: 'example.com',
      normalizedUrl: 'https://example.com',
      pages,
    });

  describe('appel du LLM de recap', () => {
    const RECAP_DU_LLM = {
      summary: 'Page claire',
      topIssues: ['Meta description absente'],
      recommendations: ['Ajouter une meta description'],
      wordingScore: 70,
      trustScore: 70,
      ctaScore: 70,
      seoCopyScore: 70,
      priority: 'medium',
      language: 'en',
      engineScores: buildEngineCoverage(),
    };

    function serviceAvecLlm(
      pageAnalysee: UrlIndexabilityResult = page,
      recapDuLlm: typeof RECAP_DU_LLM = RECAP_DU_LLM,
    ) {
      const invoke = jest.fn().mockResolvedValue(recapDuLlm);
      const fabrique = createChatOpenAIFactoryQuiInvoque(invoke);
      const service = new PageAiRecapService(
        { ...config, openAiApiKey: 'test-key' },
        fabrique,
      );
      const analyser = () =>
        service.analyzePages({
          locale: 'en',
          websiteName: 'example.com',
          normalizedUrl: 'https://example.com',
          pages: [pageAnalysee],
        });
      return { invoke, fabrique, analyser };
    }

    it('construit son LLM par la fabrique, à température nulle', async () => {
      const { fabrique, analyser } = serviceAvecLlm();

      const result = await analyser();

      expect(result.recaps[0].source).toBe('llm');
      expect(fabrique.create).toHaveBeenCalledWith(config.pageAiTimeoutMs, {
        temperature: 0,
      });
    });

    it('emballe le contenu crawlé comme donnée non fiable', async () => {
      const { invoke, analyser } = serviceAvecLlm();

      await analyser();

      expect(
        attendreUnPayloadEmballe(invoke, UNTRUSTED_DATA_DISCLAIMER_EN),
      ).toContain('We help businesses grow');
    });

    it("n'ouvre ni ne ferme le bloc depuis le contenu crawlé", async () => {
      const { invoke, analyser } = serviceAvecLlm({
        ...page,
        title: BALISE_FERMANTE_INJECTEE,
        h1Texts: [BALISE_FERMANTE_INJECTEE],
        textExcerpt: BALISE_FERMANTE_INJECTEE,
      });

      await analyser();

      attendreUnPayloadEmballe(invoke, UNTRUSTED_DATA_DISCLAIMER_EN);
    });

    it('nettoie, dédoublonne et borne les listes rendues par le LLM', async () => {
      const couverture = buildEngineCoverage();
      const { analyser } = serviceAvecLlm(page, {
        ...RECAP_DU_LLM,
        topIssues: ['A', ' A ', '', 'B'],
        recommendations: [' C', 'C', 'D '],
        engineScores: {
          ...couverture,
          bingChatGpt: {
            ...couverture.bingChatGpt,
            strengths: ['F', 'F ', ' '],
            blockers: ['G', ' G'],
            opportunities: ['H', '', 'H'],
          },
        },
      });

      const {
        recaps: [recap],
      } = await analyser();

      expect(recap.topIssues).toEqual(['A', 'B']);
      expect(recap.recommendations).toEqual(['C', 'D']);
      expect(recap.engineScores?.bingChatGpt).toEqual(
        expect.objectContaining({
          strengths: ['F'],
          blockers: ['G'],
          opportunities: ['H'],
        }),
      );
    });

    it.each(['fr', 'en'] as const)(
      'ramene a 50 le score d un moteur dont un blocage porte le marqueur non verifiable en %s',
      async (locale) => {
        const couverture = buildEngineCoverage({ google: 90, perplexity: 90 });
        const { analyser } = serviceAvecLlm(page, {
          ...RECAP_DU_LLM,
          engineScores: {
            ...couverture,
            google: {
              ...couverture.google,
              blockers: [`Donnees Core Web Vitals : ${nonVerifiable(locale)}`],
            },
            perplexity: {
              ...couverture.perplexity,
              blockers: ['Pas de llms.txt'],
            },
          },
        });

        const {
          recaps: [recap],
        } = await analyser();

        expect(recap.engineScores?.google.score).toBe(50);
        expect(recap.engineScores?.perplexity.score).toBe(90);
      },
    );
  });

  it('returns deterministic fallback when llm is unavailable', async () => {
    const result = await analyserSansLlm('en', [page]);

    expect(result.recaps).toHaveLength(1);
    expect(result.recaps[0].source).toBe('fallback');
    expect(result.summary.totalPages).toBe(1);
    expect(result.summary.fallbackRecaps).toBe(1);
    expect(result.summary.llmRecaps).toBe(0);
  });

  it('lit la langue du recap dans le html[lang], bords et casse compris', async () => {
    const result = await analyserSansLlm('en', [
      { ...page, htmlLang: ' FR-fr' },
    ]);

    expect(result.recaps[0].language).toBe('fr');
  });

  it('produces a deterministic engineScores coverage in fallback mode', async () => {
    const result = await analyserSansLlm('en', [
      {
        ...page,
        aiSignals: {
          llmsTxt: null,
          aiBotsAccess: buildAiBotsAccess(),
          citationWorthiness: buildCitationWorthiness({ score: 72 }),
          structuredDataQuality: buildStructuredDataQuality({
            types: ['Organization', 'FAQPage'],
          }),
        },
      },
    ]);

    const recap = result.recaps[0];
    expect(recap.engineScores).toBeDefined();
    expect(recap.engineScores.google.engine).toBe('google');
    expect(recap.engineScores.bingChatGpt.engine).toBe('bing_chatgpt');
    expect(recap.engineScores.perplexity.engine).toBe('perplexity');
    expect(recap.engineScores.geminiOverviews.engine).toBe('gemini_overviews');
    expect(recap.engineScores.google.score).toBeGreaterThanOrEqual(0);
    expect(recap.engineScores.google.score).toBeLessThanOrEqual(100);
    expect(recap.engineScores.google.indexable).toBe(true);
    expect(recap.engineScores.geminiOverviews.strengths.length).toBeGreaterThan(
      0,
    );
  });

  it('flags blocked bots and non-indexable pages in the engineScores fallback', async () => {
    const result = await analyserSansLlm('fr', [
      {
        ...page,
        indexable: false,
        aiSignals: {
          llmsTxt: null,
          aiBotsAccess: buildAiBotsAccess({
            gptBot: 'disallowed',
            chatGptUser: 'disallowed',
            perplexityBot: 'disallowed',
            claudeBot: 'disallowed',
            googleExtended: 'disallowed',
            xRobotsNoAi: true,
          }),
          citationWorthiness: buildCitationWorthiness({
            score: 20,
            hasFacts: false,
            hasSources: false,
            hasDates: false,
            hasAuthor: false,
            contentDensity: 'low',
          }),
          structuredDataQuality: buildStructuredDataQuality({
            score: 10,
            total: 0,
            types: [],
            googleRichResultsEligible: false,
            aiFriendly: false,
          }),
        },
      },
    ]);

    const coverage = result.recaps[0].engineScores;
    expect(coverage.google.indexable).toBe(false);
    expect(coverage.bingChatGpt.indexable).toBe(false);
    expect(coverage.perplexity.indexable).toBe(false);
    expect(coverage.geminiOverviews.indexable).toBe(false);
    expect(coverage.bingChatGpt.blockers.length).toBeGreaterThan(0);
    expect(coverage.perplexity.blockers.length).toBeGreaterThan(0);
  });

  it('opens circuit breaker and skips remaining llm page calls on repeated failures', async () => {
    const service = new PageAiRecapService(
      {
        ...config,
        openAiApiKey: 'test-key',
        pageAiCircuitBreakerMinSamples: 2,
        pageAiCircuitBreakerFailureRatio: 0.5,
        pageAiConcurrency: 1,
      },
      createChatOpenAIFactoryStub(),
    );
    const pages = Array.from({ length: 5 }, (_, index) => ({
      ...page,
      url: `https://example.com/page-${index + 1}`,
      finalUrl: `https://example.com/page-${index + 1}`,
    }));

    const analyzeSpy = jest
      .spyOn(
        service as unknown as {
          analyzeSinglePage: (
            locale: unknown,
            currentPage: UrlIndexabilityResult,
            llm: unknown,
          ) => Promise<unknown>;
        },
        'analyzeSinglePage',
      )
      .mockImplementation((_locale, currentPage) => {
        const emptyEngine = {
          engine: 'google' as const,
          score: 0,
          indexable: false,
          strengths: [],
          blockers: [],
          opportunities: [],
        };
        return Promise.resolve({
          recap: {
            url: currentPage.url,
            finalUrl: currentPage.finalUrl,
            priority: 'high',
            language: 'en',
            wordingScore: 30,
            trustScore: 30,
            ctaScore: 30,
            seoCopyScore: 30,
            summary: 'fallback',
            topIssues: ['timeout'],
            recommendations: ['retry later'],
            source: 'fallback',
            engineScores: {
              google: emptyEngine,
              bingChatGpt: { ...emptyEngine, engine: 'bing_chatgpt' },
              perplexity: { ...emptyEngine, engine: 'perplexity' },
              geminiOverviews: { ...emptyEngine, engine: 'gemini_overviews' },
            },
          },
          llmAttempted: true,
          llmFailed: true,
        });
      });

    const result = await service.analyzePages({
      locale: 'en',
      websiteName: 'example.com',
      normalizedUrl: 'https://example.com',
      pages,
    });

    expect(analyzeSpy).toHaveBeenCalledTimes(2);
    expect(
      result.warnings.some((warning) =>
        warning.toLowerCase().includes('circuit breaker opened'),
      ),
    ).toBe(true);
    expect(result.recaps).toHaveLength(5);
    expect(result.summary.fallbackRecaps).toBe(5);
  });
});
