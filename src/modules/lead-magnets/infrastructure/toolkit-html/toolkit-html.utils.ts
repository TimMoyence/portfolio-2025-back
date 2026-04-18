import {
  ACCENT,
  CATEGORY_COLORS,
  FALLBACK_CATEGORY_PALETTE,
  PLATFORM_COLORS,
} from './toolkit-palette';

/**
 * Utilitaires purs partages par les sections du renderer HTML du toolkit
 * IA : escape HTML, normalisation de cles, lookup palette, resolution
 * plateforme, labels de niveau, en-tete et footer standards.
 *
 * Extraits du service god-object `ToolkitHtmlRendererService` pour :
 *   - permettre l'unit-test isole sans instancier Nest
 *   - etre reutilisables par chaque fonction de section
 */

/** Normalise une cle (minuscules, sans accents, trim). */
export function normalizeKey(raw: string): string {
  return raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/** Retourne la palette couleur d'une categorie, fallback accent par defaut. */
export function paletteFor(category: string): {
  bg: string;
  text: string;
  border: string;
} {
  const key = normalizeKey(category);
  return CATEGORY_COLORS[key] ?? FALLBACK_CATEGORY_PALETTE;
}

/** Retourne la couleur de bordure pour une plateforme de template. */
export function platformColorFor(platform: string): string {
  const key = normalizeKey(platform);
  return PLATFORM_COLORS[key] ?? ACCENT;
}

/** Traduit la cle interne de niveau en label affichable francais. */
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

/**
 * Echappe les caracteres HTML pour eviter toute injection dans les
 * sections (titres, descriptions, contenus utilisateur).
 */
export function escapeHtml(value: string): string {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/** Construit l'en-tete standard d'une section (gros numero + titre + sous-titre). */
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
