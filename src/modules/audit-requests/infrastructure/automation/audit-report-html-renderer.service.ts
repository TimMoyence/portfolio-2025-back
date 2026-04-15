import { Injectable } from '@nestjs/common';
import type { AuditSnapshot } from '../../domain/AuditProcessing';
import type {
  ClientReportSynthesis,
  ExpertReportSynthesis,
  PerPageDetailedAnalysis,
} from '../../domain/AuditReportTiers';
import type { EngineCoverage, EngineScore } from '../../domain/EngineCoverage';
import { pillarLabel } from './shared/pillar-labels.util';

/**
 * Construit le document HTML complet utilise par Puppeteer pour generer le
 * PDF du rapport Growth Audit a partir d'un {@link AuditSnapshot}, d'une
 * {@link ClientReportSynthesis} (tier client) et d'une
 * {@link ExpertReportSynthesis} (tier expert).
 *
 * Le document est organise en 5 blocs A4 :
 *  0. Couverture (gradient bordeaux/or + titre + nom site + date)
 *  1. Section Client (executive summary, matrice Google vs IA, scorecard,
 *     quick wins, CTA)
 *  2. Section Expert (executive summary, cross-page findings, backlog,
 *     internal notes)
 *  3. Fiches pages (1 fiche par {@link PerPageDetailedAnalysis})
 *  4. Annexes (llms.txt, AI bots, liens utiles)
 *
 * Toutes les chaines provenant du LLM sont passees par {@link escapeHtml}
 * pour eviter les injections HTML/XSS dans le rendu Puppeteer.
 */
@Injectable()
export class AuditReportHtmlRendererService {
  /** Couleur d'accent principale Asili (or chaud). */
  private readonly accentGold = '#c9a227';
  /** Couleur bordeaux secondaire Asili. */
  private readonly bordeaux = '#6b1f2a';

  /**
   * Construit le document HTML complet pour un rapport Growth Audit.
   * @param audit Snapshot de l'audit (contient pillarScores, keyChecks, etc.)
   * @param clientReport Synthese tier client (promesse de vente)
   * @param expertReport Synthese tier expert (details techniques)
   */
  render(
    audit: AuditSnapshot,
    clientReport: ClientReportSynthesis,
    expertReport: ExpertReportSynthesis,
  ): string {
    const date = this.formatDate(audit.createdAt);
    const cover = this.renderCover(audit, date);
    const client = this.renderClientSection(clientReport);
    const expert = this.renderExpertSection(expertReport);
    const pages = this.renderPerPageSection(expertReport.perPageAnalysis);
    const annexes = this.renderAnnexes(audit);

    return `<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <title>Rapport Growth Audit — ${this.escapeHtml(audit.websiteName)}</title>
    <style>${this.css()}</style>
  </head>
  <body>
    ${cover}
    ${client}
    ${expert}
    ${pages}
    ${annexes}
  </body>
</html>`;
  }

  /* ------------------------------------------------------------------ */
  /*  Cover                                                              */
  /* ------------------------------------------------------------------ */

  private renderCover(audit: AuditSnapshot, date: string): string {
    return `<section class="page cover">
      <div class="cover-gradient">
        <div class="cover-shape cover-shape-1"></div>
        <div class="cover-shape cover-shape-2"></div>
      </div>
      <div class="cover-content">
        <p class="cover-eyebrow">Asili Design — Growth Audit</p>
        <h1 class="cover-title">Rapport Growth Audit</h1>
        <p class="cover-subtitle">${this.escapeHtml(audit.websiteName)}</p>
        <div class="cover-meta">
          <p class="cover-date">${this.escapeHtml(date)}</p>
          ${audit.finalUrl ? `<p class="cover-url">${this.escapeHtml(audit.finalUrl)}</p>` : ''}
        </div>
      </div>
      <footer class="cover-footer">
        <span>asilidesign.fr</span>
        <span>•</span>
        <span>Rapport genere automatiquement</span>
      </footer>
    </section>`;
  }

  /* ------------------------------------------------------------------ */
  /*  Section 1 — Client                                                 */
  /* ------------------------------------------------------------------ */

