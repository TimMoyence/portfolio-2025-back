import { Injectable } from '@nestjs/common';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { TYPES_DE_FICHIER } from '../../../../common/domain/types/types-de-fichier';
import { CLASSEUR_RESERVE } from '../../domain/cours/ProprietesStockees';
import type {
  ClasseurTelecharge,
  IClasseursDeCours,
} from '../../domain/IClasseursDeCours.port';

export function classeurATelecharger(
  classeur: string,
): Omit<ClasseurTelecharge, 'contenu'> {
  const correspondance = CLASSEUR_RESERVE.exec(classeur);
  if (correspondance === null) {
    throw new Error(`Classeur hors du format servi : ${classeur}`);
  }
  const [, base, extension] = correspondance;
  return {
    nom: `${base}.${extension}`,
    type: TYPES_DE_FICHIER[extension as keyof typeof TYPES_DE_FICHIER],
  };
}

@Injectable()
export class ClasseursSurDisque implements IClasseursDeCours {
  async lire(classeur: string): Promise<ClasseurTelecharge> {
    const servi = classeurATelecharger(classeur);
    return { ...servi, contenu: await readFile(join(__dirname, classeur)) };
  }
}
