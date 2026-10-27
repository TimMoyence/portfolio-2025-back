import type {
  Cours,
  Ecran,
} from '../../src/modules/formations/domain/contrats/cours';
import type { AuMoinsUn } from '../../src/common/domain/au-moins-un';
import { somme } from '../../src/common/domain/nombres/statistiques';
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
import { buildNumeriqueStockee } from './questions-stockees.factory';

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
    buildEcranDeFicheMemo(),
  ];
}

export function buildEcranDeFicheMemo({
  imprimable = true,
}: { readonly imprimable?: boolean } = {}): EcranDeCoursBrut {
  const screenId = 'B2-01-A1-04-FICHE-MEMO';
  return buildEcranDeBrique('fp-story', {
    screenId,
    titre: 'Fiche mémo',
    diffusion: 'catalogue',
    dureeMinutes: 2,
    proprietes: {
      presentation: {
        version: 2,
        screenId,
        renderer: 'grid',
        props: {
          title: 'Fiche mémo',
          imprimable,
          items: [{ title: 'Un point', description: 'Il compte des écarts.' }],
        },
      },
    },
  });
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
    dureeMinutes: somme(ecrans.map((ecran) => ecran.dureeMinutes)),
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
