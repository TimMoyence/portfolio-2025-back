import { ACCENT } from './toolkit-palette';

/**
 * Styles CSS embarques dans le document PDF du toolkit IA (variables,
 * grille A4, typographie, cover, sections, prompts, workflows, templates).
 *
 * Extrait du god-object `ToolkitHtmlRendererService` pour que la concern
 * "presentation visuelle" reste independante de la concern "assemblage
 * HTML". Les variables CSS referent a la palette centralisee dans
 * `toolkit-palette.ts`.
 */
export function buildToolkitCss(): string {
  return `
      /* Pas de @page : les marges sont gerees par Puppeteer en options.
         Cela garantit que les marges sont appliquees sur TOUTES les pages
         physiques, y compris celles creees par overflow naturel. */
      :root {
        --accent: ${ACCENT};
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
        position: relative;
        background: var(--bg);
      }
      /* Seule la cover force un saut de page apres elle. Les sections
         suivantes coulent naturellement, separees visuellement par leur
         section-header (gros numero + titre serif + ligne accent). */
      .cover.page {
        page-break-after: always;
      }
      /* Espace de separation entre sections quand elles s enchainent
         sur la meme page. */
      .page.section + .page.section {
        margin-top: 16mm;
      }
      /* La section Templates demarre toujours sur une nouvelle page
         (le user le veut explicitement). */
      .section-templates {
        page-break-before: always;
        margin-top: 0 !important;
      }
      .cover.page {
        /* La cover deborde les marges Puppeteer en utilisant des marges
           negatives equivalentes aux marges physiques de la page (28/24/22/22).
           Resultat : la cover prend bien toute la premiere page A4. */
        margin: -28mm -22mm -24mm -22mm;
        width: 210mm;
        height: 297mm;
        padding: 0;
      }
      .page:last-child {
        page-break-after: auto;
      }

      /* ----- Cover ----- */
      .cover {
        padding: 0;
        display: flex;
        flex-direction: column;
        position: relative;
        overflow: hidden;
        background:
          radial-gradient(circle at 20% 30%, rgba(255,255,255,0.18) 0%, transparent 55%),
          radial-gradient(circle at 80% 80%, rgba(255,255,255,0.10) 0%, transparent 55%),
          linear-gradient(135deg, var(--accent) 0%, #3a9a8a 50%, var(--accent-dark) 100%);
      }
      /* Le bloc cover-gradient est un conteneur absolu pour les formes
         decoratives, mais n est plus responsable du fond lui-meme. */
      .cover-gradient {
        position: absolute;
        inset: 0;
        overflow: hidden;
        pointer-events: none;
        z-index: 1;
      }
      .cover-shape {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.08);
      }
      .cover-shape-1 {
        width: 140mm;
        height: 140mm;
        right: -40mm;
        top: -50mm;
      }
      .cover-shape-2 {
        width: 90mm;
        height: 90mm;
        left: -30mm;
        bottom: 60mm;
        background: rgba(255, 255, 255, 0.10);
      }
      .cover-shape-3 {
        width: 40mm;
        height: 40mm;
        right: 40mm;
        bottom: 80mm;
        background: rgba(255, 255, 255, 0.14);
      }
      .cover-content {
        flex: 1;
        padding: 45mm 25mm 0 25mm;
        position: relative;
        z-index: 2;
      }
      .cover-eyebrow {
        text-transform: uppercase;
        letter-spacing: 2pt;
        font-size: 9pt;
        color: rgba(255, 255, 255, 0.95);
        margin-bottom: 12mm;
        font-weight: 600;
      }
      .cover-title {
        font-family: Georgia, "Times New Roman", "Liberation Serif", serif;
        font-size: 44pt;
        line-height: 1.02;
        font-weight: 700;
        color: #ffffff;
        letter-spacing: -1pt;
        margin-bottom: 12mm;
        text-shadow: 0 2mm 6mm rgba(0, 0, 0, 0.15);
      }
      .cover-subtitle {
        font-size: 13pt;
        line-height: 1.55;
        color: rgba(255, 255, 255, 0.92);
        max-width: 150mm;
        margin-bottom: 22mm;
        font-weight: 400;
      }
      .cover-meta {
        margin-bottom: 14mm;
      }
      .cover-prepared {
        font-size: 12pt;
        color: rgba(255, 255, 255, 0.95);
      }
      .cover-prepared strong {
        color: #ffffff;
        font-size: 14pt;
        font-weight: 700;
      }
      .cover-date {
        font-size: 10pt;
        color: rgba(255, 255, 255, 0.8);
        margin-top: 2mm;
      }
      .badges {
        display: flex;
        flex-wrap: wrap;
        gap: 3mm;
      }
      .badge {
        display: inline-flex;
        align-items: baseline;
        gap: 2mm;
        padding: 2.5mm 5mm;
        background: rgba(0, 0, 0, 0.22);
        border: 1px solid rgba(255, 255, 255, 0.3);
        border-radius: 99mm;
      }
      .badge-label {
        font-size: 7.5pt;
        text-transform: uppercase;
        letter-spacing: 0.8pt;
        color: rgba(255, 255, 255, 0.7);
      }
      .badge-value {
        font-size: 10pt;
        font-weight: 700;
        color: #ffffff;
      }
      .cover-footer {
        position: relative;
        z-index: 2;
        padding: 8mm 25mm 14mm;
        display: flex;
        gap: 3mm;
        font-size: 9pt;
        color: rgba(255, 255, 255, 0.85);
      }

      /* ----- Section header ----- */
      .section-header {
        display: flex;
        align-items: center;
        gap: 6mm;
        margin-bottom: 12mm;
        padding-bottom: 6mm;
        border-bottom: 2px solid var(--accent);
        page-break-after: avoid;
        page-break-inside: avoid;
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
        background: transparent;
        border: 1px solid var(--line);
        border-radius: 4mm;
        page-break-inside: avoid;
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
        background: transparent;
        border: 1px solid var(--line);
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
        margin-bottom: 10mm;
      }
      .category-title {
        font-size: 11pt;
        text-transform: uppercase;
        letter-spacing: 1pt;
        margin-bottom: 5mm;
        padding-left: 3mm;
        border-left: 3px solid var(--accent);
        font-weight: 700;
        page-break-after: avoid;
      }
      .tool-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 4mm;
      }
      .tool-card {
        padding: 5mm 6mm;
        background: transparent;
        border: 1px solid var(--line);
        border-radius: 3mm;
        page-break-inside: avoid;
        display: flex;
        flex-direction: column;
        gap: 2.5mm;
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
        gap: 8mm;
      }
      .prompt-card {
        padding: 7mm 8mm;
        background: transparent;
        border: 1px solid var(--line);
        border-radius: 3mm;
        border-left: 4mm solid var(--accent);
        page-break-inside: avoid;
        display: flex;
        flex-direction: column;
        gap: 5mm;
      }
      .prompt-header {
        display: flex;
        flex-direction: column;
        gap: 3mm;
      }
      .prompt-pills {
        display: flex;
        flex-wrap: wrap;
        gap: 2mm;
      }
      .prompt-title {
        font-family: Georgia, "Times New Roman", serif;
        font-size: 14pt;
        font-weight: 700;
        color: var(--ink);
        line-height: 1.2;
      }
      .prompt-description {
        font-size: 9.5pt;
        line-height: 1.55;
        color: var(--muted);
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
        line-height: 1.6;
        color: var(--ink);
        background: var(--bg-soft);
        padding: 6mm 7mm;
        border-radius: 2mm;
        border: 1px solid var(--line);
        white-space: pre-wrap;
        word-wrap: break-word;
      }
      .prompt-example {
        padding: 4mm 5mm;
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
        margin-bottom: 2mm;
      }
      .prompt-example p {
        font-size: 8.5pt;
        line-height: 1.55;
        color: var(--ink);
        font-style: italic;
      }
      .prompt-tip {
        padding: 4mm 5mm;
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
        margin-bottom: 2mm;
      }
      .prompt-tip p {
        font-size: 8.5pt;
        line-height: 1.55;
        color: var(--ink);
      }

      /* ----- Workflows ----- */
      .workflow-list {
        display: flex;
        flex-direction: column;
        gap: 10mm;
      }
      .workflow-card {
        padding: 6mm 7mm;
        background: transparent;
        border: 1px solid var(--line);
        border-radius: 3mm;
        page-break-inside: avoid;
      }
      /* A partir du second workflow, chaque carte demarre sur une nouvelle
         page pour eviter les pages a moitie vides. */
      .workflow-card + .workflow-card {
        page-break-before: always;
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
        width: 8mm;
        height: 8mm;
        display: block;
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
        padding: 6mm 7mm;
        background: transparent;
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
        background: transparent;
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

    `;
}
