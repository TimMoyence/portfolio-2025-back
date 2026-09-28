import {
  buildCorrectionDeReponses,
  buildEcranDeBrique,
} from '../../../../../test/factories/ecrans-stockes.factory';
import {
  buildCoursV3,
  buildEcransV3Conformes,
  buildExerciceV3,
  buildLeconV3,
  buildReflexionV3,
  IDS_V3,
  notesDExercice,
} from '../../../../../test/factories/gabarit-v3.factory';
import { buildCoursConforme } from '../../../../../test/factories/structure.factory';
import type { EcranDeCoursBrut } from './CoursStocke';
import { verifierStructure } from './StructureCours';

const REGLES_DU_GABARIT = [
  'gabarit-budget',
  'gabarit-cycle',
  'gabarit-temps-exercice',
  'gabarit-mini-situation',
];

function violationsDuGabarit(ecrans: readonly EcranDeCoursBrut[]) {
  return verifierStructure(buildCoursV3(ecrans))
    .filter((violation) => REGLES_DU_GABARIT.includes(violation.regle))
    .map(({ regle, ecran }) => ({ regle, ecran }));
}

function remplacer(
  id: string,
  remplacant: (ecran: EcranDeCoursBrut) => EcranDeCoursBrut | null,
): EcranDeCoursBrut[] {
  return buildEcransV3Conformes().flatMap((ecran) => {
    if (ecran.screenId !== id) {
      return [ecran];
    }
    const nouveau = remplacant(ecran);
    return nouveau === null ? [] : [nouveau];
  });
}

describe('verifierStructure — gabarit v3', () => {
  it('accepte un cours v3 conforme, sans dérogation', () => {
    expect(verifierStructure(buildCoursV3())).toEqual([]);
  });

  it('n applique pas le gabarit v3 à un cours qui ne le déclare pas', () => {
    const sansLecon = buildCoursConforme();

    expect(verifierStructure(sansLecon)).toEqual([]);
    expect(sansLecon.gabarit).toBeUndefined();
  });

  describe('budget', () => {
    it('refuse plus de quarante écrans', () => {
      const ecrans = buildEcransV3Conformes();
      const lectures = Array.from({ length: 33 }, (_, rang) =>
        buildEcranDeBrique('fp-quote', {
          screenId: `B2-02-A2-${String(rang + 10).padStart(2, '0')}-LECTURE`,
          dureeMinutes: 1,
          diffusion: 'catalogue',
        }),
      );
      const trop = [...ecrans.slice(0, -1), ...lectures, ...ecrans.slice(-1)];

      expect(trop).toHaveLength(41);
      expect(violationsDuGabarit(trop)).toContainEqual({
        regle: 'gabarit-budget',
        ecran: null,
      });
    });

    it('refuse plus de cent quatre-vingts minutes de travail', () => {
      const long = remplacer(IDS_V3.lecon, (lecon) => ({
        ...lecon,
        dureeMinutes: 160,
      }));

      expect(violationsDuGabarit(long)).toContainEqual({
        regle: 'gabarit-budget',
        ecran: null,
      });
    });
  });

  describe('cycle réfléchir → comprendre → s exercer', () => {
    it('refuse une trace écrite sans temps de réflexion depuis le dernier exercice', () => {
      const sansReflexion = remplacer(IDS_V3.reflexion, () => null);

      expect(violationsDuGabarit(sansReflexion)).toEqual([
        { regle: 'gabarit-cycle', ecran: IDS_V3.lecon },
      ]);
    });

    it('refuse une trace écrite qu aucun exercice ne suit', () => {
      const ecrans = buildEcransV3Conformes();
      const tardive = buildLeconV3('B2-02-A4-03-LECON-TARDIVE');
      const avecLeconFinale = [
        ...ecrans.slice(0, -1),
        buildReflexionV3('B2-02-A4-02-REFLEXION'),
        tardive,
        ...ecrans.slice(-1),
      ];

      expect(violationsDuGabarit(avecLeconFinale)).toContainEqual({
        regle: 'gabarit-cycle',
        ecran: tardive.screenId,
      });
    });

    it('refuse un cours v3 sans trace écrite', () => {
      const sansLecon = remplacer(IDS_V3.lecon, () => null);

      expect(violationsDuGabarit(sansLecon)).toEqual([
        { regle: 'gabarit-cycle', ecran: null },
      ]);
    });

    it('accepte deux traces écrites d affilée après une même réflexion', () => {
      const deuxLecons = buildEcransV3Conformes().flatMap((ecran) =>
        ecran.screenId === IDS_V3.lecon
          ? [ecran, buildLeconV3('B2-02-A1-03-LECON-SUITE')]
          : [ecran],
      );

      expect(violationsDuGabarit(deuxLecons)).toEqual([]);
    });
  });

  describe('trois temps de chaque exercice', () => {
    it('refuse un exercice sans temps de réflexion et de travail annoncés', () => {
      const muet = remplacer(IDS_V3.exercice, (exercice) => ({
        ...exercice,
        notes: '• Relancer les binômes bloqués.',
      }));

      expect(violationsDuGabarit(muet)).toEqual([
        { regle: 'gabarit-temps-exercice', ecran: IDS_V3.exercice },
      ]);
    });

    it('refuse des temps annoncés qui ne font pas la durée de l écran', () => {
      const faux = remplacer(IDS_V3.exercice, (exercice) => ({
        ...exercice,
        notes: notesDExercice(3, 6),
      }));

      expect(violationsDuGabarit(faux)).toEqual([
        { regle: 'gabarit-temps-exercice', ecran: IDS_V3.exercice },
      ]);
    });

    it('refuse un exercice sans écran de correction', () => {
      const ecrans = remplacer(IDS_V3.correction, () => null);
      const sansCorrection = ecrans.map((ecran) =>
        ecran.screenId === IDS_V3.exercice
          ? { ...ecran, dureeMinutes: 12, notes: notesDExercice(2, 10) }
          : ecran,
      );

      expect(violationsDuGabarit(sansCorrection)).toEqual([
        { regle: 'gabarit-temps-exercice', ecran: IDS_V3.exercice },
      ]);
    });
  });

  describe('mini-situation CCF', () => {
    it('refuse un cours v3 sans mini-situation', () => {
      const sans = buildEcransV3Conformes().filter(
        (ecran) =>
          ecran.screenId !== IDS_V3.miniSituation &&
          ecran.screenId !== IDS_V3.correctionFinale,
      );

      expect(violationsDuGabarit(sans)).toEqual([
        { regle: 'gabarit-mini-situation', ecran: null },
      ]);
    });

    it('refuse une trace écrite après la mini-situation', () => {
      const ecrans = buildEcransV3Conformes();
      const apres = buildLeconV3('B2-02-A4-03-LECON');
      const cours = [
        ...ecrans.slice(0, -1),
        buildReflexionV3('B2-02-A4-03-REFLEXION'),
        apres,
        buildExerciceV3('B2-02-A4-04-EXERCICE'),
        buildCorrectionDeReponses(
          'B2-02-A4-04-EXERCICE',
          'B2-02-A4-05-CORRECTION',
          { dureeMinutes: 4 },
        ),
        ...ecrans.slice(-1),
      ];

      expect(violationsDuGabarit(cours)).toEqual([
        { regle: 'gabarit-mini-situation', ecran: apres.screenId },
      ]);
    });
  });
});
