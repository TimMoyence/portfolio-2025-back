import type { AuditSnapshot } from '../../domain/AuditProcessing';
import type { ExpertReportSynthesis } from '../../domain/AuditReportTiers';
import {
  buildAuditSnapshot,
  buildClientReportConforme,
  buildEngineCoverage,
  buildExpertReportConforme,
  buildPageAnalysee,
} from '../../../../../test/factories/audit-requests.factory';
import { couvertureRendue } from '../../../../../test/helpers/couverture-de-pdf';
import { htmlEmis } from '../../../../common/domain/texte/html-escape.util';
import { AuditReportHtmlRendererService } from './audit-report-html-renderer.service';

describe('AuditReportHtmlRendererService', () => {
  let service: AuditReportHtmlRendererService;

  const buildAudit = (overrides: Partial<AuditSnapshot> = {}): AuditSnapshot =>
    buildAuditSnapshot({
      websiteName: 'Acme Corp',
      finalUrl: 'https://acme.com',
      keyChecks: {
        llmsTxt: { present: true, url: 'https://acme.com/llms.txt' },
      },
      engineCoverage: buildEngineCoverage(),
      createdAt: new Date('2026-04-15T10:00:00Z'),
      ...overrides,
    });

  const buildExpertReport = (
    overrides: Partial<ExpertReportSynthesis> = {},
  ): ExpertReportSynthesis => ({
    ...buildExpertReportConforme(),
    ...overrides,
  });

  beforeEach(() => {
    service = new AuditReportHtmlRendererService();
  });

  const rendu = (
    ...rapport: Parameters<AuditReportHtmlRendererService['render']>
  ): string => htmlEmis(service.render(...rapport));

  const rendre = (expert: ExpertReportSynthesis = buildExpertReport()) =>
    rendu(buildAudit(), buildClientReportConforme(), expert);

  it('produit un document HTML complet avec toutes les sections principales', () => {
    const html = rendre();

    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<html');
    expect(html).toContain('</html>');
    expect(html).toContain('Rapport Growth Audit');
    expect(html).toContain('Acme Corp');
    expect(html).toContain('Asili Design');
    expect(html).toContain(
      'Audit complet finalise avec 3 leviers prioritaires et un plan de 30 jours.',
    );
    expect(html).toContain('Planifier un appel de 30 minutes');
    expect(html).toContain('Citabilite IA');
    expect(html).toContain('Analyse expert');
    expect(html).toContain('Meta descriptions dupliquees');
    expect(html).toContain('Deployer llms.txt');
    expect(html).toContain('Client reactif');
    expect(html).toContain('https://acme.com/pricing');
    expect(html).toContain('Pricing page');
    expect(html).toContain('Pas de FAQ schema');
    expect(html).toContain('Ajouter FAQPage JSON-LD');
    expect(html).toContain('llms.txt');
  });

  it.each([
    [
      'avec son URL finale',
      'https://acme.com',
      '<p class="cover-date">15 avril 2026</p><p class="cover-url">https://acme.com</p>',
    ],
    ['sans URL finale', null, '<p class="cover-date">15 avril 2026</p>'],
  ])('rend la couverture du rapport %s', (_cas, finalUrl, meta) => {
    const html = rendu(
      buildAudit({ websiteName: 'Acme & Co', finalUrl }),
      buildClientReportConforme(),
      buildExpertReport(),
    );

    expect(couvertureRendue(html)).toBe(
      '<section class="page cover"><div class="cover-gradient">' +
        '<div class="cover-shape cover-shape-1"></div><div class="cover-shape cover-shape-2"></div>' +
        '</div><div class="cover-content">' +
        '<p class="cover-eyebrow">Asili Design — Growth Audit</p>' +
        '<h1 class="cover-title">Rapport Growth Audit</h1>' +
        '<p class="cover-subtitle">Acme &amp; Co</p>' +
        `<div class="cover-meta">${meta}</div></div>` +
        '<footer class="cover-footer"><span>asilidesign.fr</span><span>•</span>' +
        '<span>Rapport genere automatiquement</span></footer></section>',
    );
  });

  it('nomme le statut de chaque pilier Critique, À améliorer ou Objectif atteint, face à sa cible affichée', () => {
    const html = rendu(
      buildAudit(),
      {
        ...buildClientReportConforme(),
        pillarScorecard: [
          { pillar: 'Indexabilite', score: 40, target: 90 },
          { pillar: 'Citation', score: 60, target: 70 },
          { pillar: 'Structure', score: 72, target: 70 },
        ],
      },
      buildExpertReport(),
    );

    expect(
      [...html.matchAll(/<p class="pillar-status">([^<]*)<\/p>/g)].map(
        ([, libelle]) => libelle,
      ),
    ).toEqual(['Critique', 'À améliorer', 'Objectif atteint']);
  });

  it('date le rapport et traduit gravité, impact et effort', () => {
    const html = rendre();

    expect(html).toContain('15 avril 2026');
    expect(html).toContain('<span class="severity-badge">Élevé</span>');
    expect(html).toContain('<td class="backlog-impact">Élevé</td>');
    expect(html).toContain('<td class="backlog-effort">Faible</td>');
    expect(html).toContain('Effort : Faible');
  });

  it('echappe les balises HTML injectees dans les chaines LLM', () => {
    const expert = buildExpertReport({
      executiveSummary: '<script>alert(1)</script>',
      internalNotes: '<img src=x onerror=alert(1)>',
    });

    const html = rendre(expert);

    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html).not.toContain('<img src=x onerror=alert(1)>');
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
  });

  it('ne lit pas un llms.txt rangé dans un tableau comme une analyse', () => {
    const html = rendu(
      buildAudit({ keyChecks: { llmsTxt: [{ present: true }] } }),
      buildClientReportConforme(),
      buildExpertReport(),
    );

    expect(html).toContain('Non analyse.');
    expect(html).not.toContain('Statut : Absent');
  });

  it('utilise des page-break-before CSS pour separer les sections', () => {
    const html = rendre();

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

    expect(() => rendre(expert)).not.toThrow();

    const html = rendre(expert);
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('Analyse expert');
  });

  it('echappe les URLs dans les href (& -> &amp;)', () => {
    const expert = buildExpertReport({
      perPageAnalysis: [
        buildPageAnalysee({ url: 'https://acme.com/search?q=a&lang=fr' }),
      ],
    });

    const html = rendre(expert);

    expect(html).toContain('https://acme.com/search?q=a&amp;lang=fr');
    expect(html).not.toContain('https://acme.com/search?q=a&lang=fr');
  });
});
