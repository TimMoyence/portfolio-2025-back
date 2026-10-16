import { estObjet } from '../../../../common/domain/est-objet';
import {
  ESPACE_FINE_INSECABLE,
  ESPACE_INSECABLE,
  sansEspacesTypographiques,
} from '../../../../common/domain/texte/sans-espaces-typographiques';
import { estUneFormule } from './Formule';

const MILLIERS = new RegExp(
  `(?<!\\d)(\\d{1,3})[ ${ESPACE_INSECABLE}](?=\\d{3}(?!\\d))`,
  'g',
);
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

function finDeLaFormule(texte: string): number {
  let profondeur = 0;
  let entreGuillemets = false;
  for (
    let rang = texte.length - texte.trimStart().length;
    rang < texte.length;
    rang += 1
  ) {
    const signe = texte[rang];
    if (signe === '"') {
      entreGuillemets = !entreGuillemets;
    } else if (!entreGuillemets && signe === '(') {
      profondeur += 1;
    } else if (!entreGuillemets && signe === ')') {
      profondeur -= 1;
    } else if (!entreGuillemets && profondeur <= 0 && /\s/u.test(signe)) {
      return rang;
    }
  }
  return texte.length;
}

function lier(prose: string): string {
  return prose
    .replace(MILLIERS, `$1${ESPACE_FINE_INSECABLE}`)
    .replace(NOMBRE_PUIS_UNITE, `$1${ESPACE_INSECABLE}`)
    .replace(AVANT_PONCTUATION_HAUTE, ESPACE_INSECABLE)
    .replace(APRES_GUILLEMET_OUVRANT, `«${ESPACE_INSECABLE}`)
    .replace(ORDINAL, ordinal);
}

function lierHorsDesCitations(
  prose: string,
  citations: readonly string[],
): string {
  const citation = citations.find(
    (candidate) => candidate !== '' && prose.includes(candidate),
  );
  return citation === undefined
    ? lier(prose)
    : prose
        .split(citation)
        .map((morceau) => lierHorsDesCitations(morceau, citations))
        .join(citation);
}

export function typographier(
  texte: string,
  citations: readonly string[] = [],
): string {
  if (!estUneFormule(texte)) {
    return lierHorsDesCitations(texte, citations);
  }
  const fin = finDeLaFormule(texte);
  return `${texte.slice(0, fin)}${lierHorsDesCitations(texte.slice(fin), citations)}`;
}

export function sansTypographie(texte: string): string {
  return sansEspacesTypographiques(texte)
    .replaceAll('ᵉʳ', 'er')
    .replaceAll('ʳᵉ', 're')
    .replaceAll('ᵉ', 'e');
}

export function typographierEnProfondeur<T>(
  valeur: T,
  citations: readonly string[] = [],
): T {
  if (typeof valeur === 'string') {
    return typographier(valeur, citations) as T;
  }
  if (Array.isArray(valeur)) {
    return valeur.map((element: unknown) =>
      typographierEnProfondeur(element, citations),
    ) as T;
  }
  if (estObjet(valeur)) {
    return Object.fromEntries(
      Object.entries(valeur).map(([cle, contenu]) => [
        cle,
        typographierEnProfondeur(contenu, citations),
      ]),
    ) as T;
  }
  return valeur;
}
