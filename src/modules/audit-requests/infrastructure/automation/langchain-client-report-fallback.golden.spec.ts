import { silenceNestLogger } from '../../../../../test/helpers/silence-nest-logger';
import { buildAuditAutomationConfig } from '../../../../../test/factories/audit-config.factory';
import { buildClientReportContext } from '../../../../../test/factories/audit-requests.factory';
import type { ClientReportContext } from './langchain-client-report.service';
import { LangchainClientReportService } from './langchain-client-report.service';

describe('LangchainClientReportService — fallback golden (P5.1)', () => {
  silenceNestLogger();

  const service = new LangchainClientReportService(
    buildAuditAutomationConfig({ openAiApiKey: undefined }),
  );

  const generer = (overrides: Partial<ClientReportContext> = {}) =>
    service.generate(buildClientReportContext(overrides));

  it('executiveSummary — businessType portfolio', async () => {
    const result = await generer({ businessType: 'portfolio' });
    expect(result.executiveSummary).toMatchInlineSnapshot(
      `"Audit finalise pour example.com. Point prioritaire (priorite haute) : Meta descriptions manquantes. 2 autres leviers sont identifies dans le rapport. Visibilite Google 62/100, IA 56/100. Contexte portfolio : focus cas clients, temoignages et CTA unique. Un appel de 30 minutes permet de prioriser le plan."`,
    );
  });

  it('executiveSummary — businessType ecommerce', async () => {
    const result = await generer({ businessType: 'ecommerce' });
    expect(result.executiveSummary).toMatchInlineSnapshot(
      `"Audit finalise pour example.com. Point prioritaire (priorite haute) : Meta descriptions manquantes. 2 autres leviers sont identifies dans le rapport. Visibilite Google 62/100, IA 56/100. Contexte e-commerce : focus panier, fiches produits et Core Web Vitals. Un appel de 30 minutes permet de prioriser le plan."`,
    );
  });

  it('executiveSummary — businessType saas EN locale', async () => {
    const result = await generer({ locale: 'en', businessType: 'saas' });
    expect(result.executiveSummary).toMatchInlineSnapshot(
      `"Audit completed for example.com. Priority finding (high priority): Meta descriptions manquantes. 2 other levers are documented in the report. Google visibility 62/100, AI 56/100. SaaS context: focus on pricing, signup and trust signals. A 30-minute call will help prioritize the plan."`,
    );
  });

  it('executiveSummary — businessType unknown (pas de hint)', async () => {
    const result = await generer({ businessType: 'unknown' });
    expect(result.executiveSummary).toMatchInlineSnapshot(
      `"Audit finalise pour example.com. Point prioritaire (priorite haute) : Meta descriptions manquantes. 2 autres leviers sont identifies dans le rapport. Visibilite Google 62/100, IA 56/100.  Un appel de 30 minutes permet de prioriser le plan."`,
    );
  });

  it('executiveSummary — sans findings retourne texte neutre adapte au businessType', async () => {
    const result = await generer({ findings: [], businessType: 'agency' });
    expect(result.executiveSummary).toMatchInlineSnapshot(
      `"Audit finalise pour example.com. Aucun blocage critique detecte. Visibilite Google 62/100, IA 56/100. Contexte agence : focus offres packagees et etudes de cas. Un appel de 30 minutes permet de prioriser les ameliorations fines."`,
    );
  });

  it('topFindings — severity preservee depuis source (P0.1 anti-inflation)', async () => {
    const result = await generer({ businessType: 'portfolio' });
    expect(result.topFindings.map((f) => f.severity)).toEqual([
      'high',
      'medium',
      'low',
    ]);
    expect(result.topFindings[0].title).toBe('Meta descriptions manquantes');
    expect(result.topFindings[2].title).toBe('llms.txt absent');
  });

  it('pillarScorecard — 7 piliers dans l ordre attendu', async () => {
    const result = await generer();
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
    const result = await generer();
    expect(result.googleVsAiMatrix.googleVisibility.score).toBe(62);
    expect(result.googleVsAiMatrix.aiVisibility.score).toBe(56);
  });

  it('quickWins — minimum 3, maximum 5', async () => {
    const result = await generer();
    expect(result.quickWins.length).toBeGreaterThanOrEqual(3);
    expect(result.quickWins.length).toBeLessThanOrEqual(5);
  });

  it('cta — contient les 3 champs obligatoires', async () => {
    const result = await generer();
    expect(result.cta.title.length).toBeGreaterThan(0);
    expect(result.cta.description.length).toBeGreaterThan(0);
    expect(result.cta.actionLabel.length).toBeGreaterThan(0);
  });
});
