import { escapeHtml, safeHtml, type EscapedHtml } from './html-escape.util';

export function sectionHeader(
  num: string,
  title: string,
  subtitle: string,
): EscapedHtml {
  return safeHtml`<header class="section-header">
      <span class="section-number">${escapeHtml(num)}</span>
      <div>
        <h2 class="section-title">${escapeHtml(title)}</h2>
        <p class="section-subtitle">${escapeHtml(subtitle)}</p>
      </div>
    </header>`;
}
