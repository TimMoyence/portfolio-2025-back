import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Cours } from '../../src/modules/formations/domain/contrats/cours';
import { estReservee } from '../../src/modules/formations/domain/cours/Cours';

const DOSSIER_DES_CLASSEURS = join(
  __dirname,
  '../../src/modules/formations/infrastructure/classeurs',
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