  private renderClientSection(report: ClientReportSynthesis): string {
    const matrix = this.renderGoogleAiMatrix(report.googleVsAiMatrix);
    const scorecard = this.renderPillarScorecard(report.pillarScorecard);
    const quickWins = this.renderQuickWins(report.quickWins);
    const findings = this.renderTopFindings(report.topFindings);
    const cta = this.renderCta(report.cta);

    return `<section class="page section section-client">
      ${this.sectionHeader('01', 'Synthese client', 'Votre audit en un coup d\u2019\u0153il')}
      <div class="exec-summary">
        <p>${this.escapeHtml(report.executiveSummary)}</p>
      </div>
      ${matrix}
      ${scorecard}
      ${findings}
      ${quickWins}
      ${cta}
    </section>`;
  }

  private renderGoogleAiMatrix(
    matrix: ClientReportSynthesis['googleVsAiMatrix'],
  ): string {
    return `<div class="matrix">
      <article class="matrix-card">
        <h3 class="matrix-title">Visibilite Google</h3>
        <div class="matrix-score">${matrix.googleVisibility.score}<span class="matrix-score-unit">/100</span></div>
        <p class="matrix-summary">${this.escapeHtml(matrix.googleVisibility.summary)}</p>
      </article>
      <article class="matrix-card">
        <h3 class="matrix-title">Visibilite IA</h3>
        <div class="matrix-score">${matrix.aiVisibility.score}<span class="matrix-score-unit">/100</span></div>
        <p class="matrix-summary">${this.escapeHtml(matrix.aiVisibility.summary)}</p>
      </article>
    </div>`;
  }

  private renderPillarScorecard(
    scorecard: ClientReportSynthesis['pillarScorecard'],
  ): string {
    if (!scorecard.length) return '';
    const cards = scorecard
      .map((pillar) => {
        const statusClass = `pillar-${pillar.status}`;
        return `<article class="pillar-card ${statusClass}">
          <p class="pillar-name">${this.escapeHtml(pillarLabel(pillar.pillar))}</p>
          <p class="pillar-score">${pillar.score}<span class="pillar-target"> / ${pillar.target}</span></p>
          <p class="pillar-status">${this.statusLabel(pillar.status)}</p>
        </article>`;
      })
      .join('');
    return `<div class="scorecard">
      <h3 class="subsection-title">Scorecard 7 piliers</h3>
      <div class="pillar-grid">${cards}</div>
    </div>`;
  }

  private renderTopFindings(
    findings: ClientReportSynthesis['topFindings'],
  ): string {
    if (!findings.length) return '';
    const items = findings
      .map(
        (f) => `<li class="finding finding-${f.severity}">
        <p class="finding-title">${this.escapeHtml(f.title)}</p>
        <p class="finding-impact">${this.escapeHtml(f.impact)}</p>
      </li>`,
      )
      .join('');
    return `<div class="findings">
      <h3 class="subsection-title">Top constats</h3>
      <ul class="finding-list">${items}</ul>
    </div>`;
  }

  private renderQuickWins(
    quickWins: ClientReportSynthesis['quickWins'],
  ): string {
    if (!quickWins.length) return '';
    const items = quickWins
      .map(
        (qw) => `<article class="quickwin">
        <p class="quickwin-title">${this.escapeHtml(qw.title)}</p>
        <p class="quickwin-impact">${this.escapeHtml(qw.businessImpact)}</p>
        <p class="quickwin-effort">Effort : ${this.effortLabel(qw.effort)}</p>
      </article>`,
      )
      .join('');
    return `<div class="quickwins">
      <h3 class="subsection-title">Quick wins prioritaires</h3>
      <div class="quickwin-grid">${items}</div>
    </div>`;
  }

  private renderCta(cta: ClientReportSynthesis['cta']): string {
    return `<div class="cta-card">
      <h3 class="cta-title">${this.escapeHtml(cta.title)}</h3>
      <p class="cta-description">${this.escapeHtml(cta.description)}</p>
      <p class="cta-action">${this.escapeHtml(cta.actionLabel)}</p>
    </div>`;
  }

  /* ------------------------------------------------------------------ */
  /*  Section 2 — Expert                                                 */
  /* ------------------------------------------------------------------ */

