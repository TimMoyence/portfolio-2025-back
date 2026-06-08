/**
 * Utilitaires purs de rendering pour les mailers audit-requests. Ne contient
 * aucune dependance Nest ni logique metier : uniquement des transformations
 * de chaine reutilisables par les differents mailers (notification, client
 * report, expert report).
 */

/**
 * Re-export de l'util commun `escapeHtml` (echappement HTML anti-XSS) afin de
 * preserver les imports historiques `from './mail-rendering.util'` sans
 * dupliquer la table d'echappement.
 */
export { escapeHtml } from '../../../../common/infrastructure/mail/html-escape.util';

/**
 * Convertit une chaine (typiquement un nom de site) en slug ASCII safe pour
 * un nom de fichier : minuscules, accents retires, separateurs non
 * alphanumeriques remplaces par `-`, longueur limitee a 60 caracteres.
 * Retourne `'audit'` en fallback si le slug resultant est vide.
 */
export function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'audit'
  );
}
