import {
  COULEURS_DES_PLATEFORMES,
  TEINTE_DES_CATEGORIES,
  type Plateforme,
  type Teinte,
} from './toolkit-palette';
import {
  escapeHtml,
  escapeUrl,
  safeHtml,
} from '../../../../common/infrastructure/mail/html-escape.util';
import type { EscapedHtml } from '../../../../common/infrastructure/mail/html-escape.util';
import { sectionHeader } from '../../../../common/infrastructure/mail/section-header';

function normalizeKey(raw: string): string {
  return raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function estUnePlateforme(cle: string): cle is Plateforme {
  return Object.hasOwn(COULEURS_DES_PLATEFORMES, cle);
}

export function teinteDe(category: string): Teinte {
  return TEINTE_DES_CATEGORIES.get(normalizeKey(category)) ?? 'accent';
}

export function plateformeDe(platform: string): Plateforme {
  const key = normalizeKey(platform);
  return estUnePlateforme(key) ? key : 'accent';
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

export { escapeHtml, escapeUrl, safeHtml, sectionHeader };
export type { EscapedHtml };

/**
 * Footer de page neutre. Retourne une chaine vide pour eviter
 * les problemes de positionnement absolu apres suppression du
 * min-height: 297mm sur .page. Le footer est rendu via la marge
 * @page de Puppeteer si necessaire.
 */
export function pageFooter(): EscapedHtml {
  return safeHtml``;
}
