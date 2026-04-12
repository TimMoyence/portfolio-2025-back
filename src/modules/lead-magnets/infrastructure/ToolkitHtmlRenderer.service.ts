import { Injectable } from '@nestjs/common';
import type {
  CheatsheetEntry,
  PromptEntry,
  TemplateEntry,
  ToolkitContent,
  WorkflowEntry,
} from '../domain/ToolkitContent';

/**
 * Construit le document HTML complet utilise par Puppeteer pour generer le
 * PDF du guide IA personnalise. Toute la mise en page est faite en CSS
 * (grille, flex, variables, typographie systeme) — aucune coordonnee manuelle.
 *
 * Le document est organise en 6 sections paginees A4 :
 *  0. Couverture (gradient + titre serif + badges profil)
 *  1. Page "Pourquoi ce guide" avec stats solopreneurs 2026
 *  2. Cheatsheet (16 outils par categorie, chips couleur)
 *  3. Prompts (cartes enrichies avec description, example, tip)
 *  4. Workflows (etapes numerotees + chips outils)
 *  5. Templates (grille, bordure couleur plateforme)
 *  6. Prompt genere (optionnel, sur mesure)
 */
@Injectable()
export class ToolkitHtmlRendererService {
  /** Couleur d'accent Asili. */
  private readonly accent = '#4fb3a2';

  /**
   * Palette de couleurs par categorie d outils / prompts.
   * Ces cles sont normalisees (lowercase, sans accents) avant lookup.
   */
  private readonly categoryColors: Record<
    string,
    { bg: string; text: string; border: string }
  > = {
    'recherche & veille': { bg: '#e0f0fe', text: '#0b5394', border: '#3b82f6' },
    'creation de contenu': {
      bg: '#f3e8ff',
      text: '#6b21a8',
      border: '#a855f7',
    },
    automatisation: { bg: '#ffedd5', text: '#9a3412', border: '#f97316' },
    'prospection & vente': {
      bg: '#fce7f3',
      text: '#9d174d',
      border: '#ec4899',
    },
    productivite: { bg: '#dcfce7', text: '#166534', border: '#22c55e' },
    // prompts
    prospection: { bg: '#fce7f3', text: '#9d174d', border: '#ec4899' },
    contenu: { bg: '#f3e8ff', text: '#6b21a8', border: '#a855f7' },
    'site web': { bg: '#e0f0fe', text: '#0b5394', border: '#3b82f6' },
    'gestion client': { bg: '#dcfce7', text: '#166534', border: '#22c55e' },
  };

  /** Couleurs des plateformes de templates. */
  private readonly platformColors: Record<string, string> = {
    notion: '#0f172a',
    zapier: '#ff4a00',
    make: '#6d28d9',
  };

  /** Construit le document HTML complet pour un contenu de toolkit. */
  render(content: ToolkitContent): string {
    const date = new Date().toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const cover = this.renderCover(content, date);
    const stats = this.renderStatsPage();
    const cheatsheet = this.renderCheatsheet(content.cheatsheet);
    const prompts = this.renderPrompts(content.prompts);
    const workflows = this.renderWorkflows(content.workflows);
    const templates = this.renderTemplates(content.templates);
    const generated = content.generatedPrompt
      ? this.renderGeneratedPrompt(content.generatedPrompt)
      : '';

    return `<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <title>Guide IA personnalisé — Solopreneurs</title>
    <style>${this.css()}</style>
  </head>
  <body>
    ${cover}
    ${stats}
    ${cheatsheet}
    ${prompts}
    ${workflows}
    ${templates}
    ${generated}
  </body>
</html>`;
  }

  /* ------------------------------------------------------------------ */
  /*  Sections                                                           */
  /* ------------------------------------------------------------------ */