  private renderExpertSection(report: ExpertReportSynthesis): string {
    return `<section class="page section section-expert">
      ${this.sectionHeader('02', 'Analyse expert', 'Constats transverses et backlog priorise')}
      <div class="exec-summary">
        <p>${this.escapeHtml(report.executiveSummary)}</p>
      </div>
      ${this.renderCrossPageFindings(report.crossPageFindings)}
      ${this.renderPriorityBacklog(report.priorityBacklog)}
      ${this.renderInternalNotes(report.internalNotes)}
    </section>`;
  }

  private renderCrossPageFindings(
    findings: ExpertReportSynthesis['crossPageFindings'],
  ): string {
    if (!findings.length) {
      return '<p class="empty-state">Aucun constat transverse.</p>';
    }
    const items = findings
      .map((f) => {
        const urls = f.affectedUrls
          .map((u) => `<li class="affected-url">${this.escapeHtml(u)}</li>`)
          .join('');
        return `<article class="cross-finding severity-${f.severity}">
          <header class="cross-finding-header">
            <span class="severity-badge">${this.severityLabel(f.severity)}</span>
            <h4 class="cross-finding-title">${this.escapeHtml(f.title)}</h4>
          </header>
          <p class="cross-finding-cause"><strong>Cause racine :</strong> ${this.escapeHtml(f.rootCause)}</p>
          <p class="cross-finding-remedy"><strong>Correction :</strong> ${this.escapeHtml(f.remediation)}</p>
          ${urls ? `<ul class="affected-urls">${urls}</ul>` : ''}
        </article>`;
      })
      .join('');
    return `<div class="cross-findings">
      <h3 class="subsection-title">Constats transverses</h3>
      ${items}
    </div>`;
  }

