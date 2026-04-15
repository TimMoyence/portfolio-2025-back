import type { AuditSnapshot } from '../../domain/AuditProcessing';
import type {
  ClientReportSynthesis,
  ExpertReportSynthesis,
} from '../../domain/AuditReportTiers';
import type { EngineCoverage, EngineScore } from '../../domain/EngineCoverage';
import { AuditReportHtmlRendererService } from './audit-report-html-renderer.service';

/**
 * Suite de tests pour {@link AuditReportHtmlRendererService}.
 * Verifie que le HTML produit contient toutes les sections requises,
 * echappe correctement les chaines LLM et gere les edge cases.
 */
describe('AuditReportHtmlRendererService', () => {
  let service: AuditReportHtmlRendererService;

  const buildEngineScore = (
    engine: EngineScore['engine'],
    overrides: Partial<EngineScore> = {},
  ): EngineScore => ({
    engine,
    score: 72,
    indexable: true,
    strengths: ['clear titles'],
    blockers: [],
    opportunities: ['add FAQ schema'],
    ...overrides,
  });

  const buildEngineCoverage = (): EngineCoverage => ({
    google: buildEngineScore('google'),
    bingChatGpt: buildEngineScore('bing_chatgpt'),
    perplexity: buildEngineScore('perplexity'),
    geminiOverviews: buildEngineScore('gemini_overviews'),
  });

  const buildAudit = (overrides: Partial<AuditSnapshot> = {}): AuditSnapshot =>
    ({
      id: 'audit-1',
      requestId: 'req-1',
      websiteName: 'Acme Corp',
      contactMethod: 'EMAIL',
      contactValue: 'contact@acme.com',
      locale: 'fr' as AuditSnapshot['locale'],
      done: true,
      processingStatus: 'COMPLETED',
      progress: 100,
      step: null,
      error: null,
      normalizedUrl: 'https://acme.com',
      finalUrl: 'https://acme.com',
      redirectChain: [],
      keyChecks: {
        llmsTxt: { present: true, url: 'https://acme.com/llms.txt' },
      },
      quickWins: [],
      pillarScores: {},
      summaryText: null,
      fullReport: null,
      engineCoverage: buildEngineCoverage(),
      createdAt: new Date('2026-04-15T10:00:00Z'),
      updatedAt: new Date('2026-04-15T10:00:00Z'),
      startedAt: new Date('2026-04-15T10:00:00Z'),
      finishedAt: new Date('2026-04-15T10:10:00Z'),
      ...overrides,
    }) as AuditSnapshot;

  const buildClientReport = (): ClientReportSynthesis => ({
    executiveSummary: 'Votre site est indexable mais peu cite par les IA.',
    topFindings: [
      {
        title: 'Pas de llms.txt',
        impact: 'Perte de visibilite sur ChatGPT',
        severity: 'high',
      },
    ],
    googleVsAiMatrix: {
      googleVisibility: { score: 78, summary: 'Bonne base Google' },
      aiVisibility: { score: 42, summary: 'Faible exposition IA' },
    },
    pillarScorecard: [
      { pillar: 'Indexabilite', score: 80, target: 90, status: 'warning' },
      { pillar: 'Citation', score: 35, target: 70, status: 'critical' },
    ],
    quickWins: [
      {
        title: 'Ajouter un llms.txt',
        businessImpact: '+15% visibilite IA',
        effort: 'low',
      },
    ],
    cta: {
      title: 'Planifier un appel',
      description: 'Discutons des prochaines etapes',
      actionLabel: 'Reserver un creneau',
    },
  });

  const buildExpertReport = (
    overrides: Partial<ExpertReportSynthesis> = {},
  ): ExpertReportSynthesis => ({
    executiveSummary: 'Analyse expert: 2 pages auditees, 4 blockers critiques.',
    perPageAnalysis: [
      {
        url: 'https://acme.com/pricing',
        title: 'Pricing page',
        engineScores: buildEngineCoverage(),
        topIssues: ['Pas de FAQ schema', 'H1 manquant'],
        recommendations: ['Ajouter FAQPage JSON-LD', 'Ajouter un H1 clair'],
        evidence: ['DOM ne contient pas <h1>'],
      },
    ],
    crossPageFindings: [
      {
        title: 'Meta descriptions dupliquees',
        severity: 'high',
        affectedUrls: ['https://acme.com/a', 'https://acme.com/b'],
        rootCause: 'Template CMS utilise le meme modele',
        remediation: 'Generer des meta descriptions dynamiques',
      },
    ],
    priorityBacklog: [
      {
        title: 'Deployer llms.txt',
        impact: 'high',
        effort: 'low',
        acceptanceCriteria: ['Fichier accessible en HTTP 200'],
      },
    ],
    clientEmailDraft: {
      subject: 'Votre audit Growth Audit',
      body: 'Bonjour,\n\nVoici les resultats.',
    },
    internalNotes: 'Client reactif, CMS WordPress standard',
    ...overrides,
  });

  beforeEach(() => {
    service = new AuditReportHtmlRendererService();
  });

  it('produit un document HTML complet avec toutes les sections principales', () => {
    const html = service.render(
      buildAudit(),
      buildClientReport(),
      buildExpertReport(),
    );

    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<html');
    expect(html).toContain('</html>');
    // Cover page
    expect(html).toContain('Rapport Growth Audit');
    expect(html).toContain('Acme Corp');
    expect(html).toContain('Asili Design');
    // Section client
    expect(html).toContain(
      'Votre site est indexable mais peu cite par les IA.',
    );
    expect(html).toContain('Planifier un appel');
    expect(html).toContain('Indexabilite');
    // Section expert
    expect(html).toContain('Analyse expert');
    expect(html).toContain('Meta descriptions dupliquees');
    expect(html).toContain('Deployer llms.txt');
    expect(html).toContain('Client reactif');
    // Fiches pages
    expect(html).toContain('https://acme.com/pricing');
    expect(html).toContain('Pricing page');
    expect(html).toContain('Pas de FAQ schema');
    expect(html).toContain('Ajouter FAQPage JSON-LD');
    // Annexes
    expect(html).toContain('llms.txt');
  });

  it('echappe les balises HTML injectees dans les chaines LLM', () => {
    const expert = buildExpertReport({
      executiveSummary: '<script>alert(1)</script>',
      internalNotes: '<img src=x onerror=alert(1)>',
    });

    const html = service.render(buildAudit(), buildClientReport(), expert);

    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html).not.toContain('<img src=x onerror=alert(1)>');
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
  });

  it('utilise des page-break-before CSS pour separer les sections', () => {
    const html = service.render(
      buildAudit(),
      buildClientReport(),
      buildExpertReport(),
    );

    expect(html).toContain('page-break-before');
    expect(html).toContain('page-break-after');
  });

  it('gere un rapport expert avec perPageAnalysis vide sans crasher', () => {
    const expert = buildExpertReport({
      perPageAnalysis: [],
      crossPageFindings: [],
      priorityBacklog: [],
      internalNotes: '',
    });

    expect(() =>
      service.render(buildAudit(), buildClientReport(), expert),
    ).not.toThrow();

    const html = service.render(buildAudit(), buildClientReport(), expert);
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('Analyse expert');
  });

  it('echappe les URLs dans les href (& -> &amp;)', () => {
    const expert = buildExpertReport({
      perPageAnalysis: [
        {
          url: 'https://acme.com/search?q=a&lang=fr',
          title: 'Search page',
          engineScores: buildEngineCoverage(),
          topIssues: [],
          recommendations: [],
          evidence: [],
        },
      ],
    });

    const html = service.render(buildAudit(), buildClientReport(), expert);

    expect(html).toContain('https://acme.com/search?q=a&amp;lang=fr');
    expect(html).not.toContain('https://acme.com/search?q=a&lang=fr');
  });
});
