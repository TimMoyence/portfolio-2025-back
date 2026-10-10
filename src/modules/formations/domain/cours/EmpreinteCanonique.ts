import { empreinteSha256 } from '../../../../common/domain/crypto/empreintes';
import { estObjet } from '../../../../common/domain/est-objet';

function comparerParUnitesDeCode(premiere: string, seconde: string): number {
  if (premiere === seconde) {
    return 0;
  }
  return premiere < seconde ? -1 : 1;
}

function serialiserCanonique(valeur: unknown): string {
  if (Array.isArray(valeur)) {
    return `[${valeur.map(serialiserCanonique).join(',')}]`;
  }
  if (estObjet(valeur)) {
    const membres = Object.keys(valeur)
      .sort(comparerParUnitesDeCode)
      .map(
        (cle) => `${JSON.stringify(cle)}:${serialiserCanonique(valeur[cle])}`,
      );
    return `{${membres.join(',')}}`;
  }
  return JSON.stringify(valeur);
}

export function empreinteCanonique(valeur: unknown): string {
  const telQueStocke: unknown =
    valeur === undefined ? null : JSON.parse(JSON.stringify(valeur));
  return empreinteSha256(serialiserCanonique(telQueStocke));
}