  private renderPriorityBacklog(
    backlog: ExpertReportSynthesis['priorityBacklog'],
  ): string {
    if (!backlog.length) {
      return '<p class="empty-state">Backlog vide.</p>';
    }
    const rows = backlog
      .map((item) => {
        const ac = item.acceptanceCriteria
          .map((c) => `<li>${this.escapeHtml(c)}</li>`)
          .join('');
        return `<tr class="backlog-row">
          <td class="backlog-title">${this.escapeHtml(item.title)}</td>
          <td class="backlog-impact">${this.impactLabel(item.impact)}</td>
          <td class="backlog-effort">${this.effortLabel(item.effort)}</td>
          <td class="backlog-ac"><ul>${ac}</ul></td>
        </tr>`;
      })
      .join('');
    return `<div class="backlog">
      <h3 class="subsection-title">Backlog priorise</h3>
      <table class="backlog-table">
        <thead>
          <tr>
            <th>Titre</th>
            <th>Impact</th>
            <th>Effort</th>
            <th>Criteres d'acceptation</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
  }

  private renderInternalNotes(notes: string): string {
    if (!notes || notes.trim() === '') return '';
    return `<div class="internal-notes">
      <h3 class="subsection-title">Notes internes</h3>
      <p>${this.escapeHtml(notes)}</p>
    </div>`;
  }

  /* ------------------------------------------------------------------ */
  /*  Section 3 — Fiches pages                                           */
  /* ------------------------------------------------------------------ */

  private renderPerPageSection(
    pages: ReadonlyArray<PerPageDetailedAnalysis>,
  ): string {
    if (!pages.length) {
      return `<section class="page section section-pages">
        ${this.sectionHeader('03', 'Fiches pages', 'Analyse detaillee par URL')}
        <p class="empty-state">Aucune page analysee.</p>
      </section>`;
    }
    const cards = pages.map((page) => this.renderPageCard(page)).join('');
    return `<section class="page section section-pages">
      ${this.sectionHeader('03', 'Fiches pages', 'Analyse detaillee par URL')}
      ${cards}
    </section>`;
  }

  private renderPageCard(page: PerPageDetailedAnalysis): string {
    const engines = this.renderEngineMiniCards(page.engineScores);
    const issues = page.topIssues.length
      ? `<div class="page-block">
          <h5 class="page-block-title">Top issues</h5>
          <ul>${page.topIssues.map((i) => `<li>${this.escapeHtml(i)}</li>`).join('')}</ul>
        </div>`
      : '';
    const recos = page.recommendations.length
      ? `<div class="page-block">
          <h5 class="page-block-title">Recommandations</h5>
          <ul>${page.recommendations.map((r) => `<li>${this.escapeHtml(r)}</li>`).join('')}</ul>
        </div>`
      : '';
    const evidence = page.evidence.length
      ? `<div class="page-block">
          <h5 class="page-block-title">Evidence</h5>
          <ul>${page.evidence.map((e) => `<li>${this.escapeHtml(e)}</li>`).join('')}</ul>
        </div>`
      : '';
    const safeUrl = this.escapeHtml(page.url);
    return `<article class="page-card">
      <header class="page-card-header">
        <h4 class="page-card-title">${this.escapeHtml(page.title)}</h4>
        <a class="page-card-url" href="${safeUrl}">${safeUrl}</a>
      </header>
      ${engines}
      ${issues}
      ${recos}
      ${evidence}
    </article>`;
  }

  private renderEngineMiniCards(coverage: EngineCoverage): string {
    const engines: Array<{ label: string; score: EngineScore }> = [
      { label: 'Google', score: coverage.google },
      { label: 'Bing / ChatGPT', score: coverage.bingChatGpt },
      { label: 'Perplexity', score: coverage.perplexity },
      { label: 'Gemini', score: coverage.geminiOverviews },
    ];
    const cards = engines
      .map(
        (e) => `<div class="engine-mini">
          <p class="engine-mini-label">${this.escapeHtml(e.label)}</p>
          <p class="engine-mini-score">${e.score.score}</p>
        </div>`,
      )
      .join('');
    return `<div class="engine-grid">${cards}</div>`;
  }

  /* ------------------------------------------------------------------ */
  /*  Section 4 — Annexes                                                */
  /* ------------------------------------------------------------------ */

  private renderAnnexes(audit: AuditSnapshot): string {
    const llmsTxt = this.renderLlmsTxtAnnex(audit.keyChecks);
    return `<section class="page section section-annex">
      ${this.sectionHeader('04', 'Annexes', 'Donnees techniques complementaires')}
      ${llmsTxt}
      <div class="annex-block">
        <h3 class="subsection-title">Liens utiles</h3>
        <ul>
          <li><a href="https://asilidesign.fr/growth-audit">Page Growth Audit</a></li>
          <li><a href="https://asilidesign.fr/contact">Nous contacter</a></li>
        </ul>
      </div>
    </section>`;
  }

  private renderLlmsTxtAnnex(keyChecks: Record<string, unknown>): string {
    const llmsTxt = keyChecks?.llmsTxt;
    if (!llmsTxt || typeof llmsTxt !== 'object') {
      return `<div class="annex-block">
        <h3 class="subsection-title">llms.txt</h3>
        <p>Non analyse.</p>
      </div>`;
    }
    const record = llmsTxt as Record<string, unknown>;
    const present = record.present === true;
    const url = typeof record.url === 'string' ? record.url : null;
    return `<div class="annex-block">
      <h3 class="subsection-title">llms.txt</h3>
      <p>Statut : ${present ? 'Present' : 'Absent'}</p>
      ${url ? `<p>URL : <a href="${this.escapeHtml(url)}">${this.escapeHtml(url)}</a></p>` : ''}
    </div>`;
  }

  /* ------------------------------------------------------------------ */
  /*  Helpers                                                            */
  /* ------------------------------------------------------------------ */

  private sectionHeader(num: string, title: string, subtitle: string): string {
    return `<header class="section-header">
      <span class="section-number">${this.escapeHtml(num)}</span>
      <div>
        <h2 class="section-title">${this.escapeHtml(title)}</h2>
        <p class="section-subtitle">${this.escapeHtml(subtitle)}</p>
      </div>
    </header>`;
  }

  private statusLabel(status: 'critical' | 'warning' | 'ok'): string {
    switch (status) {
      case 'critical':
        return 'Critique';
      case 'warning':
        return 'A surveiller';
      case 'ok':
        return 'OK';
    }
  }

  private severityLabel(
    severity: 'critical' | 'high' | 'medium' | 'low',
  ): string {
    switch (severity) {
      case 'critical':
        return 'Critique';
      case 'high':
        return 'Eleve';
      case 'medium':
        return 'Moyen';
      case 'low':
        return 'Faible';
    }
  }

  private impactLabel(impact: 'high' | 'medium' | 'low'): string {
    switch (impact) {
      case 'high':
        return 'Eleve';
      case 'medium':
        return 'Moyen';
      case 'low':
        return 'Faible';
    }
  }

  private effortLabel(effort: 'high' | 'medium' | 'low'): string {
    switch (effort) {
      case 'high':
        return 'Eleve';
      case 'medium':
        return 'Moyen';
      case 'low':
        return 'Faible';
    }
  }

  private formatDate(date: Date): string {
    try {
      return date.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return date.toISOString();
    }
  }

  /** Echappe les caracteres HTML pour eviter toute injection XSS. */
  private escapeHtml(value: string): string {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  /** Styles CSS embarques pour le rendu Puppeteer A4. */
  private css(): string {
    return `
      :root {
        --accent: ${this.accentGold};
        --accent-dark: #a7831a;
        --bordeaux: ${this.bordeaux};
        --bordeaux-dark: #4a1219;
        --ink: #0c0902;
        --muted: #54524d;
        --line: #e7e5e0;
        --bg: #ffffff;
        --bg-soft: #f7f7f4;
        --critical-bg: #fee2e2;
        --critical-ink: #991b1b;
        --warning-bg: #fef3c7;
        --warning-ink: #92400e;
        --ok-bg: #dcfce7;
        --ok-ink: #166534;
      }
      * { box-sizing: border-box; margin: 0; padding: 0; }
      html, body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI",
          "Helvetica Neue", "Roboto", "Helvetica", Arial, sans-serif;
        color: var(--ink);
        background: var(--bg);
        font-size: 10.5pt;
        line-height: 1.5;
        -webkit-font-smoothing: antialiased;
      }
      a { color: var(--bordeaux); text-decoration: none; }

