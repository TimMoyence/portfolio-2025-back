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
 */
@Injectable()
export class ToolkitHtmlRendererService {
  /** Couleur d'accent Asili. */
  private readonly accent = '#4fb3a2';

  /** Construit le document HTML complet pour un contenu de toolkit. */
  render(content: ToolkitContent): string {
    const date = new Date().toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const cover = this.renderCover(content, date);
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

  /** Page de couverture: titre, prenom, profil, badges. */
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
      <div class="cover-gradient"></div>
      <div class="cover-content">
        <p class="cover-eyebrow">Asili Design — Guide personnalisé</p>
        <h1 class="cover-title">L'IA au service<br/>des solopreneurs</h1>
        <p class="cover-subtitle">Votre boîte à outils sur mesure pour transformer votre activité avec l'IA.</p>
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
      </footer>
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
        const cards = tools.map((tool) => this.renderToolCard(tool)).join('');
        return `<div class="category">
          <h3 class="category-title">${this.escape(category)}</h3>
          <div class="tool-grid">${cards}</div>
        </div>`;
      })
      .join('');

    return `<section class="page section">
      ${this.sectionHeader('01', 'Cheatsheet', 'Vos outils IA sélectionnés')}
      ${groups}
      ${this.pageFooter()}
    </section>`;
  }

  /** Carte individuelle pour un outil dans la cheatsheet. */
  private renderToolCard(tool: CheatsheetEntry): string {
    const used = tool.alreadyUsed
      ? '<span class="chip chip-used">Déjà utilisé</span>'
      : '<span class="chip chip-new">Nouveau</span>';
    const url = tool.url.replace(/^https?:\/\//, '');
    return `<article class="tool-card">
      <header class="tool-card-header">
        <h4 class="tool-name">${this.escape(tool.tool)}</h4>
        <span class="tool-price">${this.escape(tool.price)}</span>
      </header>
      <p class="tool-tip">${this.escape(tool.tip)}</p>
      <footer class="tool-card-footer">
        <a class="tool-link" href="https://${this.escape(url)}">${this.escape(url)}</a>
        ${used}
      </footer>
    </article>`;
  }

  /** Page prompts personnalises avec code blocks. */
  private renderPrompts(prompts: PromptEntry[]): string {
    if (!prompts.length) return '';

    const cards = prompts
      .map((prompt) => {
        return `<article class="prompt-card">
        <header class="prompt-header">
          <h4 class="prompt-title">${this.escape(prompt.title)}</h4>
          <div class="prompt-pills">
            <span class="pill pill-category">${this.escape(prompt.category)}</span>
            <span class="pill pill-level">${this.escape(this.levelLabel(prompt.level))}</span>
            <span class="pill pill-tool">${this.escape(prompt.tool)}</span>
          </div>
        </header>
        <pre class="prompt-code">${this.escape(prompt.prompt)}</pre>
      </article>`;
      })
      .join('');

    return `<section class="page section">
      ${this.sectionHeader('02', 'Prompts', 'Personnalisés selon votre niveau')}
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
      ${this.sectionHeader('03', 'Workflows', 'Automatisations clés en main')}
      <div class="workflow-list">${cards}</div>
      ${this.pageFooter()}
    </section>`;
  }

  /** Page templates avec cartes plateforme. */
  private renderTemplates(templates: TemplateEntry[]): string {
    if (!templates.length) return '';

    const cards = templates
      .map((tpl) => {
        const budget =
          tpl.minBudget > 0
            ? `<span class="template-budget">À partir de ${tpl.minBudget} €/mois</span>`
            : '';
        return `<article class="template-card">
          <header class="template-header">
            <h4 class="template-name">${this.escape(tpl.name)}</h4>
            <span class="platform-badge">${this.escape(tpl.platform)}</span>
          </header>
          <p class="template-description">${this.escape(tpl.description)}</p>
          <footer class="template-footer">
            <a class="template-link" href="${this.escape(tpl.url)}">Ouvrir le template →</a>
            ${budget}
          </footer>
        </article>`;
      })
      .join('');

    return `<section class="page section">
      ${this.sectionHeader('04', 'Templates', "Prêts à l'emploi")}
      <div class="template-grid">${cards}</div>
      ${this.pageFooter()}
    </section>`;
  }

  /** Page bonus avec le prompt genere par l'IA. */
  private renderGeneratedPrompt(generatedPrompt: string): string {
    return `<section class="page section">
      ${this.sectionHeader('05', 'Votre prompt', 'Sur mesure pour votre activité')}
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
        <h2 class="section-title">${this.escape(title)}</h2>
        <p class="section-subtitle">${this.escape(subtitle)}</p>
      </div>
    </header>`;
  }

  private pageFooter(): string {
    return `<footer class="page-footer">
      <span>asilidesign.fr/formations</span>
      <span>•</span>
      <span>Guide IA Solopreneurs</span>
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
        background: linear-gradient(160deg, #ffffff 0%, var(--accent-soft) 100%);
      }
      .cover-gradient {
        height: 90mm;
        background: linear-gradient(135deg, var(--accent) 0%, var(--accent-dark) 100%);
        position: relative;
      }
      .cover-gradient::after {
        content: '';
        position: absolute;
        right: -20mm;
        top: -20mm;
        width: 90mm;
        height: 90mm;
        background: rgba(255, 255, 255, 0.08);
        border-radius: 50%;
      }
      .cover-content {
        flex: 1;
        padding: 20mm 22mm 0 22mm;
        margin-top: -40mm;
        position: relative;
        z-index: 2;
      }
      .cover-eyebrow {
        text-transform: uppercase;
        letter-spacing: 2pt;
        font-size: 9pt;
        color: rgba(255, 255, 255, 0.85);
        margin-bottom: 6mm;
      }
      .cover-title {
        font-size: 36pt;
        line-height: 1.05;
        font-weight: 800;
        color: #ffffff;
        letter-spacing: -0.5pt;
        margin-bottom: 8mm;
      }
      .cover-subtitle {
        font-size: 13pt;
        line-height: 1.5;
        color: var(--ink);
        max-width: 140mm;
        margin-bottom: 16mm;
      }
      .cover-meta {
        margin-bottom: 12mm;
      }
      .cover-prepared {
        font-size: 12pt;
        color: var(--ink);
      }
      .cover-prepared strong {
        color: var(--accent-dark);
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
        box-shadow: 0 1mm 3mm rgba(12, 9, 2, 0.04);
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
        font-size: 22pt;
        font-weight: 700;
        color: var(--ink);
        line-height: 1.1;
      }
      .section-subtitle {
        font-size: 10.5pt;
        color: var(--muted);
        margin-top: 1mm;
      }

      /* ----- Cheatsheet ----- */
      .category {
        margin-bottom: 8mm;
      }
      .category-title {
        font-size: 11pt;
        text-transform: uppercase;
        letter-spacing: 1pt;
        color: var(--accent-dark);
        margin-bottom: 4mm;
        padding-left: 3mm;
        border-left: 3px solid var(--accent);
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
      }
      .tool-card-header {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        gap: 3mm;
        margin-bottom: 2mm;
      }
      .tool-name {
        font-size: 11pt;
        font-weight: 700;
        color: var(--ink);
      }
      .tool-price {
        font-size: 8.5pt;
        font-weight: 600;
        color: var(--accent-dark);
        background: var(--accent-soft);
        padding: 0.5mm 2mm;
        border-radius: 2mm;
        white-space: nowrap;
      }
      .tool-tip {
        font-size: 9pt;
        line-height: 1.45;
        color: var(--muted);
        margin-bottom: 3mm;
      }
      .tool-card-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 2mm;
      }
      .tool-link {
        font-size: 8.5pt;
        color: var(--accent-dark);
        text-decoration: none;
        word-break: break-all;
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
        border-left: 3mm solid var(--accent);
        page-break-inside: avoid;
      }
      .prompt-header {
        margin-bottom: 3mm;
      }
      .prompt-title {
        font-size: 12pt;
        font-weight: 700;
        color: var(--ink);
        margin-bottom: 2mm;
      }
      .prompt-pills {
        display: flex;
        flex-wrap: wrap;
        gap: 2mm;
      }
      .pill {
        font-size: 7.5pt;
        font-weight: 600;
        padding: 0.5mm 2.5mm;
        border-radius: 10mm;
        text-transform: uppercase;
        letter-spacing: 0.5pt;
      }
      .pill-category {
        background: var(--accent-soft);
        color: var(--accent-dark);
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
        font-family: "SF Mono", "Cascadia Code", "Liberation Mono", Menlo, monospace;
        font-size: 9pt;
        line-height: 1.55;
        color: var(--ink);
        background: #ffffff;
        padding: 4mm 5mm;
        border-radius: 2mm;
        border: 1px solid var(--line);
        white-space: pre-wrap;
        word-wrap: break-word;
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
        font-size: 13pt;
        font-weight: 700;
        color: var(--ink);
        margin-bottom: 2mm;
      }
      .workflow-description {
        font-size: 9.5pt;
        color: var(--muted);
        margin-bottom: 3mm;
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
        width: 6mm;
        height: 6mm;
        border-radius: 50%;
        background: var(--accent);
        color: #ffffff;
        font-size: 9pt;
        font-weight: 700;
        display: flex;
        align-items: center;
        justify-content: center;
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
      }
      .step-tool {
        font-weight: 600;
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
        font-size: 8pt;
        font-weight: 500;
        padding: 0.5mm 2.5mm;
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
      }
      .platform-badge {
        font-size: 7.5pt;
        font-weight: 600;
        padding: 0.5mm 2mm;
        background: var(--accent);
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
        font-weight: 600;
        color: var(--accent-dark);
        text-decoration: none;
      }
      .template-budget {
        font-size: 8pt;
        color: var(--muted);
      }

      /* ----- Generated prompt ----- */
      .generated-box {
        padding: 6mm;
        background: var(--accent-soft);
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
