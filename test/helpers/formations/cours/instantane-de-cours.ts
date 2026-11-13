import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Cours } from '../../../../src/modules/formations/domain/contrats/cours';
import type { DerouleCours } from '../../../../src/modules/formations/domain/contrats/deroule';
import type { CoursPublic } from '../../../../src/modules/formations/domain/contrats/tirage';
import type { ContenuDeCours } from '../../../../src/modules/formations/domain/cours/stockage/CoursStocke';
import { deroulePresentateur } from '../../../../src/modules/formations/domain/cours/diffusion/DeroulePresentateur';
import { projeterCatalogue } from '../../../../src/modules/formations/domain/cours/diffusion/Diffusion';
import { empreinteCanonique } from '../../../../src/modules/formations/domain/cours/confidentialite/EmpreinteCanonique';
import { tirer } from '../../../../src/modules/formations/domain/cours/tirage/Tirage';
import {
  buildCoursDuContenu,
  prefixeDuCours,
} from '../../../factories/formations/cours/contenus-de-cours.factory';

export interface Instantane {
  readonly graine: number;
  readonly empreinte: string;
  readonly sujet: CoursPublic;
  readonly deroule: DerouleCours;
  readonly catalogue: CoursPublic;
}

const GRAINE_DE_REFERENCE = 0;

export function cheminDeLInstantane(contenu: ContenuDeCours): string {
  const cours = prefixeDuCours(contenu).toLowerCase();
  return join(
    __dirname,
    '../../../fixtures/formations',
    contenu.niveau.toLowerCase(),
    `${cours}.instantane.json`,
  );
}

function projectionServie(
  cours: Cours,
): Omit<Instantane, 'graine' | 'empreinte'> {
  return {
    sujet: tirer(cours, GRAINE_DE_REFERENCE).sujet,
    deroule: deroulePresentateur(cours, GRAINE_DE_REFERENCE),
    catalogue: projeterCatalogue(cours),
  };
}

export function empreinteServie(cours: Cours): string {
  return empreinteCanonique(projectionServie(cours));
}

export function construireLInstantane(contenu: ContenuDeCours): Instantane {
  const projection = projectionServie(buildCoursDuContenu(contenu));
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