      .page { position: relative; background: var(--bg); }
      .cover.page { page-break-after: always; }
      .page.section { page-break-before: always; padding-top: 6mm; }
      .page.section:first-of-type { page-break-before: auto; }

      /* ----- Cover ----- */
      .cover {
        margin: -28mm -22mm -24mm -22mm;
        width: 210mm;
        height: 297mm;
        padding: 0;
        display: flex;
        flex-direction: column;
        position: relative;
        overflow: hidden;
        background:
          radial-gradient(circle at 20% 30%, rgba(255,255,255,0.10) 0%, transparent 55%),
          radial-gradient(circle at 80% 80%, rgba(201,162,39,0.20) 0%, transparent 55%),
          linear-gradient(135deg, var(--bordeaux) 0%, var(--bordeaux-dark) 60%, #2a0a0e 100%);
        color: #fff;
      }
      .cover-gradient { position: absolute; inset: 0; }
      .cover-shape {
        position: absolute;
        border-radius: 50%;
        filter: blur(40px);
      }
      .cover-shape-1 {
        width: 260mm; height: 260mm;
        top: -120mm; right: -80mm;
        background: rgba(201,162,39,0.15);
      }
      .cover-shape-2 {
        width: 200mm; height: 200mm;
        bottom: -100mm; left: -80mm;
        background: rgba(107,31,42,0.35);
      }
      .cover-content {
        position: relative;
        z-index: 1;
        padding: 60mm 22mm 22mm;
        flex: 1;
      }
      .cover-eyebrow {
        text-transform: uppercase;
        letter-spacing: 0.15em;
        font-size: 9pt;
        color: var(--accent);
        margin-bottom: 14mm;
      }
      .cover-title {
        font-size: 42pt;
        font-weight: 700;
        line-height: 1.05;
        margin-bottom: 6mm;
        letter-spacing: -0.02em;
      }
      .cover-subtitle {
        font-size: 18pt;
        color: rgba(255,255,255,0.85);
        margin-bottom: 18mm;
      }
      .cover-meta p { margin-bottom: 2mm; font-size: 11pt; opacity: 0.8; }
      .cover-footer {
        position: relative;
        z-index: 1;
        padding: 0 22mm 22mm;
        display: flex;
        gap: 4mm;
        font-size: 9pt;
        opacity: 0.7;
      }

      /* ----- Sections ----- */
      .section-header {
        display: flex;
        align-items: flex-start;
        gap: 6mm;
        margin-bottom: 10mm;
        padding-bottom: 4mm;
        border-bottom: 2px solid var(--accent);
      }
      .section-number {
        font-size: 36pt;
        font-weight: 700;
        color: var(--accent);
        line-height: 1;
      }
      .section-title {
        font-size: 22pt;
        color: var(--bordeaux);
        line-height: 1.1;
        margin-bottom: 1mm;
      }
      .section-subtitle {
        font-size: 11pt;
        color: var(--muted);
      }
      .subsection-title {
        font-size: 13pt;
        color: var(--bordeaux);
        margin: 8mm 0 4mm;
      }
      .exec-summary {
        background: var(--bg-soft);
        border-left: 4px solid var(--accent);
        padding: 5mm 6mm;
        margin-bottom: 8mm;
        font-size: 12pt;
        line-height: 1.6;
      }
      .empty-state {
        color: var(--muted);
        font-style: italic;
        padding: 4mm 0;
      }

      /* ----- Matrix ----- */
      .matrix {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 6mm;
        margin-bottom: 8mm;
      }
      .matrix-card {
        border: 1px solid var(--line);
        border-radius: 4mm;
        padding: 6mm;
      }
      .matrix-title {
        font-size: 11pt;
        color: var(--muted);
        text-transform: uppercase;
        letter-spacing: 0.08em;
        margin-bottom: 3mm;
      }
      .matrix-score {
        font-size: 36pt;
        font-weight: 700;
        color: var(--bordeaux);
        line-height: 1;
      }
      .matrix-score-unit { font-size: 14pt; color: var(--muted); }
      .matrix-summary {
        margin-top: 3mm;
        color: var(--muted);
        font-size: 10pt;
      }

      /* ----- Scorecard ----- */
      .pillar-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 4mm;
      }
      .pillar-card {
        border: 1px solid var(--line);
        border-radius: 3mm;
        padding: 4mm;
      }
      .pillar-card.pillar-critical { background: var(--critical-bg); border-color: var(--critical-ink); }
      .pillar-card.pillar-warning { background: var(--warning-bg); border-color: var(--warning-ink); }
      .pillar-card.pillar-ok { background: var(--ok-bg); border-color: var(--ok-ink); }
      .pillar-name { font-size: 10pt; font-weight: 600; margin-bottom: 2mm; }
      .pillar-score { font-size: 20pt; font-weight: 700; }
      .pillar-target { font-size: 11pt; color: var(--muted); font-weight: 400; }
      .pillar-status { font-size: 9pt; color: var(--muted); }

