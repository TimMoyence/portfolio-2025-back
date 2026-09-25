import type { BaremeV2 } from '../../src/modules/formations/domain/contrats/bareme';
import type { Cours } from '../../src/modules/formations/domain/contrats/cours';
import { ouvrirTirages } from '../../src/modules/formations/domain/cours/OuvertureTirages';
import { tireurSequentiel } from './cours.factory';
import {
  type ContenuDeCours,
  type ContenuDeCoursBrut,
  lireCoursStocke,
} from '../../src/modules/formations/domain/cours/CoursStocke';
import type { IPublicationDesCours } from '../../src/modules/formations/domain/cours/IPublicationDesCours.port';
import { COURS_B2_01 } from '../../src/modules/formations/infrastructure/contenus/b2-01.cours';

export const VERSION_PUBLIEE_DE_TEST = 1;

export function buildContenuAPublierB2_01(): ContenuDeCours {
  return structuredClone(COURS_B2_01);
}

export function createMockPublicationDesCours(): jest.Mocked<IPublicationDesCours> {
  return {
    empreintePubliee: jest.fn().mockResolvedValue(null),
    publier: jest.fn().mockResolvedValue(VERSION_PUBLIEE_DE_TEST),
  };
}

export function buildContenuB2_01(
  version = VERSION_PUBLIEE_DE_TEST,
): ContenuDeCoursBrut {
  return structuredClone({ ...COURS_B2_01, version });
}

export function buildCoursB2_01(version = VERSION_PUBLIEE_DE_TEST): Cours {
  return lireCoursStocke(buildContenuB2_01(version));
}

export function ouvrirLeBaremeV2DuB2_01(cours: Cours): BaremeV2 {
  const bareme = ouvrirTirages(cours, tireurSequentiel(1));

  expect(bareme.version).toBe(2);
  expect(bareme.tirages).toHaveLength(60);
  return bareme;
}
