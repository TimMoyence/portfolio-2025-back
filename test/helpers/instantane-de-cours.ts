import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { DerouleCours } from '../../src/modules/formations/domain/contrats/deroule';
import type { CoursPublic } from '../../src/modules/formations/domain/contrats/tirage';
import type { ContenuDeCours } from '../../src/modules/formations/domain/cours/CoursStocke';
import { deroulePresentateur } from '../../src/modules/formations/domain/cours/DeroulePresentateur';
import { projeterCatalogue } from '../../src/modules/formations/domain/cours/Diffusion';
import { empreinteCanonique } from '../../src/modules/formations/domain/cours/EmpreinteCanonique';
import { tirer } from '../../src/modules/formations/domain/cours/Tirage';
import {
  buildCoursDuContenu,
  prefixeDuCours,
} from '../factories/contenus-de-cours.factory';

export interface Instantane {
  readonly graine: number;
  readonly empreinte: string;
  readonly sujet: CoursPublic;
  readonly deroule: DerouleCours;
  readonly catalogue: CoursPublic;
}

const GRAINE_DE_REFERENCE = 0;

export function cheminDeLInstantane(contenu: ContenuDeCours): string {
  return join(
    __dirname,
    '../fixtures/formations',
    `${prefixeDuCours(contenu).toLowerCase()}.instantane.json`,
  );
}

export function construireLInstantane(contenu: ContenuDeCours): Instantane {
  const cours = buildCoursDuContenu(contenu);
  const projection = {
    sujet: tirer(cours, GRAINE_DE_REFERENCE).sujet,
    deroule: deroulePresentateur(cours, GRAINE_DE_REFERENCE),
    catalogue: projeterCatalogue(cours),
  };
  return {
    graine: GRAINE_DE_REFERENCE,
    empreinte: empreinteCanonique(projection),
    ...projection,
  };
}

export function lireLInstantane(contenu: ContenuDeCours): Instantane {
  return JSON.parse(
    readFileSync(cheminDeLInstantane(contenu), 'utf8'),
  ) as Instantane;
}
