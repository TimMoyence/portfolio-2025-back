import { Injectable } from '@nestjs/common';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { CLASSEUR_RESERVE } from '../../domain/cours/ProprietesStockees';
import type { IClasseursDeCours } from '../../domain/IClasseursDeCours.port';

@Injectable()
export class ClasseursSurDisque implements IClasseursDeCours {
  async lire(classeur: string): Promise<Uint8Array> {
    if (!CLASSEUR_RESERVE.test(classeur)) {
      throw new Error(`Classeur hors du format servi : ${classeur}`);
    }
    return readFile(join(__dirname, classeur));
  }
}
