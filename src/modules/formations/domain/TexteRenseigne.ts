import { longueurDeTexte } from '../../../common/domain/texte/longueur-de-texte';
import { BlankFieldError, FieldTooLongError } from './errors/FormationErrors';

export function texteRenseigne(
  valeur: string,
  champ: string,
  longueurMax = Number.POSITIVE_INFINITY,
): string {
  const texte = valeur.trim();
  if (texte.length === 0) {
    throw new BlankFieldError(champ);
  }
  assertLongueurAuPlus(texte, champ, longueurMax);
  return texte;
}

function assertLongueurAuPlus(
  texte: string,
  champ: string,
  longueurMax: number,
): void {
  if (longueurDeTexte(texte) > longueurMax) {
    throw new FieldTooLongError(champ, longueurMax);
  }
}