  /** Page de couverture: titre serif, gradient deco, badges profil. */
  private renderCover(content: ToolkitContent, date: string): string {
    const recap = content.recap;
    const firstName = this.escape(recap.firstName);
    const badges: string[] = [];
    if (recap.aiLevel) {
      badges.push(
        `<span class="badge"><span class="badge-label">Niveau IA</span><span class="badge-value">${this.escape(this.levelLabel(recap.aiLevel))}</span></span>`,
      );
    }
    if (recap.sector) {
      badges.push(
        `<span class="badge"><span class="badge-label">Secteur</span><span class="badge-value">${this.escape(recap.sector)}</span></span>`,
      );
    }
    if (recap.budgetTier) {
      badges.push(
        `<span class="badge"><span class="badge-label">Budget</span><span class="badge-value">${this.escape(recap.budgetTier)} €/mois</span></span>`,
      );
    }
    const badgesHtml = badges.length
      ? `<div class="badges">${badges.join('')}</div>`
      : '';

    return `<section class="page cover">
      <div class="cover-gradient">
        <div class="cover-shape cover-shape-1"></div>
        <div class="cover-shape cover-shape-2"></div>
        <div class="cover-shape cover-shape-3"></div>
      </div>
      <div class="cover-content">
        <p class="cover-eyebrow">🚀 Asili Design — Guide personnalisé</p>
        <h1 class="cover-title">L'IA au service<br/>des solopreneurs</h1>
        <p class="cover-subtitle">Votre boîte à outils sur mesure pour transformer votre activité avec l'IA en 2026.</p>
        <div class="cover-meta">
          <p class="cover-prepared">Préparé pour <strong>${firstName}</strong></p>
          <p class="cover-date">${this.escape(date)}</p>
        </div>
        ${badgesHtml}
      </div>
      <footer class="cover-footer">
        <span>asilidesign.fr</span>
        <span>•</span>
        <span>Guide généré sur mesure</span>
        <span>•</span>
        <span>Édition 2026</span>
      </footer>
    </section>`;
  }

  /** Page "Pourquoi ce guide ?" avec stats solopreneurs. */
  private renderStatsPage(): string {
    return `<section class="page section stats-page">
      ${this.sectionHeader('00', 'Pourquoi ce guide ?', 'Les chiffres qui changent tout en 2026')}
      <div class="stats-intro">
        <p>L'IA n'est plus un gadget : elle redéfinit ce qu'un solopreneur peut accomplir seul. Les chiffres 2026 parlent d'eux-mêmes.</p>
      </div>
      <div class="stats-grid">
        <article class="stat-card">
          <div class="stat-number">74<span class="stat-percent">%</span></div>
          <p class="stat-label">des solopreneurs scalent leur activité sans embaucher grâce à l'IA</p>
        </article>
        <article class="stat-card">
          <div class="stat-number">64<span class="stat-percent">%</span></div>
          <p class="stat-label">affirment que leur business n'aurait pas grandi sans l'IA</p>
        </article>
        <article class="stat-card">
          <div class="stat-number">91<span class="stat-percent">%</span></div>
          <p class="stat-label">constatent une réduction significative de leur charge administrative</p>
        </article>
        <article class="stat-card highlight">
          <div class="stat-number">2-4<span class="stat-percent">h</span></div>
          <p class="stat-label">économisées par semaine grâce aux workflows automatisés</p>
        </article>
      </div>
      <div class="stats-promise">
        <p class="stats-promise-title">Ce que vous allez trouver dans ce guide</p>
        <ul class="stats-promise-list">
          <li><strong>16 outils IA</strong> à jour avril 2026, avec prix, arbre de décision et astuce d'utilisation</li>
          <li><strong>15 prompts professionnels</strong> structurés (contexte / instructions / format / ton) prêts à copier</li>
          <li><strong>3 workflows complets</strong> pas-à-pas pour automatiser prospection, contenu et veille</li>
          <li><strong>8 templates</strong> Notion, Zapier et Make à installer en 5 minutes</li>
        </ul>
      </div>
      ${this.pageFooter()}
    </section>`;
  }

  /** Page cheatsheet: outils groupes par categorie en cartes. */
  private renderCheatsheet(cheatsheet: CheatsheetEntry[]): string {
    if (!cheatsheet.length) return '';

    const byCategory = new Map<string, CheatsheetEntry[]>();
    for (const entry of cheatsheet) {
      const list = byCategory.get(entry.category) ?? [];
      list.push(entry);
      byCategory.set(entry.category, list);
    }

    const groups = Array.from(byCategory.entries())
      .map(([category, tools]) => {
        const palette = this.paletteFor(category);
        const cards = tools
          .map((tool) => this.renderToolCard(tool, palette))
          .join('');
        return `<div class="category">
          <h3 class="category-title" style="color: ${palette.text}; border-left-color: ${palette.border};">${this.escape(category)}</h3>
          <div class="tool-grid">${cards}</div>
        </div>`;
      })
      .join('');

    return `<section class="page section">
      ${this.sectionHeader('01', '🧰 Cheatsheet', 'Vos outils IA sélectionnés')}
      ${groups}
      ${this.pageFooter()}
    </section>`;
  }

