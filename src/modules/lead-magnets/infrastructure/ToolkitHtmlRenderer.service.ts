import { Injectable } from '@nestjs/common';
import type {
  CheatsheetEntry,
  PromptEntry,
  TemplateEntry,
  ToolkitContent,
  WorkflowEntry,
} from '../domain/ToolkitContent';
import { buildToolkitCss } from './toolkit-html/toolkit-html.css';
import {
  escapeHtml,
  levelLabel,
  pageFooter,
  paletteFor,
  platformColorFor,
  sectionHeader,
} from './toolkit-html/toolkit-html.utils';
import { ACCENT } from './toolkit-html/toolkit-palette';

@Injectable()
export class ToolkitHtmlRendererService {
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
    <style>${buildToolkitCss()}</style>
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

  private renderCover(content: ToolkitContent, date: string): string {
    const recap = content.recap;
    const firstName = escapeHtml(recap.firstName);
    const badges: string[] = [];
    if (recap.aiLevel) {
      badges.push(
        `<span class="badge"><span class="badge-label">Niveau IA</span><span class="badge-value">${escapeHtml(levelLabel(recap.aiLevel))}</span></span>`,
      );
    }
    if (recap.sector) {
      badges.push(
        `<span class="badge"><span class="badge-label">Secteur</span><span class="badge-value">${escapeHtml(recap.sector)}</span></span>`,
      );
    }
    if (recap.budgetTier) {
      badges.push(
        `<span class="badge"><span class="badge-label">Budget</span><span class="badge-value">${escapeHtml(recap.budgetTier)} €/mois</span></span>`,
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
          <p class="cover-date">${escapeHtml(date)}</p>
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

  private renderStatsPage(): string {
    return `<section class="page section stats-page">
      ${sectionHeader('00', 'Pourquoi ce guide ?', 'Les chiffres qui changent tout en 2026')}
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
      ${pageFooter()}
    </section>`;
  }

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
        const palette = paletteFor(category);
        const soloCard = tools.length === 1;
        const cards = tools
          .map((tool) => this.renderToolCard(tool, soloCard))
          .join('');
        return `<div class="category">
          <h3 class="category-title" style="color: ${palette.text}; border-left-color: ${palette.border};">${escapeHtml(category)}</h3>
          <div class="tool-grid">${cards}</div>
        </div>`;
      })
      .join('');

    return `<section class="page section">
      ${sectionHeader('01', '🧰 Cheatsheet', 'Vos outils IA sélectionnés')}
      ${groups}
      ${pageFooter()}
    </section>`;
  }

