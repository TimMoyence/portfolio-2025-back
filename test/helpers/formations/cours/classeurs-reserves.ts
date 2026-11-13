import { createHash } from 'node:crypto';
import {
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import {
  nomServi,
  type TypeDeFichier,
} from '../../../../src/common/domain/types/types-de-fichier';
import type { Cours } from '../../../../src/modules/formations/domain/contrats/cours';
import { estReservee } from '../../../../src/modules/formations/domain/cours/structure/Cours';
import { RACINE } from '../../depot/racine';

const DOSSIER_DES_CLASSEURS = join(
  RACINE,
  'src/modules/formations/infrastructure/classeurs',
);

export interface ClasseurReserve {
  readonly ecranId: string;
  readonly classeur: string;
}

export function classeursReservesDe(cours: Cours): ClasseurReserve[] {
  return cours.ecrans.flatMap(({ id, pieceJointe }) =>
    pieceJointe !== undefined && estReservee(pieceJointe)
      ? [{ ecranId: id, classeur: pieceJointe.classeur }]
      : [],
  );
}

export function cheminDuClasseur(classeur: string): string {
  return join(DOSSIER_DES_CLASSEURS, classeur);
}

export function octetsDuClasseur(classeur: string): Buffer {
  return readFileSync(cheminDuClasseur(classeur));
}

export const empreinteDe = (contenu: string | Buffer): string =>
  createHash('sha256').update(contenu).digest('hex');

export const nomServiDe = (
  base: string,
  octets: Buffer,
  extension: TypeDeFichier,
): string => nomServi(base, empreinteDe(octets), extension);

export function ecrireLeFichierServi(
  dossier: string,
  base: string,
  octets: Buffer,
  extension: TypeDeFichier,
): string {
  mkdirSync(dossier, { recursive: true });
  const fichier = nomServiDe(base, octets, extension);
  for (const ancien of readdirSync(dossier)) {
    if (ancien.startsWith(`${base}.`) && ancien !== fichier) {
      rmSync(join(dossier, ancien));
    }
  }
  writeFileSync(join(dossier, fichier), octets);
  return fichier;
}
