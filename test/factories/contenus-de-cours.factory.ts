import type { Cours } from '../../src/modules/formations/domain/contrats/cours';
import {
  type ContenuDeCours,
  type ContenuDeCoursBrut,
  lireCoursStocke,
} from '../../src/modules/formations/domain/cours/CoursStocke';

export const VERSION_PUBLIEE_DE_TEST = 1;

export function buildContenuDuCours(
  contenu: ContenuDeCours,
  version = VERSION_PUBLIEE_DE_TEST,
): ContenuDeCoursBrut {
  return structuredClone({ ...contenu, version });
}

export function buildCoursDuContenu(
  contenu: ContenuDeCours,
  version = VERSION_PUBLIEE_DE_TEST,
): Cours {
  return lireCoursStocke(buildContenuDuCours(contenu, version));
}

export function prefixeDuCours(contenu: ContenuDeCours): string {
  return contenu.slug.slice(0, 'b2-01'.length).toUpperCase();
}
