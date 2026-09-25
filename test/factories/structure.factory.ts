import type {
  Cours,
  Ecran,
} from '../../src/modules/formations/domain/contrats/cours';
import type { AuMoinsUn } from '../../src/modules/formations/domain/cours/Cours';
import {
  lireCoursStocke,
  type EcranDeCoursBrut,
} from '../../src/modules/formations/domain/cours/CoursStocke';
import { verifierStructure } from '../../src/modules/formations/domain/cours/StructureCours';
import {
  buildCoursDeBriques,
  buildEcranDeBrique,
  buildProprietesStockees,
} from './ecrans-stockes.factory';
import {
  buildNumeriqueStockee,
  buildOptionStockee,
  buildVoteStocke,
} from './questions-stockees.factory';

export const QUESTION_DU_BILLET = buildVoteStocke({
  id: 'b2-01-a6-billet',
  concept: 'point-de-pourcentage',
  enonce:
    'Le taux de retour des colis passe de 4 % à 5 %. Quelle phrase est exacte ?',
  options: [
    buildOptionStockee('Il gagne un point', null),
    buildOptionStockee('Il gagne 1 %', 'points-confondus-avec-pourcentage'),
  ],
  segments: ['gagne', 'point'],
});

export function buildEcransStockesConformes(): EcranDeCoursBrut[] {
  return [
    buildEcranDeBrique('fp-recall', {
      screenId: 'B2-01-A1-01-DIAGNOSTIC',
      titre: 'Diagnostic',
      dureeMinutes: 3,
    }),
    buildEcranDeBrique('fp-quote', {
      screenId: 'B2-01-A1-02-CITATION',
      titre: 'Un chiffre à lire',
      diffusion: 'catalogue',
      dureeMinutes: 2,
    }),
    buildEcranDeBrique('questionnaire', {
      screenId: 'B2-01-A1-03-ATELIER',
      titre: 'Atelier',
      proprietes: {
        ...buildProprietesStockees('questionnaire'),
        questions: [buildNumeriqueStockee()],
      },
    }),
    buildEcranDeBrique('fp-exit', {
      screenId: 'B2-01-A1-04-BILLET',
      titre: 'Billet de sortie',
      dureeMinutes: 3,
      proprietes: {
        questions: [QUESTION_DU_BILLET],
        invite: 'Justifiez en une phrase.',
      },
    }),
  ];
}

export function buildCoursConforme(
  ecrans: readonly EcranDeCoursBrut[] = buildEcransStockesConformes(),
): Cours {
  return lireCoursStocke(buildCoursDeBriques(ecrans));
}

export function lireEcranStocke(ecran: EcranDeCoursBrut): Ecran {
  return lireCoursStocke(buildCoursDeBriques([ecran])).ecrans[0];
}

export function fuitesDeConfidentialite(
  cours: Cours,
): readonly (string | null)[] {
  return verifierStructure(cours)
    .filter((violation) => violation.regle === 'confidentialite')
    .map((violation) => violation.ecran);
}

export function recomposer(cours: Cours, ecrans: AuMoinsUn<Ecran>): Cours {
  return {
    ...cours,
    ecrans,
    dureeMinutes: ecrans.reduce(
      (total, ecran) => total + ecran.dureeMinutes,
      0,
    ),
  };
}

export function buildEcranDeCitation(
  id: string,
  dureeMinutes: number,
  overrides: Partial<EcranDeCoursBrut> = {},
): Ecran {
  const lu = lireEcranStocke(
    buildEcranDeBrique('fp-quote', {
      titre: `Citation ${id}`,
      dureeMinutes: 1,
      ...overrides,
    }),
  );
  return { ...lu, id, dureeMinutes };
}

export function buildEcranDAtelier(
  id: string,
  dureeMinutes: number,
  questionId: string,
): Ecran {
  return lireEcranStocke(
    buildEcranDeBrique('questionnaire', {
      screenId: id,
      titre: `Atelier ${id}`,
      dureeMinutes,
      proprietes: {
        ...buildProprietesStockees('questionnaire'),
        questions: [buildNumeriqueStockee({ id: questionId })],
      },
    }),
  );
}

export function buildEcranDExemple(id: string, invite: string): Ecran {
  const proprietes = buildProprietesStockees('fp-worked');
  const exemple = proprietes.exemple as { readonly etapes: object[] };
  return {
    ...lireEcranStocke(
      buildEcranDeBrique('fp-worked', {
        dureeMinutes: 5,
        proprietes: {
          ...proprietes,
          exemple: {
            ...exemple,
            etapes: [{ ...exemple.etapes[0], invite }],
          },
        },
      }),
    ),
    id,
  };
}
