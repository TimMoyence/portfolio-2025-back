import {
  PAGE_PRIVEE_DU_TOOLKIT,
  PARAMETRE_DU_JETON,
} from '../../domain/lien-avec-jeton';

export const CENSURE = '[REDACTED]';

function decode(composant: string): string {
  try {
    return decodeURIComponent(composant);
  } catch {
    return composant;
  }
}

function porteLeJeton(nom: string): boolean {
  return nom === PARAMETRE_DU_JETON || nom.startsWith(`${PARAMETRE_DU_JETON}[`);
}

function cheminSansJeton(chemin: string, jeton: unknown): string {
  if (typeof jeton !== 'string' || jeton === '') {
    return chemin;
  }
  return chemin
    .split('/')
    .map((segment) => (decode(segment) === jeton ? CENSURE : segment))
    .join('/');
}

function requeteSansJeton(requete: string): string {
  return requete
    .split('&')
    .map((paire) => {
      const [nom] = paire.split('=', 1);
      return porteLeJeton(decode(nom)) ? `${nom}=${CENSURE}` : paire;
    })
    .join('&');
}

function cheminDePageSansJeton(chemin: string): string {
  const debutDeLaPage = chemin.indexOf(PAGE_PRIVEE_DU_TOOLKIT);
  if (debutDeLaPage < 0) {
    return chemin;
  }
  const debutDuJeton = debutDeLaPage + PAGE_PRIVEE_DU_TOOLKIT.length;
  const segmentSuivant = chemin.indexOf('/', debutDuJeton);
  const finDuJeton = segmentSuivant < 0 ? chemin.length : segmentSuivant;
  if (finDuJeton === debutDuJeton) {
    return chemin;
  }
  return `${chemin.slice(0, debutDuJeton)}${CENSURE}${chemin.slice(finDuJeton)}`;
}

function censurer(
  url: string,
  cheminCensure: (chemin: string) => string,
): string {
  const debutDeLaRequete = url.indexOf('?');
  if (debutDeLaRequete < 0) {
    return cheminCensure(url);
  }
  const chemin = cheminCensure(url.slice(0, debutDeLaRequete));
  return `${chemin}?${requeteSansJeton(url.slice(debutDeLaRequete + 1))}`;
}

export function urlJournalisable(
  url: string,
  parametres?: Readonly<Record<string, unknown>>,
): string {
  return censurer(url, (chemin) =>
    cheminSansJeton(chemin, parametres?.[PARAMETRE_DU_JETON]),
  );
}

export function referentJournalisable(referent: string): string {
  return censurer(referent, cheminDePageSansJeton);
}
