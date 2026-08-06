import type { Request } from 'express';

/**
 * Resout l'adresse IP du client a partir d'une requete Express.
 *
 * `req.ip` est calcule par Express en fonction de `trust proxy`
 * (`src/main.ts`) : il ne fait confiance qu'au nombre de bonds declare.
 * On ne reparse jamais `X-Forwarded-For` a la main — cet en-tete est
 * fourni en entier par le client, et en retenir la premiere entree
 * revient a laisser l'appelant choisir l'IP sous laquelle il est trace,
 * voire attribuer son activite a un tiers. `X-Real-IP` est ecarte pour
 * la meme raison : en-tete brut, non valide par cette couche.
 *
 * La forme IPv4-mappee-IPv6 (`::ffff:1.2.3.4`) est normalisee vers sa
 * notation IPv4 : sans cela une meme adresse produit deux cles
 * distinctes dans les agregats, et le format n'est pas exploitable par
 * les outils de bannissement en amont.
 *
 * @param req - requete Express en cours
 * @returns l'IP client normalisee, ou `null` si elle est indeterminable
 */
export function resolveClientIp(req: Request): string | null {
  const raw = req.ip ?? req.socket?.remoteAddress;
  if (!raw) return null;
  return normalizeIp(raw);
}

/**
 * Variante non-nullable, pour les appelants qui persistent une valeur
 * obligatoire.
 *
 * @param req - requete Express en cours
 * @returns l'IP client normalisee, ou `'unknown'` a defaut
 */
export function resolveClientIpOrUnknown(req: Request): string {
  return resolveClientIp(req) ?? 'unknown';
}

/** Reduit `::ffff:1.2.3.4` a `1.2.3.4`, laisse les autres formes intactes. */
function normalizeIp(ip: string): string {
  const mapped = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i.exec(ip);
  return mapped ? mapped[1] : ip;
}
