import { createRequire } from 'node:module';
import { join } from 'node:path';

export const CLASSEURS_DANS_DIST =
  'modules/formations/infrastructure/classeurs';

const typesDeFichier = (racine) =>
  createRequire(join(racine, 'package.json'))(
    './dist/common/domain/types/types-de-fichier.js',
  );

export function extensionsServies(racine) {
  return Object.keys(typesDeFichier(racine).TYPES_DE_FICHIER);
}

export function fichierServi(racine) {
  return new RegExp(`${typesDeFichier(racine).NOM_SERVI}$`);
}
