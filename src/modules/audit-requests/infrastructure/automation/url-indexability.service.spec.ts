import { buildAuditAutomationConfig } from '../../../../../test/factories/audit-config.factory';
import { AiHeadersAnalyzerService } from './ai-headers-analyzer.service';
import { CitationWorthinessService } from './citation-worthiness.service';
import { DeepUrlAnalysisService } from './deep-url-analysis.service';
import { HomepageAnalyzerService } from './homepage-analyzer.service';
import { SafeFetchService } from './safe-fetch.service';
import { StructuredDataQualityService } from './structured-data-quality.service';
import { UrlIndexabilityService } from './url-indexability.service';

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

  const buildSafeFetchStub = (
    body = buildHtml(),
    headers: Record<string, string> = { 'x-robots-tag': 'index' },
  ): jest.Mocked<SafeFetchService> => {
    return {
      fetchText: jest.fn().mockResolvedValue({
        requestedUrl: 'https://example.com/',
        finalUrl: 'https://example.com/',
        redirectChain: [],
        statusCode: 200,
        headers,
        body,
        ttfbMs: 120,
        totalMs: 400,
        contentLength: 500,
      }),
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

  const analyserLAccueil = async () => {
    const [result] = await buildService().analyzeUrls(['https://example.com/']);
    return result;
  };

  it('retourne toujours les champs existants (backward compatible)', async () => {
    const result = await analyserLAccueil();

    expect(result.url).toBe('https://example.com/');
    expect(result.statusCode).toBe(200);
    expect(result.indexable).toBe(true);
    expect(result.title).toBe('Accueil Example');
    expect(result.canonical).toBe('https://example.com/');
    expect(result.hasStructuredData).toBe(true);
  });

  it('separe les mots du corps sur tout blanc, tabulation et saut de ligne compris', async () => {
    const safeFetch = buildSafeFetchStub(
      '<html><body><p>un\tdeux\ntrois quatre</p></body></html>',
    );
    const [result] = await buildService({ safeFetch }).analyzeUrls([
      'https://example.com/',
    ]);

    expect(result.wordCount).toBe(4);
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

  const lirePageEtAccueil = async (html: string) => {
    const safeFetch = buildSafeFetchStub(html);
    const [page] = await buildService({ safeFetch }).analyzeUrls([
      'https://example.com/',
    ]);
    const accueil = new HomepageAnalyzerService().analyze(
      await safeFetch.fetchText('https://example.com/'),
    );
    return { page, accueil };
  };

  it("lit les signaux d'une page comme l'analyse de l'accueil : textes trimés, vides à null", async () => {
    const { page, accueil } = await lirePageEtAccueil(
      '<html lang=" "><head><title> T </title>' +
        '<meta name="robots" content="  NOINDEX, follow  ">' +
        '<meta name="description" content="   "></head><body></body></html>',
    );

    expect(page).toMatchObject({
      robotsMeta: 'NOINDEX, follow',
      metaDescription: null,
      htmlLang: null,
      indexable: false,
    });
    expect(
      Object.fromEntries(
        Object.entries(page).filter(([champ]) => champ in accueil),
      ),
    ).toEqual(accueil);
  });

  it('garde les attributs non vides, trimés, de chaque balise lue, à l accueil comme sur une page', async () => {
    const { page, accueil } = await lirePageEtAccueil(
      '<html><head>' +
        '<link rel="canonical" href=" https://a.fr/ "><link rel="canonical" href="  ">' +
        '<meta property="og:title"><meta property="og:image ">' +
        '<meta property="og:url" content="https://a.fr/"><meta property="  ">' +
        '<meta name="twitter:card"><meta name="twitter:site ">' +
        '</head></html>',
    );
    const attendus = {
      canonicalUrls: ['https://a.fr/'],
      openGraphTags: ['og:title', 'og:image', 'og:url'],
      twitterTags: ['twitter:card', 'twitter:site'],
    };

    expect(page).toMatchObject(attendus);
    expect(accueil).toMatchObject(attendus);
  });

  it('compte un JSON-LD malformé au lieu de l avaler en silence', async () => {
    const safeFetch = buildSafeFetchStub(
      '<html><head>' +
        '<script type="application/ld+json">{"@type": "Article",</script>' +
        '<script type="application/ld+json">{"@type":"Course"}</script>' +
        '</head><body></body></html>',
    );
    const [result] = await buildService({ safeFetch }).analyzeUrls([
      'https://example.com/',
    ]);

    expect(result.aiSignals?.structuredDataQuality).toMatchObject({
      total: 1,
      malformedBlocks: 1,
    });
  });

  const analyserLaPage = async (
    head: string,
    headers?: Record<string, string>,
  ) => {
    const safeFetch = buildSafeFetchStub(
      `<html><head>${head}</head><body></body></html>`,
      headers,
    );
    const [result] = await buildService({ safeFetch }).analyzeUrls([
      'https://example.com/',
    ]);
    return result;
  };

  it('compte comme illisible un JSON-LD qui n est pas un objet', async () => {
    const result = await analyserLaPage(
      ['null', '"texte"', '42', '[1, {"@type":"Course"}]']
        .map((brut) => `<script type="application/ld+json">${brut}</script>`)
        .join(''),
    );

    expect(result.aiSignals?.structuredDataQuality).toMatchObject({
      total: 1,
      types: ['Course'],
      malformedBlocks: 4,
    });
  });

  it('lit une page dont le JSON-LD porte un @type hostile sans la mettre en erreur', async () => {
    const result = await analyserLaPage(
      '<script type="application/ld+json">{"@type":"constructor"}</script>',
    );

    expect(result).toMatchObject({ statusCode: 200, error: null });
    expect(result.aiSignals?.structuredDataQuality.types).toEqual([
      'constructor',
    ]);
  });

  it.each([
    ['la balise robots en capitales', '<meta name="Robots" content="noindex">'],
    ['la directive none', '<meta name="robots" content="none">'],
    [
      'une directive propre à un robot',
      '<meta name="robots" content="googlebot: noindex, follow">',
    ],
    [
      'une seconde balise robots, que Google additionne à la première',
      '<meta name="robots" content="index, follow, max-image-preview:large">' +
        '<meta name="robots" content="noindex">',
    ],
    [
      'une balise googlebot à côté de la balise robots, l exemple de Google',
      '<meta name="robots" content="nofollow"><meta name="googlebot" content="noindex">',
    ],
    [
      'une balise googlebot seule',
      '<meta name="Googlebot" content="noindex, nofollow">',
    ],
    [
      'des directives séparées par une espace',
      '<meta name="robots" content="noindex nofollow">',
    ],
    [
      'des directives séparées par un point-virgule',
      '<meta name="robots" content="noindex;nofollow">',
    ],
    [
      'des directives séparées par une barre oblique',
      '<meta name="robots" content="NOINDEX/NOFOLLOW">',
    ],
  ])('lit une page non indexable par %s', async (_forme, head) => {
    const result = await analyserLaPage(head);
    const constats = new DeepUrlAnalysisService()
      .analyze([result])
      .findings.map((constat) => constat.code);

    expect([result.indexable, constats.includes('noindex_conflicts')]).toEqual([
      false,
      true,
    ]);
  });

  it.each([
    'none',
    'googlebot: noindex',
    'NoIndex, nofollow',
    'noindex nofollow',
  ])(
    'lit une page non indexable par l en-tête x-robots-tag « %s »',
    async (xRobotsTag) => {
      const result = await analyserLaPage('', { 'x-robots-tag': xRobotsTag });

      expect(result.indexable).toBe(false);
    },
  );

  it('garde indexable une page dont seul l aperçu d image vaut none, ou qui n interdit que l indexation des images', async () => {
    const result = await analyserLaPage(
      '<meta name="robots" content="max-image-preview:none, noimageindex">' +
        '<meta name="googlebot" content="max-image-preview : none nofollow">',
      { 'x-robots-tag': 'max-image-preview: none' },
    );

    expect(result.indexable).toBe(true);
  });

  it.each([
    [
      'robots puis googlebot',
      '<meta name="robots" content=" nofollow "><meta name="robots" content="">' +
        '<meta name="googlebot" content="noindex">',
      'nofollow, noindex',
    ],
    [
      'googlebot puis robots',
      '<meta name="googlebot" content="noindex"><meta name="robots" content="">' +
        '<meta name="robots" content=" nofollow ">',
      'noindex, nofollow',
    ],
  ])(
    'rend les directives de chaque balise robots et googlebot, dans l ordre de la page (%s)',
    async (_ordre, balises, directives) => {
      const result = await analyserLaPage(balises);

      expect(result.robotsMeta).toBe(directives);
    },
  );

  it('lit les noms de meta et les rel de lien quelle que soit leur casse, comme HTML', async () => {
    const result = await analyserLaPage(
      '<meta name="ROBOTS" content="noindex"><meta name="Description" content="Résumé">' +
        '<link rel="Canonical" href="https://a.fr/">' +
        '<meta name="Twitter:card" content="summary">',
    );

    expect(result).toMatchObject({
      robotsMeta: 'noindex',
      metaDescription: 'Résumé',
      canonicalUrls: ['https://a.fr/'],
      twitterTags: ['Twitter:card'],
    });
  });

  it('par défaut (robotsTxt absent), considère les bots connus en unknown', async () => {
    const result = await analyserLAccueil();

    expect(result.aiSignals?.aiBotsAccess.gptBot).toBe('unknown');
  });

  it("retourne aiSignals null quand l'URL est en erreur", async () => {
    const safeFetch = {
      fetchText: jest.fn().mockRejectedValue(new Error('boom')),
    } as unknown as jest.Mocked<SafeFetchService>;
    const service = buildService({ safeFetch });

    const [result] = await service.analyzeUrls(['https://example.com/']);

    expect(result.error).toBe('Error: boom');
    expect(result.aiSignals).toBeNull();
  });
});
