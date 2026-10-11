import { estObjet } from '../../../../common/domain/est-objet';
import { estUneFormule } from 'portfolio-2025-partage/formule';

export const ESPACE_INSECABLE = String.fromCodePoint(0xa0);

const MILLIERS = /(?<!\d)(\d{1,3}) (?=\d{3}(?!\d))/g;
const NOMBRE_PUIS_UNITE = /(\d) (?=(?:%|‰|[kM]?€|kWh|km|kg)(?!\p{L}))/gu;
const AVANT_PONCTUATION_HAUTE = / (?=[;:?!»])/g;
const APRES_GUILLEMET_OUVRANT = /« /g;
const ORDINAL = /(?<![\p{L}\d\-_/.])(?:(1)(er|re)|(\d+)e)(?![\p{L}\d\-_/^(])/gu;
const EXPOSANTS_DU_PREMIER: Readonly<Record<string, string>> = {
  er: 'ᵉʳ',
  re: 'ʳᵉ',
};

function ordinal(
  _trouve: string,
  premier: string | undefined,
  genre: string | undefined,
  rang: string | undefined,
): string {
  return premier !== undefined && genre !== undefined
    ? `${premier}${EXPOSANTS_DU_PREMIER[genre]}`
    : `${rang}ᵉ`;
}

export function typographier(texte: string): string {
  if (estUneFormule(texte)) {
    return texte;
  }
  return texte
    .replace(MILLIERS, `$1${ESPACE_INSECABLE}`)
    .replace(NOMBRE_PUIS_UNITE, `$1${ESPACE_INSECABLE}`)
    .replace(AVANT_PONCTUATION_HAUTE, ESPACE_INSECABLE)
    .replace(APRES_GUILLEMET_OUVRANT, `«${ESPACE_INSECABLE}`)
    .replace(ORDINAL, ordinal);
}

export function sansTypographie(texte: string): string {
  return texte
    .replaceAll(ESPACE_INSECABLE, ' ')
    .replaceAll('ᵉʳ', 'er')
    .replaceAll('ʳᵉ', 're')
    .replaceAll('ᵉ', 'e');
}

export function typographierEnProfondeur<T>(valeur: T): T {
  if (typeof valeur === 'string') {
    return typographier(valeur) as T;
  }
  if (Array.isArray(valeur)) {
    return valeur.map((element: unknown) =>
      typographierEnProfondeur(element),
    ) as T;
  }
  if (estObjet(valeur)) {
    return Object.fromEntries(
      Object.entries(valeur).map(([cle, contenu]) => [
        cle,
        typographierEnProfondeur(contenu),
      ]),
    ) as T;
  }
  return valeur;
}
