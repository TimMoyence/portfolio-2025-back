import { sansFin } from '../common/domain/texte/nettoyage/sans-bords';
import type { SupportedLocale } from '../common/domain/value-objects/LocaleCode';
import { envString, type SourceDEnv } from './environnement/env-readers.util';
import { cheminDeLApi } from './prefixe-api';

const URL_DU_SITE_PAR_DEFAUT = 'https://asilidesign.fr';

export function urlDuSite(source: SourceDEnv = process.env): string {
  return sansFin(
    envString('FRONTEND_URL', source) ?? URL_DU_SITE_PAR_DEFAUT,
    '/',
  );
}

export function pageDuSite(locale: SupportedLocale, chemin: string): string {
  return `${urlDuSite()}/${locale}/${chemin}`;
}

export function urlPubliqueDeLApi(
  chemin: string,
  source: SourceDEnv = process.env,
): string {
  return `${urlDuSite(source)}${cheminDeLApi(chemin, source)}`;
}
