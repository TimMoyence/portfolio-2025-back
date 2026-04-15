import { buildAuditAutomationConfig } from '../../../../../test/factories/audit-config.factory';
import { AiHeadersAnalyzerService } from './ai-headers-analyzer.service';
import { CitationWorthinessService } from './citation-worthiness.service';
import { SafeFetchService } from './safe-fetch.service';
import { StructuredDataQualityService } from './structured-data-quality.service';
import { UrlIndexabilityService } from './url-indexability.service';

/**
 * Tests TDD pour l'enrichissement IA du service d'analyse d'URL.
 * Vérifie que chaque `UrlIndexabilityResult` est enrichi d'un objet
 * `aiSignals` contenant l'accès des bots IA, la citabilité et la
 * qualité des données structurées.
 */
describe('UrlIndexabilityService (Phase 3 — aiSignals)', () => {
  const config = buildAuditAutomationConfig({ urlAnalyzeConcurrency: 2 });

  const buildHtml = (): string => `
    <html lang="fr">
      <head>
        <title>Accueil Example</title>
        <meta name="description" content="Bienvenue sur Example" />
        <meta name="author" content="Jane Doe" />
        <link rel="canonical" href="https://example.com/" />
        <script type="application/ld+json">
          {"@context":"https://schema.org","@type":"Article","headline":"Titre","author":"Jane","datePublished":"2026-01-01"}
        </script>
      </head>
      <body>
        <h1>Bienvenue</h1>
        <h2>Nos services</h2>
        <time datetime="2026-01-01">1er janvier</time>
        <p>${'contenu riche '.repeat(120)}avec 42% de satisfaction et 1234 clients.</p>
        <a href="https://wikipedia.org/wiki/Audit">Wikipedia</a>
        <a href="/contact">Contact</a>
      </body>
    </html>
  `;

  const buildSafeFetchStub = (): jest.Mocked<SafeFetchService> => {
    return {
      fetchText: jest.fn().mockResolvedValue({
        requestedUrl: 'https://example.com/',
        finalUrl: 'https://example.com/',
        redirectChain: [],
        statusCode: 200,
        headers: { 'x-robots-tag': 'index' },
        body: buildHtml(),
        ttfbMs: 120,
        totalMs: 400,
        contentLength: 500,
      }),
      fetchHeaders: jest.fn(),
    } as unknown as jest.Mocked<SafeFetchService>;
  };

  const buildService = (
    overrides: {
      safeFetch?: jest.Mocked<SafeFetchService>;
    } = {},
  ): UrlIndexabilityService => {
    const safeFetch = overrides.safeFetch ?? buildSafeFetchStub();
    return new UrlIndexabilityService(
      config,
      safeFetch,
      new AiHeadersAnalyzerService(),
      new CitationWorthinessService(),
      new StructuredDataQualityService(),
    );
  };

  it('retourne toujours les champs existants (backward compatible)', async () => {
    const service = buildService();

    const [result] = await service.analyzeUrls(['https://example.com/']);

    expect(result.url).toBe('https://example.com/');
    expect(result.statusCode).toBe(200);
    expect(result.indexable).toBe(true);
    expect(result.title).toBe('Accueil Example');
    expect(result.canonical).toBe('https://example.com/');
    expect(result.hasStructuredData).toBe(true);
  });

  it('enrichit chaque URL analysée avec un objet aiSignals complet', async () => {
    const service = buildService();

    const [result] = await service.analyzeUrls(['https://example.com/'], {
      robotsTxt: 'User-agent: GPTBot\nDisallow: /\n\nUser-agent: *\nAllow: /\n',
    });

    expect(result.aiSignals).toBeDefined();
    expect(result.aiSignals?.llmsTxt).toBeNull();

    const botsAccess = result.aiSignals?.aiBotsAccess;
    expect(botsAccess).toBeDefined();
    expect(botsAccess?.gptBot).toBe('disallowed');
    expect(botsAccess?.claudeBot).toBe('allowed');
    expect(botsAccess?.xRobotsNoAi).toBe(false);

    const citation = result.aiSignals?.citationWorthiness;
    expect(citation).toBeDefined();
    expect(citation?.hasAuthor).toBe(true);
    expect(citation?.hasDates).toBe(true);
    expect(citation?.hasFacts).toBe(true);
    expect(citation?.hasSources).toBe(true);
    expect(citation?.score).toBeGreaterThan(0);
  });

  it('par défaut (robotsTxt absent), considère les bots connus en unknown', async () => {
    const service = buildService();

    const [result] = await service.analyzeUrls(['https://example.com/']);

    expect(result.aiSignals?.aiBotsAccess.gptBot).toBe('unknown');
  });

  it("retourne aiSignals null quand l'URL est en erreur", async () => {
    const safeFetch = {
      fetchText: jest.fn().mockRejectedValue(new Error('boom')),
      fetchHeaders: jest.fn(),
    } as unknown as jest.Mocked<SafeFetchService>;
    const service = buildService({ safeFetch });

    const [result] = await service.analyzeUrls(['https://example.com/']);

    expect(result.error).toBe('Error: boom');
    expect(result.aiSignals).toBeNull();
  });
});
