import type { SourceDEnv } from './env-readers.util';

export const PREFIXE_API_PAR_DEFAUT = 'api/v1/portfolio25';

function sansBarresAuxBords(valeur: string): string {
  let debut = 0;
  let fin = valeur.length;
  while (debut < fin && valeur[debut] === '/') debut += 1;
  while (fin > debut && valeur[fin - 1] === '/') fin -= 1;
  return valeur.slice(debut, fin);
}

export function prefixeApi(source: SourceDEnv = process.env): string {
  const brut = source.API_PREFIX;
  return sansBarresAuxBords(
    typeof brut === 'string' ? brut.trim() : PREFIXE_API_PAR_DEFAUT,
  );
}

export function cheminDeLApi(
  chemin: string,
  source: SourceDEnv = process.env,
): string {
  const segments = [prefixeApi(source), sansBarresAuxBords(chemin)];
  return `/${segments.filter(Boolean).join('/')}`;
}
