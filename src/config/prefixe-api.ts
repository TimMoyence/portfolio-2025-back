import { sansBords } from '../common/domain/texte/sans-bords';
import type { SourceDEnv } from './env-readers.util';

export const PREFIXE_API_PAR_DEFAUT = 'api/v1/portfolio25';

export function prefixeApi(source: SourceDEnv = process.env): string {
  const brut = source.API_PREFIX;
  return sansBords(
    typeof brut === 'string' ? brut.trim() : PREFIXE_API_PAR_DEFAUT,
    '/',
  );
}

export function cheminDeLApi(
  chemin: string,
  source: SourceDEnv = process.env,
): string {
  const segments = [prefixeApi(source), sansBords(chemin, '/')];
  return `/${segments.filter(Boolean).join('/')}`;
}