  /** Carte individuelle pour un outil dans la cheatsheet. */
  private renderToolCard(
    tool: CheatsheetEntry,
    palette: { bg: string; text: string; border: string },
  ): string {
    const used = tool.alreadyUsed
      ? '<span class="chip chip-used">Déjà utilisé</span>'
      : '<span class="chip chip-new">À découvrir</span>';
    const url = tool.url.replace(/^https?:\/\//, '');
    const decision = tool.decision
      ? `<p class="tool-decision">${this.escape(tool.decision)}</p>`
      : '';
    return `<article class="tool-card" style="border-top: 3px solid ${palette.border};">
      <header class="tool-card-header">
        <h4 class="tool-name">${this.escape(tool.tool)}</h4>
        <span class="tool-price">${this.escape(tool.price)}</span>
      </header>
      <p class="tool-tip">💡 ${this.escape(tool.tip)}</p>
      ${decision}
      <footer class="tool-card-footer">
        <a class="tool-link" href="https://${this.escape(url)}">${this.escape(url)}</a>
        ${used}
      </footer>
    </article>`;
  }

  /** Page prompts avec cartes enrichies (description / code / example / tip). */
  private renderPrompts(prompts: PromptEntry[]): string {
    if (!prompts.length) return '';

    const cards = prompts
      .map((prompt) => {
        const palette = this.paletteFor(prompt.category);
        const description = prompt.description
          ? `<p class="prompt-description">${this.escape(prompt.description)}</p>`
          : '';
        const example = prompt.example
          ? `<div class="prompt-example"><span class="prompt-example-label">Cas d'usage</span><p>${this.escape(prompt.example)}</p></div>`
          : '';
        const tip = prompt.tip
          ? `<div class="prompt-tip"><span class="prompt-tip-label">💡 Astuce d'itération</span><p>${this.escape(prompt.tip)}</p></div>`
          : '';
        return `<article class="prompt-card" style="border-left-color: ${palette.border};">
        <header class="prompt-header">
          <div class="prompt-pills">
            <span class="pill" style="background: ${palette.bg}; color: ${palette.text};">${this.escape(prompt.category)}</span>
            <span class="pill pill-level">${this.escape(this.levelLabel(prompt.level))}</span>
            <span class="pill pill-tool">${this.escape(prompt.tool)}</span>
          </div>
          <h4 class="prompt-title">${this.escape(prompt.title)}</h4>
          ${description}
        </header>
        <pre class="prompt-code">${this.escape(prompt.prompt)}</pre>
        ${example}
        ${tip}
      </article>`;
      })
      .join('');

    return `<section class="page section">
      ${this.sectionHeader('02', '✍️ Prompts', 'Personnalisés selon votre niveau')}
      <div class="prompt-list">${cards}</div>
      ${this.pageFooter()}
    </section>`;
  }

  /** Page workflows automatises avec etapes numerotees. */
  private renderWorkflows(workflows: WorkflowEntry[]): string {
    if (!workflows.length) return '';

    const cards = workflows
      .map((wf) => {
        const steps = wf.steps
          .map(
            (step) => `<li class="workflow-step">
            <span class="step-number">${step.step}</span>
            <div class="step-content">
              <p class="step-action">${this.escape(step.action)}</p>
              <p class="step-detail"><span class="step-tool">${this.escape(step.tool)}</span> — ${this.escape(step.detail)}</p>
            </div>
          </li>`,
          )
          .join('');
        const tools = wf.tools
          .map((tool) => `<span class="tool-badge">${this.escape(tool)}</span>`)
          .join('');
        return `<article class="workflow-card">
          <header class="workflow-header">
            <h4 class="workflow-title">${this.escape(wf.title)}</h4>
            <p class="workflow-description">${this.escape(wf.description)}</p>
            <div class="workflow-meta">
              <span class="meta-item"><span class="meta-label">Setup</span> ${this.escape(wf.setupTime)}</span>
              <span class="meta-item"><span class="meta-label">Coût</span> ${wf.monthlyCost} €/mois</span>
            </div>
          </header>
          <ol class="workflow-steps">${steps}</ol>
          <footer class="workflow-tools">${tools}</footer>
        </article>`;
      })
      .join('');

    return `<section class="page section">
      ${this.sectionHeader('03', '⚡ Workflows', 'Automatisations clés en main')}
      <div class="workflow-list">${cards}</div>
      ${this.pageFooter()}
    </section>`;
  }

  /** Page templates avec cartes colorees selon la plateforme. */
  private renderTemplates(templates: TemplateEntry[]): string {
    if (!templates.length) return '';

    const cards = templates
      .map((tpl) => {
        const color = this.platformColorFor(tpl.platform);
        const budget =
          tpl.minBudget > 0
            ? `<span class="template-budget">À partir de ${tpl.minBudget} €/mois</span>`
            : '<span class="template-budget template-budget-free">Gratuit</span>';
        return `<article class="template-card" style="border-top: 4px solid ${color};">
          <header class="template-header">
            <h4 class="template-name">${this.escape(tpl.name)}</h4>
            <span class="platform-badge" style="background: ${color};">${this.escape(tpl.platform)}</span>
          </header>
          <p class="template-description">${this.escape(tpl.description)}</p>
          <footer class="template-footer">
            <a class="template-link" href="${this.escape(tpl.url)}">Ouvrir →</a>
            ${budget}
          </footer>
        </article>`;
      })
      .join('');

    return `<section class="page section">
      ${this.sectionHeader('04', '📋 Templates', "Prêts à l'emploi")}
      <div class="template-grid">${cards}</div>
      ${this.pageFooter()}
    </section>`;
  }

  /** Page bonus avec le prompt genere par l'IA. */
  private renderGeneratedPrompt(generatedPrompt: string): string {
    return `<section class="page section">
      ${this.sectionHeader('05', '✨ Votre prompt', 'Sur mesure pour votre activité')}
      <div class="generated-box">
        <pre class="generated-text">${this.escape(generatedPrompt)}</pre>
      </div>
      ${this.pageFooter()}
    </section>`;
  }

  /* ------------------------------------------------------------------ */
  /*  Helpers                                                            */
  /* ------------------------------------------------------------------ */

  private sectionHeader(num: string, title: string, subtitle: string): string {
    return `<header class="section-header">
      <span class="section-number">${num}</span>
      <div>
        <h2 class="section-title">${title}</h2>
        <p class="section-subtitle">${this.escape(subtitle)}</p>
      </div>
    </header>`;
  }

  private pageFooter(): string {
    return `<footer class="page-footer">
      <span>asilidesign.fr/formations</span>
      <span>•</span>
      <span>Guide IA Solopreneurs 2026</span>
      <span>•</span>
      <span>asilidesign.fr/contact</span>
    </footer>`;
  }

  private levelLabel(level: string): string {
    switch (level) {
      case 'debutant':
        return 'Débutant';
      case 'intermediaire':
        return 'Intermédiaire';
      case 'avance':
        return 'Avancé';
      default:
        return level;
    }
  }

  /** Normalise une cle de categorie (minuscules, sans accents, trim). */
  private normalizeKey(raw: string): string {
    return raw
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  /** Retourne la palette couleur associee a une categorie, avec fallback accent. */
  private paletteFor(category: string): {
    bg: string;
    text: string;
    border: string;
  } {
    const key = this.normalizeKey(category);
    return (
      this.categoryColors[key] ?? {
        bg: '#e7f6f3',
        text: '#2d8576',
        border: this.accent,
      }
    );
  }

  /** Retourne la couleur de bordure pour une plateforme de template. */
  private platformColorFor(platform: string): string {
    const key = this.normalizeKey(platform);
    return this.platformColors[key] ?? this.accent;
  }

  /** Echappe les caracteres HTML pour eviter toute injection. */
  private escape(value: string): string {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  /** Styles CSS embarques (variables, grille, typographie). */
  private css(): string {
    return `
      @page {
        size: A4;
        margin: 0;
      }
      :root {
        --accent: ${this.accent};
        --accent-soft: #e7f6f3;
        --accent-dark: #2d8576;
        --ink: #0c0902;
        --muted: #54524d;
        --line: #e7e5e0;
        --bg: #ffffff;
        --bg-soft: #f7f7f4;
        --yellow-bg: #fef9c3;
        --yellow-ink: #854d0e;
        --blue-bg: #eff6ff;
        --blue-ink: #1d4ed8;
      }
      * { box-sizing: border-box; margin: 0; padding: 0; }
      html, body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue",
          "Inter", "Liberation Sans", Arial, sans-serif;
        color: var(--ink);
        background: var(--bg);
        font-size: 10.5pt;
        line-height: 1.5;
        -webkit-font-smoothing: antialiased;
      }
      .page {
        width: 210mm;
        min-height: 297mm;
        padding: 22mm 20mm 18mm 20mm;
        page-break-after: always;
        position: relative;
        background: var(--bg);
      }
      .page:last-child {
        page-break-after: auto;
      }

      /* ----- Cover ----- */
      .cover {
        padding: 0;
        display: flex;
        flex-direction: column;
        background: linear-gradient(160deg, #ffffff 0%, var(--accent-soft) 40%, #fff 100%);
      }
      .cover-gradient {
        height: 110mm;
        background:
          radial-gradient(circle at 20% 30%, rgba(255,255,255,0.2) 0%, transparent 50%),
          linear-gradient(135deg, var(--accent) 0%, #3a9a8a 50%, var(--accent-dark) 100%);
        position: relative;
        overflow: hidden;
      }
      .cover-shape {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.08);
      }
      .cover-shape-1 {
        width: 120mm;
        height: 120mm;
        right: -30mm;
        top: -40mm;
      }
      .cover-shape-2 {
        width: 60mm;
        height: 60mm;
        left: -20mm;
        bottom: -25mm;
        background: rgba(255, 255, 255, 0.12);
      }
      .cover-shape-3 {
        width: 25mm;
        height: 25mm;
        right: 30mm;
        bottom: 15mm;
        background: rgba(255, 255, 255, 0.15);
      }
      .cover-content {
        flex: 1;
        padding: 20mm 22mm 0 22mm;
        margin-top: -60mm;
        position: relative;
        z-index: 2;
      }
      .cover-eyebrow {
        text-transform: uppercase;
        letter-spacing: 2pt;
        font-size: 9pt;
        color: rgba(255, 255, 255, 0.95);
        margin-bottom: 8mm;
        font-weight: 600;
      }
      .cover-title {
        font-family: Georgia, "Times New Roman", "Liberation Serif", serif;
        font-size: 42pt;
        line-height: 1.02;
        font-weight: 700;
        color: #ffffff;
        letter-spacing: -1pt;
        margin-bottom: 10mm;
        text-shadow: 0 2mm 6mm rgba(0, 0, 0, 0.08);
      }
      .cover-subtitle {
        font-size: 13pt;
        line-height: 1.55;
        color: var(--ink);
        max-width: 150mm;
        margin-bottom: 18mm;
        font-weight: 400;
      }
      .cover-meta {
        margin-bottom: 14mm;
      }
      .cover-prepared {
        font-size: 12pt;
        color: var(--ink);
      }
      .cover-prepared strong {
        color: var(--accent-dark);
        font-size: 14pt;
      }
      .cover-date {
        font-size: 10pt;
        color: var(--muted);
        margin-top: 2mm;
      }
      .badges {
        display: flex;
        flex-wrap: wrap;
        gap: 4mm;
      }
      .badge {
        display: inline-flex;
        flex-direction: column;
        gap: 1mm;
        padding: 4mm 6mm;
        background: #ffffff;
        border: 1px solid var(--line);
        border-radius: 4mm;
        box-shadow: 0 2mm 5mm rgba(12, 9, 2, 0.06);
      }
      .badge-label {
        font-size: 7.5pt;
        text-transform: uppercase;
        letter-spacing: 0.8pt;
        color: var(--muted);
      }
      .badge-value {
        font-size: 11pt;
        font-weight: 600;
        color: var(--ink);
      }
      .cover-footer {
        padding: 8mm 22mm 12mm;
        display: flex;
        gap: 3mm;
        font-size: 9pt;
        color: var(--muted);
      }

      /* ----- Section header ----- */
      .section-header {
        display: flex;
        align-items: center;
        gap: 6mm;
        margin-bottom: 10mm;
        padding-bottom: 6mm;
        border-bottom: 2px solid var(--accent);
      }
      .section-number {
        font-size: 28pt;
        font-weight: 800;
        color: var(--accent);
        line-height: 1;
        font-variant-numeric: tabular-nums;
      }
      .section-title {
        font-family: Georgia, "Times New Roman", "Liberation Serif", serif;
        font-size: 24pt;
        font-weight: 700;
        color: var(--ink);
        line-height: 1.1;
      }
      .section-subtitle {
        font-size: 10.5pt;
        color: var(--muted);
        margin-top: 1mm;
      }

      /* ----- Stats page ----- */
      .stats-intro {
        margin-bottom: 8mm;
        font-size: 11pt;
        line-height: 1.6;
        color: var(--ink);
      }
      .stats-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 5mm;
        margin-bottom: 10mm;
      }
      .stat-card {
        padding: 6mm 7mm;
        background: linear-gradient(135deg, #ffffff 0%, var(--accent-soft) 100%);
        border: 1px solid var(--line);
        border-radius: 4mm;
        page-break-inside: avoid;
        box-shadow: 0 1mm 4mm rgba(12, 9, 2, 0.04);
      }
      .stat-card.highlight {
        background: linear-gradient(135deg, var(--accent) 0%, var(--accent-dark) 100%);
      }
      .stat-card.highlight .stat-number,
      .stat-card.highlight .stat-label {
        color: #ffffff;
      }
      .stat-number {
        font-family: Georgia, "Times New Roman", serif;
        font-size: 42pt;
        font-weight: 700;
        color: var(--accent-dark);
        line-height: 1;
        margin-bottom: 3mm;
      }
      .stat-percent {
        font-size: 24pt;
        margin-left: 1mm;
      }
      .stat-label {
        font-size: 10pt;
        line-height: 1.45;
        color: var(--ink);
      }
      .stats-promise {
        padding: 6mm 7mm;
        background: var(--bg-soft);
        border-left: 4px solid var(--accent);
        border-radius: 2mm;
        page-break-inside: avoid;
      }
      .stats-promise-title {
        font-size: 12pt;
        font-weight: 700;
        color: var(--ink);
        margin-bottom: 4mm;
      }
      .stats-promise-list {
        list-style: none;
        display: flex;
        flex-direction: column;
        gap: 3mm;
      }
      .stats-promise-list li {
        font-size: 10pt;
        line-height: 1.55;
        color: var(--ink);
        padding-left: 6mm;
        position: relative;
      }
      .stats-promise-list li::before {
        content: '→';
        position: absolute;
        left: 0;
        color: var(--accent);
        font-weight: 700;
      }

      /* ----- Cheatsheet ----- */
      .category {
        margin-bottom: 8mm;
      }
      .category-title {
        font-size: 11pt;
        text-transform: uppercase;
        letter-spacing: 1pt;
        margin-bottom: 4mm;
        padding-left: 3mm;
        border-left: 3px solid var(--accent);
        font-weight: 700;
      }
      .tool-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 4mm;
      }
      .tool-card {
        padding: 4mm 5mm;
        background: var(--bg-soft);
        border: 1px solid var(--line);
        border-radius: 3mm;
        page-break-inside: avoid;
        display: flex;
        flex-direction: column;
        gap: 2mm;
      }
      .tool-card-header {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        gap: 3mm;
      }
      .tool-name {
        font-size: 11pt;
        font-weight: 700;
        color: var(--ink);
      }
      .tool-price {
        font-size: 7.5pt;
        font-weight: 600;
        color: var(--accent-dark);
        background: var(--accent-soft);
        padding: 0.5mm 2mm;
        border-radius: 2mm;
        white-space: nowrap;
        text-align: right;
      }
      .tool-tip {
        font-size: 9pt;
        line-height: 1.45;
        color: var(--ink);
      }
      .tool-decision {
        font-size: 8.5pt;
        line-height: 1.4;
        color: var(--muted);
        font-style: italic;
      }
      .tool-card-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 2mm;
        margin-top: 1mm;
      }
      .tool-link {
        font-size: 8.5pt;
        color: var(--accent-dark);
        text-decoration: none;
        word-break: break-all;
        font-weight: 500;
      }
      .chip {
        font-size: 7.5pt;
        font-weight: 600;
        padding: 0.5mm 2mm;
        border-radius: 2mm;
        white-space: nowrap;
      }
      .chip-used {
        background: #fff4d6;
        color: #8a6d1c;
      }
      .chip-new {
        background: var(--accent-soft);
        color: var(--accent-dark);
      }

      /* ----- Prompts ----- */
      .prompt-list {
        display: flex;
        flex-direction: column;
        gap: 6mm;
      }
      .prompt-card {
        padding: 5mm 6mm;
        background: var(--bg-soft);
        border: 1px solid var(--line);
        border-radius: 3mm;
        border-left: 4mm solid var(--accent);
        page-break-inside: avoid;
      }
      .prompt-header {
        margin-bottom: 3mm;
      }
      .prompt-pills {
        display: flex;
        flex-wrap: wrap;
        gap: 2mm;
        margin-bottom: 2mm;
      }
      .prompt-title {
        font-family: Georgia, "Times New Roman", serif;
        font-size: 14pt;
        font-weight: 700;
        color: var(--ink);
        margin-bottom: 2mm;
        line-height: 1.2;
      }
      .prompt-description {
        font-size: 9.5pt;
        line-height: 1.5;
        color: var(--muted);
        margin-bottom: 3mm;
      }
      .pill {
        font-size: 7pt;
        font-weight: 700;
        padding: 0.8mm 2.5mm;
        border-radius: 10mm;
        text-transform: uppercase;
        letter-spacing: 0.5pt;
      }
      .pill-level {
        background: #fff4d6;
        color: #8a6d1c;
      }
      .pill-tool {
        background: #eef2ff;
        color: #3730a3;
      }
      .prompt-code {
        font-family: "SF Mono", "Cascadia Code", "Liberation Mono", Menlo, Consolas, monospace;
        font-size: 8.5pt;
        line-height: 1.55;
        color: var(--ink);
        background: #ffffff;
        padding: 4mm 5mm;
        border-radius: 2mm;
        border: 1px solid var(--line);
        white-space: pre-wrap;
        word-wrap: break-word;
      }
      .prompt-example {
        margin-top: 3mm;
        padding: 3mm 4mm;
        background: var(--blue-bg);
        border-radius: 2mm;
        border-left: 2px solid var(--blue-ink);
      }
      .prompt-example-label {
        font-size: 7pt;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.6pt;
        color: var(--blue-ink);
        display: block;
        margin-bottom: 1mm;
      }
      .prompt-example p {
        font-size: 8.5pt;
        line-height: 1.5;
        color: var(--ink);
        font-style: italic;
      }
      .prompt-tip {
        margin-top: 2mm;
        padding: 3mm 4mm;
        background: var(--yellow-bg);
        border-radius: 2mm;
        border-left: 2px solid var(--yellow-ink);
      }
      .prompt-tip-label {
        font-size: 7pt;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.6pt;
        color: var(--yellow-ink);
        display: block;
        margin-bottom: 1mm;
      }
      .prompt-tip p {
        font-size: 8.5pt;
        line-height: 1.5;
        color: var(--ink);
      }

      /* ----- Workflows ----- */
      .workflow-list {
        display: flex;
        flex-direction: column;
        gap: 7mm;
      }
      .workflow-card {
        padding: 5mm 6mm;
        background: var(--bg-soft);
        border: 1px solid var(--line);
        border-radius: 3mm;
        page-break-inside: avoid;
      }
      .workflow-header {
        margin-bottom: 4mm;
        padding-bottom: 3mm;
        border-bottom: 1px solid var(--line);
      }
      .workflow-title {
        font-family: Georgia, "Times New Roman", serif;
        font-size: 14pt;
        font-weight: 700;
        color: var(--ink);
        margin-bottom: 2mm;
      }
      .workflow-description {
        font-size: 9.5pt;
        color: var(--muted);
        margin-bottom: 3mm;
        line-height: 1.5;
      }
      .workflow-meta {
        display: flex;
        gap: 5mm;
      }
      .meta-item {
        font-size: 9pt;
        color: var(--ink);
      }
      .meta-label {
        font-size: 7.5pt;
        text-transform: uppercase;
        letter-spacing: 0.5pt;
        color: var(--muted);
        margin-right: 1mm;
      }
      .workflow-steps {
        list-style: none;
        display: flex;
        flex-direction: column;
        gap: 3mm;
        margin-bottom: 4mm;
      }
      .workflow-step {
        display: flex;
        gap: 3mm;
        align-items: flex-start;
      }
      .step-number {
        flex-shrink: 0;
        width: 7mm;
        height: 7mm;
        border-radius: 50%;
        background: linear-gradient(135deg, var(--accent) 0%, var(--accent-dark) 100%);
        color: #ffffff;
        font-size: 10pt;
        font-weight: 700;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 1mm 2mm rgba(45, 133, 118, 0.25);
      }
      .step-content {
        flex: 1;
      }
      .step-action {
        font-size: 10pt;
        font-weight: 600;
        color: var(--ink);
      }
      .step-detail {
        font-size: 8.5pt;
        color: var(--muted);
        margin-top: 0.5mm;
        line-height: 1.45;
      }
      .step-tool {
        font-weight: 700;
        color: var(--accent-dark);
      }
      .workflow-tools {
        display: flex;
        flex-wrap: wrap;
        gap: 2mm;
        padding-top: 3mm;
        border-top: 1px solid var(--line);
      }
      .tool-badge {
        font-size: 7.5pt;
        font-weight: 600;
        padding: 0.8mm 2.5mm;
        background: #ffffff;
        border: 1px solid var(--line);
        border-radius: 10mm;
        color: var(--muted);
      }

      /* ----- Templates ----- */
      .template-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 5mm;
      }
      .template-card {
        padding: 5mm 6mm;
        background: var(--bg-soft);
        border: 1px solid var(--line);
        border-radius: 3mm;
        page-break-inside: avoid;
        display: flex;
        flex-direction: column;
        gap: 3mm;
      }
      .template-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 2mm;
      }
      .template-name {
        font-size: 11pt;
        font-weight: 700;
        color: var(--ink);
        flex: 1;
        line-height: 1.25;
      }
      .platform-badge {
        font-size: 7pt;
        font-weight: 700;
        padding: 0.8mm 2.5mm;
        color: #ffffff;
        border-radius: 2mm;
        text-transform: uppercase;
        letter-spacing: 0.5pt;
        white-space: nowrap;
      }
      .template-description {
        font-size: 9pt;
        line-height: 1.5;
        color: var(--muted);
        flex: 1;
      }
      .template-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 2mm;
        padding-top: 2mm;
        border-top: 1px solid var(--line);
      }
      .template-link {
        font-size: 9pt;
        font-weight: 700;
        color: var(--accent-dark);
        text-decoration: none;
      }
      .template-budget {
        font-size: 8pt;
        color: var(--muted);
        font-weight: 500;
      }
      .template-budget-free {
        color: var(--accent-dark);
        font-weight: 700;
      }

      /* ----- Generated prompt ----- */
      .generated-box {
        padding: 6mm;
        background: linear-gradient(135deg, var(--accent-soft) 0%, #ffffff 100%);
        border: 1px solid var(--accent);
        border-radius: 3mm;
      }
      .generated-text {
        font-family: "SF Mono", "Cascadia Code", "Liberation Mono", Menlo, monospace;
        font-size: 9.5pt;
        line-height: 1.6;
        color: var(--ink);
        white-space: pre-wrap;
        word-wrap: break-word;
      }

      /* ----- Page footer ----- */
      .page-footer {
        position: absolute;
        bottom: 8mm;
        left: 20mm;
        right: 20mm;
        display: flex;
        justify-content: center;
        gap: 3mm;
        font-size: 8pt;
        color: var(--muted);
        padding-top: 4mm;
        border-top: 1px solid var(--line);
      }
    `;
  }
}
