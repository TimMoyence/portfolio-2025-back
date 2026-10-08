import type { EcranDeCoursBrut } from '../../src/modules/formations/domain/cours/CoursStocke';
import type { Cours } from '../../src/modules/formations/domain/contrats/cours';
import { lireCoursStocke } from '../../src/modules/formations/domain/cours/CoursStocke';
import {
  buildCorrectionDeReponses,
  buildCoursDeBriques,
  buildEcranDeBrique,
  buildProprietesStockees,
} from './ecrans-stockes.factory';
import { PRESENTATIONS_VISUELLES_VALIDES } from './presentation-visuelle.factory';
import { buildNumeriqueStockee } from './questions-stockees.factory';
import { buildEcransStockesConformes } from './structure.factory';

export function notesDExercice(
  reflexion: number,
  travail: number,
  correction?: number,
): string {
  const tempsDeCorrection =
    correction === undefined ? '' : ` · correction ${correction} min`;
  return [
    `• Temps : réflexion ${reflexion} min · travail ${travail} min${tempsDeCorrection}`,
    '• Relancer les binômes bloqués.',
  ].join('\n');
}

export function corrigeSurPlaceV3(
  exercice: EcranDeCoursBrut,
  references: readonly string[] = [`${exercice.screenId.toLowerCase()}-q`],
): EcranDeCoursBrut {
  return {
    ...exercice,
    dureeMinutes: 12,
    notes: notesDExercice(2, 6, 4),
    proprietes: {
      ...exercice.proprietes,
      correctionSurPlace: {
        explications: references.map((reference) => ({
          reference,
          texte: 'La réponse expliquée.',
        })),
      },
    },
  };
}

function ecranV2(
  screenId: string,
  renderer: string,
  dureeMinutes: number,
): EcranDeCoursBrut {
  return buildEcranDeBrique('fp-story', {
    screenId,
    titre: `Écran ${renderer}`,
    dureeMinutes,
    proprietes: {
      presentation: {
        version: 2,
        screenId,
        renderer,
        props: PRESENTATIONS_VISUELLES_VALIDES[renderer],
      },
    },
  });
}

export function buildReflexionV3(screenId: string): EcranDeCoursBrut {
  return ecranV2(screenId, 'reflection', 3);
}

export function buildLeconV3(screenId: string): EcranDeCoursBrut {
  return ecranV2(screenId, 'lesson', 5);
}

export function buildExerciceV3(screenId: string): EcranDeCoursBrut {
  return buildEcranDeBrique('questionnaire', {
    screenId,
    titre: 'Exercice',
    dureeMinutes: 8,
    notes: notesDExercice(2, 6),
    proprietes: {
      ...buildProprietesStockees('questionnaire'),
      questions: [buildNumeriqueStockee({ id: `${screenId.toLowerCase()}-q` })],
    },
  });
}

export function buildMiniSituationV3(screenId: string): EcranDeCoursBrut {
  return buildEcranDeBrique('fp-escape', {
    screenId,
    titre: 'Mini-situation CCF',
    dureeMinutes: 10,
    notes: notesDExercice(2, 8),
  });
}

export const IDS_V3 = {
  reflexion: 'B2-02-A1-02-REFLEXION',
  lecon: 'B2-02-A1-03-LECON',
  exercice: 'B2-02-A1-04-EXERCICE',
  correction: 'B2-02-A1-05-CORRECTION',
  miniSituation: 'B2-02-A4-01-MINI-SITUATION',
  correctionFinale: 'B2-02-A4-02-CORRECTION',
} as const;

export function buildEcransV3Conformes(): EcranDeCoursBrut[] {
  const [ouverture, , , cloture] = buildEcransStockesConformes();
  return [
    ouverture,
    buildReflexionV3(IDS_V3.reflexion),
    buildLeconV3(IDS_V3.lecon),
    buildExerciceV3(IDS_V3.exercice),
    buildCorrectionDeReponses(IDS_V3.exercice, IDS_V3.correction, {
      dureeMinutes: 4,
    }),
    buildMiniSituationV3(IDS_V3.miniSituation),
    buildCorrectionDeReponses(IDS_V3.miniSituation, IDS_V3.correctionFinale, {
      dureeMinutes: 3,
    }),
    cloture,
  ];
}

export function buildCoursV3(
  ecrans: readonly EcranDeCoursBrut[] = buildEcransV3Conformes(),
): Cours {
  return lireCoursStocke(buildCoursDeBriques(ecrans, { gabarit: 'v3' }));
}

export function buildEcransSansMiniSituation(): EcranDeCoursBrut[] {
  return buildEcransV3Conformes().filter(
    (ecran) =>
      ecran.screenId !== IDS_V3.miniSituation &&
      ecran.screenId !== IDS_V3.correctionFinale,
  );
}

export function buildCoursB3(
  ecrans: readonly EcranDeCoursBrut[] = buildEcransSansMiniSituation(),
): Cours {
  return lireCoursStocke(buildCoursDeBriques(ecrans, { gabarit: 'b3' }));
}
