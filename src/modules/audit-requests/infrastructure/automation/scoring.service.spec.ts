import { ScoringService } from './scoring.service';
import { HomepageAuditSnapshot } from './homepage-analyzer.service';
import type { UrlIndexabilityResult } from './url-indexability.service';
import type {
  AiBotsAccess,
  LlmsTxtAnalysis,
} from '../../domain/AiIndexability';
import type { StructuredDataQualityResult } from '../../domain/StructuredDataQuality';

/**
 * Factory interne — homepage saine par défaut. Les specs peuvent overrider
 * les champs qui les intéressent sans dupliquer le payload.
 */
const buildHomepage = (
  overrides: Partial<HomepageAuditSnapshot> = {},
): HomepageAuditSnapshot => ({
  finalUrl: 'https://example.com/',
  statusCode: 200,
  https: true,
  redirectChain: [],
  ttfbMs: 250,
  totalResponseMs: 700,
  contentLength: 120000,
  server: 'nginx',
  xPoweredBy: null,
  setCookiePatterns: [],
  cacheHeaders: {},
  securityHeaders: {},
  title: 'Example',
  metaDescription: 'Description',
  robotsMeta: null,
  canonicalUrls: ['https://example.com/'],
  h1Count: 1,
  htmlLang: 'fr',
  hasStructuredData: true,
  openGraphTags: ['og:title'],
  twitterTags: ['twitter:title'],
  detectedCmsHints: [],
  hasAnalytics: true,
  hasTagManager: true,
  hasPixel: false,
  hasCookieBanner: true,
  hasForms: true,
  internalLinks: [],
  ...overrides,
});

const buildBotsAccess = (
  overrides: Partial<AiBotsAccess> = {},
): AiBotsAccess => ({
  gptBot: 'allowed',
  chatGptUser: 'allowed',
  perplexityBot: 'allowed',
  claudeBot: 'allowed',
  googleExtended: 'allowed',
  xRobotsNoAi: false,
  xRobotsNoImageAi: false,
  ...overrides,
});

const buildStructuredDataQuality = (
  overrides: Partial<StructuredDataQualityResult> = {},
): StructuredDataQualityResult => ({
  score: 80,
  total: 2,
  types: ['Organization'],
  googleRichResultsEligible: true,
  aiFriendly: true,
  invalidBlocks: [],
  ...overrides,
});

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
): UrlIndexabilityResult => ({
  url: 'https://example.com/a',
  finalUrl: 'https://example.com/a',
  statusCode: 200,
  indexable: true,
  robotsMeta: null,
  xRobotsTag: null,
  canonical: 'https://example.com/a',
  canonicalCount: 1,
  title: 'Page A',
  metaDescription: 'Desc A',
  h1Count: 1,
  htmlLang: 'fr',
  error: null,
  aiSignals: {
    llmsTxt: null,
    aiBotsAccess: buildBotsAccess(),
    citationWorthiness: {
      score: 75,
      hasFacts: true,
      hasSources: true,
      hasDates: true,
      hasAuthor: true,
      contentDensity: 'high',
    },
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
      const homepage = buildHomepage();
      const result = service.compute(
        homepage,
        ['https://example.com/sitemap.xml'],
        [],
      );
      expect(result.pillarScores.seo).toBeGreaterThanOrEqual(90);
      expect(result.quickWins.length).toBe(0);
    });

    it('adds quick wins and lowers score for major gaps', () => {
      const homepage = buildHomepage({
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
      const homepage = buildHomepage();
      const result = service.compute(homepage, [], []);
      expect(Object.keys(result.pillarScores).sort()).toEqual(
        [
          'aiVisibility',
          'citationWorthiness',
          'conversion',
          'performance',
          'seo',
          'technical',
          'trust',
        ].sort(),
      );
    });

    it('fills aiVisibility / citationWorthiness with 0 when no data', () => {
      const homepage = buildHomepage();
      const result = service.compute(homepage, [], []);
      // Avec llmsTxt absent et aucune page, aiVisibility = base seulement.
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
      // 20 + 20 (présent) + 15 (100 * 0.15) = 55
      expect(score).toBe(55);
    });

    it('ajoute 25 quand toutes les pages autorisent gptBot + googleExtended', () => {
      const score = service.scoreAiVisibility({
        llmsTxt: null,
        aiBotsAccess: [buildBotsAccess(), buildBotsAccess()],
        structuredDataQuality: [],
      });
      // 20 + 25 = 45
      expect(score).toBe(45);
    });

    it('pénalise quand une page bloque gptBot', () => {
      const score = service.scoreAiVisibility({
        llmsTxt: null,
        aiBotsAccess: [
          buildBotsAccess({ gptBot: 'disallowed' }),
          buildBotsAccess(),
        ],
        structuredDataQuality: [],
      });
      // 20 + 25 * 0.5 = 32.5 → 33
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

    it('retourne un score parfait (100) avec tous signaux optimaux', () => {
      const score = service.scoreAiVisibility({
        llmsTxt: buildLlmsTxt({ present: true, complianceScore: 100 }),
        aiBotsAccess: [buildBotsAccess()],
        structuredDataQuality: [
          buildStructuredDataQuality({ aiFriendly: true }),
        ],
      });
      // 20 + 20 + 15 + 25 + 20 = 100
      expect(score).toBe(100);
    });

    it('borne le score entre 0 et 100', () => {
      const score = service.scoreAiVisibility({
        llmsTxt: buildLlmsTxt({ present: true, complianceScore: 200 }),
        aiBotsAccess: [buildBotsAccess()],
        structuredDataQuality: [
          buildStructuredDataQuality({ aiFriendly: true }),
        ],
      });
      expect(score).toBeLessThanOrEqual(100);
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
      // (70 + 71) / 2 = 70.5 → 71
      expect(service.scoreCitationWorthiness([70, 71])).toBe(71);
    });

    it('borne les scores aberrants', () => {
      expect(service.scoreCitationWorthiness([150])).toBeLessThanOrEqual(100);
      expect(service.scoreCitationWorthiness([-10])).toBeGreaterThanOrEqual(0);
    });
  });

  describe('compute - intégration aiVisibility / citationWorthiness', () => {
    it('agrège les signaux IA des sampledUrls pour les 2 nouveaux piliers', () => {
      const homepage = buildHomepage();
      const result = service.compute(
        homepage,
        ['https://example.com/sitemap.xml'],
        [
          buildSampledUrl({
            aiSignals: {
              llmsTxt: null,
              aiBotsAccess: buildBotsAccess(),
              citationWorthiness: {
                score: 80,
                hasFacts: true,
                hasSources: true,
                hasDates: true,
                hasAuthor: true,
                contentDensity: 'high',
              },
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
      const homepage = buildHomepage();
      const result = service.compute(
        homepage,
        [],
        [
          buildSampledUrl({ aiSignals: null }),
          buildSampledUrl({
            aiSignals: {
              llmsTxt: null,
              aiBotsAccess: buildBotsAccess(),
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
