/**
 * Golden test P5.1 — gèle le comportement du fallback déterministe de
 * LangchainClientReportService pour éviter toute régression qualité
 * pendant les refactors P5.2/P5.3.
 *
 * Stratégie :
 * - Force le fallback (openAiApiKey: undefined) pour rester déterministe.
 * - 4 scenarios représentatifs (portfolio / ecommerce / saas / unknown).
 * - toMatchInlineSnapshot() inline pour diff instantané dans les PRs.
 *
 * Si un snapshot change après refactor P5.2, il faut auditer visuellement
 * le diff — une variation > 5% sur executive summary ou quickWins indique
 * une régression qualité du fallback déterministe.
 */

import { Logger } from '@nestjs/common';
import { buildAuditAutomationConfig } from '../../../../../test/factories/audit-config.factory';
import type {
  ClientReportContext,
  ClientReportFinding,
} from './langchain-client-report.service';
import { LangchainClientReportService } from './langchain-client-report.service';

function baseFindings(): ReadonlyArray<ClientReportFinding> {
  return [
    {
      title: 'Meta descriptions manquantes',
      description: 'Plusieurs pages commerciales sans meta description unique.',
      severity: 'high',
      impact: 'traffic',
    },
    {
      title: 'CTA peu visible au-dessus de la ligne de flottaison',
      description:
        'CTA principal difficile a reperer en moins de 3 secondes sur mobile.',
      severity: 'medium',
      impact: 'conversion',
    },
    {
      title: 'llms.txt absent',
      description: 'Pas de fichier /llms.txt a la racine.',
      severity: 'low',
      impact: 'indexation',
    },
  ];
}

function baseContext(): ClientReportContext {
  return {
    locale: 'fr',
    websiteName: 'example.com',
    normalizedUrl: 'https://example.com',
    pillarScores: {
      seo: 62,
      performance: 55,
      technical: 70,
      trust: 68,
      conversion: 60,
      aiVisibility: 48,
      citationWorthiness: 52,
    },
    findings: baseFindings(),
    quickWins: [
      'Ajouter meta descriptions orientees intention',
      'Deplacer CTA principal above-the-fold',
      'Publier llms.txt a la racine',
    ],
    aggregateAiSignals: null,
    engineCoverage: null,
  };
}

describe('LangchainClientReportService — fallback golden (P5.1)', () => {
  let logSpy: jest.SpyInstance;
  let warnSpy: jest.SpyInstance;

  beforeAll(() => {
    logSpy = jest
      .spyOn(Logger.prototype, 'log')
      .mockImplementation(() => undefined);
    warnSpy = jest
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => undefined);
  });

  afterAll(() => {
    logSpy.mockRestore();
    warnSpy.mockRestore();
  });

  const service = new LangchainClientReportService(
    buildAuditAutomationConfig({ openAiApiKey: undefined }),
  );

  it('executiveSummary — businessType portfolio', async () => {
    const result = await service.generate({
      ...baseContext(),
      businessType: 'portfolio',
    });
    expect(result.executiveSummary).toMatchInlineSnapshot(
      `"Audit finalise pour example.com. Point prioritaire (priorite haute) : Meta descriptions manquantes. 2 autres leviers sont identifies dans le rapport. Visibilite Google 62/100, IA 56/100. Contexte portfolio : focus cas clients, temoignages et CTA unique. Un appel de 30 minutes permet de prioriser le plan."`,
    );
  });

  it('executiveSummary — businessType ecommerce', async () => {
    const result = await service.generate({
      ...baseContext(),
      businessType: 'ecommerce',
    });
    expect(result.executiveSummary).toMatchInlineSnapshot(
      `"Audit finalise pour example.com. Point prioritaire (priorite haute) : Meta descriptions manquantes. 2 autres leviers sont identifies dans le rapport. Visibilite Google 62/100, IA 56/100. Contexte e-commerce : focus panier, fiches produits et Core Web Vitals. Un appel de 30 minutes permet de prioriser le plan."`,
    );
  });

  it('executiveSummary — businessType saas EN locale', async () => {
    const result = await service.generate({
      ...baseContext(),
      locale: 'en',
      businessType: 'saas',
    });
    expect(result.executiveSummary).toMatchInlineSnapshot(
      `"Audit completed for example.com. Priority finding (high priority): Meta descriptions manquantes. 2 other levers are documented in the report. Google visibility 62/100, AI 56/100. SaaS context: focus on pricing, signup and trust signals. A 30-minute call will help prioritize the plan."`,
    );
  });

  it('executiveSummary — businessType unknown (pas de hint)', async () => {
    const result = await service.generate({
      ...baseContext(),
      businessType: 'unknown',
    });
    expect(result.executiveSummary).toMatchInlineSnapshot(
      `"Audit finalise pour example.com. Point prioritaire (priorite haute) : Meta descriptions manquantes. 2 autres leviers sont identifies dans le rapport. Visibilite Google 62/100, IA 56/100.  Un appel de 30 minutes permet de prioriser le plan."`,
    );
  });

  it('executiveSummary — sans findings retourne texte neutre adapte au businessType', async () => {
    const result = await service.generate({
      ...baseContext(),
      findings: [],
      businessType: 'agency',
    });
    expect(result.executiveSummary).toMatchInlineSnapshot(
      `"Audit finalise pour example.com. Aucun blocage critique detecte. Visibilite Google 62/100, IA 56/100. Contexte agence : focus offres packagees et etudes de cas. Un appel de 30 minutes permet de prioriser les ameliorations fines."`,
    );
  });

  it('topFindings — severity preservee depuis source (P0.1 anti-inflation)', async () => {
    const result = await service.generate({
      ...baseContext(),
      businessType: 'portfolio',
    });
    // Les findings sont tries par severity desc : high, medium, low
    expect(result.topFindings.map((f) => f.severity)).toEqual([
      'high',
      'medium',
      'low',
    ]);
    expect(result.topFindings[0].title).toBe('Meta descriptions manquantes');
    expect(result.topFindings[2].title).toBe('llms.txt absent');
  });

  it('pillarScorecard — 7 piliers dans l ordre attendu', async () => {
    const result = await service.generate(baseContext());
    expect(result.pillarScorecard.map((p) => p.pillar)).toEqual([
      'seo',
      'performance',
      'technical',
      'trust',
      'conversion',
      'aiVisibility',
      'citationWorthiness',
    ]);
  });

  it('googleVsAiMatrix — scores moyennes des piliers correspondants', async () => {
    const result = await service.generate(baseContext());
    // Google average : (seo 62 + performance 55 + technical 70) / 3 = 62.33 → 62
    expect(result.googleVsAiMatrix.googleVisibility.score).toBe(62);
    // AI average : (aiVisibility 48 + citationWorthiness 52 + trust 68) / 3 = 56
    expect(result.googleVsAiMatrix.aiVisibility.score).toBe(56);
  });

  it('quickWins — minimum 3, maximum 5', async () => {
    const result = await service.generate(baseContext());
    expect(result.quickWins.length).toBeGreaterThanOrEqual(3);
    expect(result.quickWins.length).toBeLessThanOrEqual(5);
  });

  it('cta — contient les 3 champs obligatoires', async () => {
    const result = await service.generate(baseContext());
    expect(result.cta.title.length).toBeGreaterThan(0);
    expect(result.cta.description.length).toBeGreaterThan(0);
    expect(result.cta.actionLabel.length).toBeGreaterThan(0);
  });
});
