import { BlankFieldError } from './errors/FormationErrors';

export function texteRenseigne(valeur: string, champ: string): string {
  const texte = valeur.trim();
  if (texte.length === 0) {
    throw new BlankFieldError(champ);
  }
  return texte;
}
