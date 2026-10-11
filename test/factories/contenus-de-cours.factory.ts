import { mapperAuMoinsUn } from '../../src/common/domain/au-moins-un';
import type { Cours } from '../../src/modules/formations/domain/contrats/cours';
import type { CorrectionSurPlace } from '../../src/modules/formations/domain/cours/Cours';
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

export function buildCoursAvecExplicationAllongee(
  cours: Cours,
  reference: string,
  ajout: string,
): Cours {
  let allongees = 0;
  const ecrans = mapperAuMoinsUn(cours.ecrans, (ecran) => {
    const correction = ecran.correctionSurPlace;
    if (correction === undefined) {
      return ecran;
    }
    const correctionSurPlace: CorrectionSurPlace = {
      explications: mapperAuMoinsUn(correction.explications, (explication) => {
        if (explication.reference !== reference) {
          return explication;
        }
        allongees += 1;
        return { ...explication, texte: `${explication.texte} ${ajout}` };
      }),
    };
    return { ...ecran, correctionSurPlace };
  });
  if (allongees !== 1) {
    throw new Error(`${reference} : ${allongees} explication(s) au lieu d’une`);
  }
  return { ...cours, ecrans };
}

export function prefixeDuCours(contenu: ContenuDeCours): string {
  return contenu.slug.slice(0, 'b2-01'.length).toUpperCase();
}
