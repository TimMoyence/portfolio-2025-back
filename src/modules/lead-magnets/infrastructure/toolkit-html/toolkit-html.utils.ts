import {
  ACCENT,
  CATEGORY_COLORS,
  FALLBACK_CATEGORY_PALETTE,
  PLATFORM_COLORS,
} from './toolkit-palette';
import { escapeHtml } from '../../../../common/infrastructure/mail/html-escape.util';

export function normalizeKey(raw: string): string {
  return raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export function paletteFor(category: string): {
  bg: string;
  text: string;
  border: string;
} {
  const key = normalizeKey(category);
  return CATEGORY_COLORS[key] ?? FALLBACK_CATEGORY_PALETTE;
}

export function platformColorFor(platform: string): string {
  const key = normalizeKey(platform);
  return PLATFORM_COLORS[key] ?? ACCENT;
}

export function levelLabel(level: string): string {
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

export { escapeHtml };

export function sectionHeader(
  num: string,
  title: string,
  subtitle: string,
): string {
  return `<header class="section-header">
      <span class="section-number">${num}</span>
      <div>
        <h2 class="section-title">${title}</h2>
        <p class="section-subtitle">${escapeHtml(subtitle)}</p>
      </div>
    </header>`;
}

/**
 * Footer de page neutre. Retourne une chaine vide pour eviter
 * les problemes de positionnement absolu apres suppression du
 * min-height: 297mm sur .page. Le footer est rendu via la marge
 * @page de Puppeteer si necessaire.
 */
export function pageFooter(): string {
  return '';
}
