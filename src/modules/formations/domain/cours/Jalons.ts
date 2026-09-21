import type { Cours } from '../contrats/cours';

export interface EcranDeJalon {
  readonly screenId: string;
  readonly rang: number;
}

export function ecranDeJalon(
  cours: Cours,
  sondageId: string,
): EcranDeJalon | null {
  for (const [rang, ecran] of cours.ecrans.entries()) {
    if (
      ecran.brique === 'fp-pulse' &&
      ecran.proprietes.sondage.id === sondageId
    ) {
      return { screenId: ecran.id, rang };
    }
  }
  return null;
}
