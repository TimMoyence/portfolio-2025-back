import {
  buildAiBotsAccess,
  buildCitationWorthiness,
  buildHomepageSnapshot,
  buildStructuredDataQuality,
  buildUrlIndexabilityResult,
} from '../../../../../test/factories/audit-requests.factory';
import { ScoringService } from './scoring.service';
import type { UrlIndexabilityResult } from './url-indexability.service';
import type { LlmsTxtAnalysis } from '../../domain/AiIndexability';

const buildLlmsTxt = (
  overrides: Partial<LlmsTxtAnalysis> = {},
): LlmsTxtAnalysis => ({
  present: true,
  url: 'https://example.com/llms.txt',
  sizeBytes: 1200,
  sections: [{ title: 'Docs', links: 3 }],
  hasFullVariant: true,
  complianceScore: 90,
  issues: [],
  ...overrides,
});

const buildSampledUrl = (
  overrides: Partial<UrlIndexabilityResult> = {},
): UrlIndexabilityResult =>
  buildUrlIndexabilityResult({
    aiSignals: {
      llmsTxt: null,
      aiBotsAccess: buildAiBotsAccess(),
      citationWorthiness: buildCitationWorthiness({ score: 75 }),
      structuredDataQuality: buildStructuredDataQuality(),
    },
    ...overrides,
  });

