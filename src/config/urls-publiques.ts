import { lienAvecJeton } from '../common/domain/lien-avec-jeton';
import { sansFin } from '../common/domain/texte/sans-bords';
import { envString, type SourceDEnv } from './env-readers.util';
import { cheminDeLApi } from './prefixe-api';

const URL_DU_SITE_PAR_DEFAUT = 'https://asilidesign.fr';

export function urlDuSite(source: SourceDEnv = process.env): string {
  return sansFin(
    envString('FRONTEND_URL', source) ?? URL_DU_SITE_PAR_DEFAUT,
    '/',
  );
}

export function urlPubliqueDeLApi(
  chemin: string,
  source: SourceDEnv = process.env,
): string {
  return `${urlDuSite(source)}${cheminDeLApi(chemin, source)}`;
}

export function lienDeDesabonnement(
  jeton: string,
  source: SourceDEnv = process.env,
): string {
  return lienAvecJeton(
    urlPubliqueDeLApi('newsletter/unsubscribe', source),
    jeton,
  );
}
