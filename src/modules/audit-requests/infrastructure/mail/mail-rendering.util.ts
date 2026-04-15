/**
 * Utilitaires purs de rendering pour les mailers audit-requests. Ne contient
 * aucune dependance Nest ni logique metier : uniquement des transformations
 * de chaine reutilisables par les differents mailers (notification, client
 * report, expert report).
 */

/**
 * Echappe les caracteres HTML sensibles (`&`, `<`, `>`, `"`, `'`) pour eviter
 * toute injection dans les templates HTML generes cote mailer. A appliquer
 * sur toute donnee d'origine externe ou LLM inseree dans un template.
 */
export function escapeHtml(input: string): string {
  return input
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

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