describe('ScoringService', () => {
  let service: ScoringService;

  beforeEach(() => {
    service = new ScoringService();
  });

  describe('compute - piliers historiques', () => {
    it('returns high scores for healthy baseline', () => {
      const homepage = buildHomepageSnapshot();
      const result = service.compute(
        homepage,
        ['https://example.com/sitemap.xml'],
        [],
      );
      expect(result.pillarScores.seo).toBeGreaterThanOrEqual(90);
      expect(result.quickWins).toHaveLength(0);
    });

    it('adds quick wins and lowers score for major gaps', () => {
      const homepage = buildHomepageSnapshot({
        finalUrl: 'http://example.com/',
        statusCode: 500,
        https: false,
        redirectChain: ['http://example.com'],
        ttfbMs: 2000,
        totalResponseMs: 3500,
        contentLength: 900000,
        title: null,
        metaDescription: null,
        robotsMeta: 'noindex',
        canonicalUrls: [],
        h1Count: 0,
        htmlLang: null,
        hasStructuredData: false,
        openGraphTags: [],
        twitterTags: [],
        hasAnalytics: false,
        hasTagManager: false,
        hasCookieBanner: false,
        hasForms: false,
      });

      const result = service.compute(
        homepage,
        [],
        [
          {
            url: 'https://example.com/a',
            finalUrl: 'https://example.com/a',
            statusCode: 404,
            indexable: false,
            robotsMeta: 'noindex',
            xRobotsTag: null,
            canonical: null,
            error: null,
          },
        ],
      );

      expect(result.pillarScores.technical).toBeLessThan(60);
      expect(result.quickWins.length).toBeGreaterThan(3);
    });
  });

  describe('compute - renvoie 7 piliers', () => {
    it('returns all 7 pillar keys even with empty inputs', () => {
      const homepage = buildHomepageSnapshot();
      const result = service.compute(homepage, [], []);
      expect(
        Object.keys(result.pillarScores).sort((a, b) => a.localeCompare(b)),
      ).toEqual([
        'aiVisibility',
        'citationWorthiness',
        'conversion',
        'performance',
        'seo',
        'technical',
        'trust',
      ]);
    });

    it('fills aiVisibility / citationWorthiness with 0 when no data', () => {
      const homepage = buildHomepageSnapshot();
      const result = service.compute(homepage, [], []);
      expect(result.pillarScores.aiVisibility).toBeGreaterThanOrEqual(0);
      expect(result.pillarScores.aiVisibility).toBeLessThanOrEqual(100);
      expect(result.pillarScores.citationWorthiness).toBe(0);
    });
  });

  describe('scoreAiVisibility', () => {
    it('retourne le score minimal (base) en absence totale de signaux', () => {
      const score = service.scoreAiVisibility({
        llmsTxt: null,
        aiBotsAccess: [],
        structuredDataQuality: [],
      });
      expect(score).toBe(20);
    });

    it('ajoute le bonus llmsTxt présent + complianceScore', () => {
      const score = service.scoreAiVisibility({
        llmsTxt: buildLlmsTxt({ present: true, complianceScore: 100 }),
        aiBotsAccess: [],
        structuredDataQuality: [],
      });
      expect(score).toBe(55);
    });

    it('ajoute 25 quand toutes les pages autorisent gptBot + googleExtended', () => {
      const score = service.scoreAiVisibility({
        llmsTxt: null,
        aiBotsAccess: [buildAiBotsAccess(), buildAiBotsAccess()],
        structuredDataQuality: [],
      });
      expect(score).toBe(45);
    });

    it('pénalise quand une page bloque gptBot', () => {
      const score = service.scoreAiVisibility({
        llmsTxt: null,
        aiBotsAccess: [
          buildAiBotsAccess({ gptBot: 'disallowed' }),
          buildAiBotsAccess(),
        ],
        structuredDataQuality: [],
      });
      expect(score).toBe(33);
    });

    it('ajoute 20 quand toutes les pages ont du structuredData aiFriendly', () => {
      const score = service.scoreAiVisibility({
        llmsTxt: null,
        aiBotsAccess: [],
        structuredDataQuality: [
          buildStructuredDataQuality({ aiFriendly: true }),
          buildStructuredDataQuality({ aiFriendly: true }),
        ],
      });
      expect(score).toBe(40);
    });

    const scoreDesSignauxOptimaux = (complianceScore: number) =>
      service.scoreAiVisibility({
        llmsTxt: buildLlmsTxt({ present: true, complianceScore }),
        aiBotsAccess: [buildAiBotsAccess()],
        structuredDataQuality: [
          buildStructuredDataQuality({ aiFriendly: true }),
        ],
      });

    it('retourne un score parfait (100) avec tous signaux optimaux', () => {
      expect(scoreDesSignauxOptimaux(100)).toBe(100);
    });

    it('borne le score entre 0 et 100', () => {
      expect(scoreDesSignauxOptimaux(200)).toBeLessThanOrEqual(100);
    });
  });

  describe('scoreCitationWorthiness', () => {
    it('retourne 0 quand aucune page', () => {
      expect(service.scoreCitationWorthiness([])).toBe(0);
    });

    it('retourne la moyenne arithmétique arrondie', () => {
      expect(service.scoreCitationWorthiness([80, 60, 40])).toBe(60);
    });

    it('arrondit correctement', () => {
      expect(service.scoreCitationWorthiness([70, 71])).toBe(71);
    });

    it('borne les scores aberrants', () => {
      expect(service.scoreCitationWorthiness([150])).toBeLessThanOrEqual(100);
      expect(service.scoreCitationWorthiness([-10])).toBeGreaterThanOrEqual(0);
    });
  });

  describe('compute - intégration aiVisibility / citationWorthiness', () => {
    it('agrège les signaux IA des sampledUrls pour les 2 nouveaux piliers', () => {
      const homepage = buildHomepageSnapshot();
      const result = service.compute(
        homepage,
        ['https://example.com/sitemap.xml'],
        [
          buildSampledUrl({
            aiSignals: {
              llmsTxt: null,
              aiBotsAccess: buildAiBotsAccess(),
              citationWorthiness: buildCitationWorthiness({ score: 80 }),
              structuredDataQuality: buildStructuredDataQuality({
                aiFriendly: true,
              }),
            },
          }),
        ],
        'fr',
        { llmsTxt: buildLlmsTxt() },
      );

      expect(result.pillarScores.aiVisibility).toBeGreaterThan(20);
      expect(result.pillarScores.citationWorthiness).toBe(80);
    });

    it('ignore les pages sans aiSignals pour citationWorthiness', () => {
      const homepage = buildHomepageSnapshot();
      const result = service.compute(
        homepage,
        [],
        [
          buildSampledUrl({ aiSignals: null }),
          buildSampledUrl({
            aiSignals: {
              llmsTxt: null,
              aiBotsAccess: buildAiBotsAccess(),
              citationWorthiness: {
                score: 60,
                hasFacts: true,
                hasSources: false,
                hasDates: true,
                hasAuthor: false,
                contentDensity: 'medium',
              },
              structuredDataQuality: buildStructuredDataQuality(),
            },
          }),
        ],
      );

      expect(result.pillarScores.citationWorthiness).toBe(60);
    });
  });
});