      /* ----- Findings ----- */
      .findings { margin-bottom: 8mm; }
      .finding-list { list-style: none; }
      .finding {
        padding: 4mm;
        margin-bottom: 3mm;
        border-radius: 3mm;
        border-left: 4px solid var(--muted);
        background: var(--bg-soft);
      }
      .finding-critical { border-left-color: var(--critical-ink); }
      .finding-high { border-left-color: var(--warning-ink); }
      .finding-medium { border-left-color: var(--accent); }
      .finding-title { font-weight: 600; margin-bottom: 1mm; }
      .finding-impact { color: var(--muted); font-size: 10pt; }

      /* ----- Quick wins ----- */
      .quickwin-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 4mm;
      }
      .quickwin {
        border: 1px solid var(--accent);
        background: #fff8e1;
        border-radius: 3mm;
        padding: 4mm;
      }
      .quickwin-title { font-weight: 600; margin-bottom: 2mm; }
      .quickwin-impact { color: var(--muted); font-size: 10pt; margin-bottom: 2mm; }
      .quickwin-effort { font-size: 9pt; color: var(--bordeaux); font-weight: 600; }

      /* ----- CTA ----- */
      .cta-card {
        margin-top: 10mm;
        padding: 8mm;
        border-radius: 4mm;
        background: linear-gradient(135deg, var(--bordeaux) 0%, var(--bordeaux-dark) 100%);
        color: #fff;
        text-align: center;
      }
      .cta-title { font-size: 18pt; margin-bottom: 3mm; }
      .cta-description { opacity: 0.9; margin-bottom: 4mm; }
      .cta-action {
        display: inline-block;
        padding: 3mm 8mm;
        background: var(--accent);
        color: var(--bordeaux-dark);
        border-radius: 2mm;
        font-weight: 700;
      }

      /* ----- Expert: cross findings ----- */
      .cross-finding {
        border: 1px solid var(--line);
        border-radius: 3mm;
        padding: 5mm;
        margin-bottom: 4mm;
      }
      .cross-finding.severity-critical { border-left: 4px solid var(--critical-ink); }
      .cross-finding.severity-high { border-left: 4px solid var(--warning-ink); }
      .cross-finding.severity-medium { border-left: 4px solid var(--accent); }
      .cross-finding.severity-low { border-left: 4px solid var(--muted); }
      .cross-finding-header {
        display: flex;
        gap: 3mm;
        align-items: center;
        margin-bottom: 3mm;
      }
      .severity-badge {
        padding: 1mm 3mm;
        border-radius: 2mm;
        background: var(--bordeaux);
        color: #fff;
        font-size: 9pt;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      .cross-finding-title { font-size: 12pt; }
      .cross-finding-cause, .cross-finding-remedy {
        margin: 2mm 0;
        font-size: 10pt;
      }
      .affected-urls {
        list-style: none;
        margin-top: 3mm;
        padding-left: 0;
      }
      .affected-url {
        font-size: 9pt;
        color: var(--muted);
        font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
      }

      /* ----- Backlog ----- */
      .backlog-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 10pt;
      }
      .backlog-table th, .backlog-table td {
        border: 1px solid var(--line);
        padding: 3mm 4mm;
        text-align: left;
        vertical-align: top;
      }
      .backlog-table th {
        background: var(--bg-soft);
        color: var(--bordeaux);
        font-weight: 600;
      }
      .backlog-title { font-weight: 600; }
      .backlog-ac ul { padding-left: 4mm; font-size: 9pt; color: var(--muted); }

      /* ----- Internal notes ----- */
      .internal-notes {
        margin-top: 8mm;
        padding: 5mm;
        background: #fff8e1;
        border-left: 4px solid var(--accent);
        font-size: 10pt;
      }

      /* ----- Per-page cards ----- */
      .page-card {
        border: 1px solid var(--line);
        border-radius: 3mm;
        padding: 6mm;
        margin-bottom: 6mm;
        page-break-inside: avoid;
      }
      .page-card-header {
        border-bottom: 1px solid var(--line);
        padding-bottom: 3mm;
        margin-bottom: 4mm;
      }
      .page-card-title { font-size: 13pt; color: var(--bordeaux); margin-bottom: 1mm; }
      .page-card-url {
        font-size: 9pt;
        font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
        color: var(--muted);
      }
      .engine-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 3mm;
        margin-bottom: 4mm;
      }
      .engine-mini {
        border: 1px solid var(--line);
        border-radius: 2mm;
        padding: 3mm;
        text-align: center;
      }
      .engine-mini-label { font-size: 9pt; color: var(--muted); margin-bottom: 1mm; }
      .engine-mini-score { font-size: 18pt; font-weight: 700; color: var(--bordeaux); }
      .page-block { margin-top: 4mm; }
      .page-block-title {
        font-size: 10pt;
        font-weight: 600;
        color: var(--bordeaux);
        margin-bottom: 2mm;
      }
      .page-block ul { padding-left: 5mm; font-size: 10pt; }
      .page-block li { margin-bottom: 1mm; }

      /* ----- Annexes ----- */
      .annex-block {
        margin-bottom: 6mm;
        padding: 5mm;
        border: 1px solid var(--line);
        border-radius: 3mm;
      }
      .annex-block ul { padding-left: 5mm; }

      @media print {
        .page { page-break-after: auto; }
        .page.section { page-break-before: always; }
        .page-card { page-break-inside: avoid; }
        a { color: inherit; text-decoration: none; }
      }
    `;
  }
}