  private renderToolCard(tool: CheatsheetEntry, soloCard = false): string {
    const used = tool.alreadyUsed
      ? '<span class="chip chip-used">Déjà utilisé</span>'
      : '<span class="chip chip-new">À découvrir</span>';
    const url = tool.url.replace(/^https?:\/\//, '');
    const decision = tool.decision
      ? `<p class="tool-decision">${escapeHtml(tool.decision)}</p>`
      : '';
    const soloStyle = soloCard ? 'style="grid-column: 1 / -1;"' : '';
    return `<article class="tool-card" ${soloStyle}>
      <header class="tool-card-header">
        <h4 class="tool-name">${escapeHtml(tool.tool)}</h4>
        <span class="tool-price">${escapeHtml(tool.price)}</span>
      </header>
      <p class="tool-tip">💡 ${escapeHtml(tool.tip)}</p>
      ${decision}
      <footer class="tool-card-footer">
        <a class="tool-link" href="https://${escapeHtml(url)}">${escapeHtml(url)}</a>
        ${used}
      </footer>
    </article>`;
  }

  private renderPrompts(prompts: PromptEntry[]): string {
    if (!prompts.length) return '';

    const cards = prompts
      .map((prompt) => {
        const palette = paletteFor(prompt.category);
        const description = prompt.description
          ? `<p class="prompt-description">${escapeHtml(prompt.description)}</p>`
          : '';
        const example = prompt.example
          ? `<div class="prompt-example"><span class="prompt-example-label">Cas d'usage</span><p>${escapeHtml(prompt.example)}</p></div>`
          : '';
        const tip = prompt.tip
          ? `<div class="prompt-tip"><span class="prompt-tip-label">💡 Astuce d'itération</span><p>${escapeHtml(prompt.tip)}</p></div>`
          : '';
        return `<article class="prompt-card" style="border-left-color: ${palette.border};">
        <header class="prompt-header">
          <div class="prompt-pills">
            <span class="pill" style="background: ${palette.bg}; color: ${palette.text};">${escapeHtml(prompt.category)}</span>
            <span class="pill pill-level">${escapeHtml(levelLabel(prompt.level))}</span>
            <span class="pill pill-tool">${escapeHtml(prompt.tool)}</span>
          </div>
          <h4 class="prompt-title">${escapeHtml(prompt.title)}</h4>
          ${description}
        </header>
        <pre class="prompt-code">${escapeHtml(prompt.prompt)}</pre>
        ${example}
        ${tip}
      </article>`;
      })
      .join('');

    return `<section class="page section">
      ${sectionHeader('02', '✍️ Prompts', 'Personnalisés selon votre niveau')}
      <div class="prompt-list">${cards}</div>
      ${pageFooter()}
    </section>`;
  }

  private renderWorkflows(workflows: WorkflowEntry[]): string {
    if (!workflows.length) return '';

    const cards = workflows
      .map((wf) => {
        const steps = wf.steps
          .map(
            (step) => `<li class="workflow-step">
            <svg class="step-number" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
              <circle cx="20" cy="20" r="19" fill="${ACCENT}"/>
              <text x="20" y="27" text-anchor="middle" font-family="-apple-system, 'Helvetica Neue', Arial, sans-serif" font-size="20" font-weight="700" fill="#ffffff">${step.step}</text>
            </svg>
            <div class="step-content">
              <p class="step-action">${escapeHtml(step.action)}</p>
              <p class="step-detail"><span class="step-tool">${escapeHtml(step.tool)}</span> — ${escapeHtml(step.detail)}</p>
            </div>
          </li>`,
          )
          .join('');
        const tools = wf.tools
          .map((tool) => `<span class="tool-badge">${escapeHtml(tool)}</span>`)
          .join('');
        return `<article class="workflow-card">
          <header class="workflow-header">
            <h4 class="workflow-title">${escapeHtml(wf.title)}</h4>
            <p class="workflow-description">${escapeHtml(wf.description)}</p>
            <div class="workflow-meta">
              <span class="meta-item"><span class="meta-label">Setup</span> ${escapeHtml(wf.setupTime)}</span>
              <span class="meta-item"><span class="meta-label">Coût</span> ${wf.monthlyCost} €/mois</span>
            </div>
          </header>
          <ol class="workflow-steps">${steps}</ol>
          <footer class="workflow-tools">${tools}</footer>
        </article>`;
      })
      .join('');

    return `<section class="page section">
      ${sectionHeader('03', '⚡ Workflows', 'Automatisations clés en main')}
      <div class="workflow-list">${cards}</div>
      ${pageFooter()}
    </section>`;
  }

  private renderTemplates(templates: TemplateEntry[]): string {
    if (!templates.length) return '';

    const cards = templates
      .map((tpl) => {
        const color = platformColorFor(tpl.platform);
        const budget =
          tpl.minBudget > 0
            ? `<span class="template-budget">À partir de ${tpl.minBudget} €/mois</span>`
            : '<span class="template-budget template-budget-free">Gratuit</span>';
        return `<article class="template-card" style="border-top: 4px solid ${color};">
          <header class="template-header">
            <h4 class="template-name">${escapeHtml(tpl.name)}</h4>
            <span class="platform-badge" style="background: ${color};">${escapeHtml(tpl.platform)}</span>
          </header>
          <p class="template-description">${escapeHtml(tpl.description)}</p>
          <footer class="template-footer">
            <a class="template-link" href="${escapeHtml(tpl.url)}">Ouvrir →</a>
            ${budget}
          </footer>
        </article>`;
      })
      .join('');

    return `<section class="page section section-templates">
      ${sectionHeader('04', '📋 Templates', "Prêts à l'emploi")}
      <div class="template-grid">${cards}</div>
      ${pageFooter()}
    </section>`;
  }

  private renderGeneratedPrompt(generatedPrompt: string): string {
    return `<section class="page section">
      ${sectionHeader('05', '✨ Votre prompt', 'Sur mesure pour votre activité')}
      <div class="generated-box">
        <pre class="generated-text">${escapeHtml(generatedPrompt)}</pre>
      </div>
      ${pageFooter()}
    </section>`;
  }
}
