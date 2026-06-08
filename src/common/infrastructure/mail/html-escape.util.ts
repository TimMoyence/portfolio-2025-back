/**
 * Echappe les caracteres HTML sensibles (`&`, `<`, `>`, `"`, `'`) pour eviter
 * toute injection XSS dans les templates HTML generes (mails, rapports PDF).
 *
 * A appliquer sur toute donnee d'origine externe ou LLM inseree dans un
 * template HTML. `&` est echappe en premier afin de ne pas re-echapper les
 * entites produites par les substitutions suivantes.
 *
 * La valeur est coercee via `String(value)` (variante defensive) : la fonction
 * ne throw jamais, meme sur `null` / `undefined` ou une valeur non-string.
 *
 * Mutualise les copies historiques identiques presentes dans les mailers
 * (contacts, users, lead-magnets, newsletter) et les renderers HTML
 * (audit-requests).
 *
 * @param value - valeur a echapper (coercee en chaine)
 * @returns la chaine HTML-safe
 */
export function escapeHtml(value: unknown): string {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
