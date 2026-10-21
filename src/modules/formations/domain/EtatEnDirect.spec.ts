import { buildCoursDuContenu } from '../../../../test/factories/contenus-de-cours.factory';
import { COURS_B2_01 } from '../../../../test/factories/contenus-publies';
import { buildCoursDeTest } from '../../../../test/factories/cours.factory';
import { buildSessionRecord } from '../../../../test/factories/formation.factory';
import {
  CAS_DES_COURS_SERVIS,
  ecransDesVotesJumeles,
  pilotageDUnCoursServi,
  questionsDuVoteJumele,
  VOTES_JUMELES,
} from '../../../../test/factories/votes-des-cours-servis.factory';
import type { PilotageEcran } from './contrats/pilotage';
import { assertCorrectionNonProjetee, rangDeLEcran } from './cours/EcranServi';
import { machineDuCours, sortiesDeLaMachine } from './cours/MachineServie';
import { assertPhaseOuverte } from './cours/PilotageEcrans';
import { etatEnDirect } from './EtatEnDirect';

describe('etatEnDirect', () => {
  it('projette la séance et son nombre de participants dans l état diffusé', () => {
    const majLe = new Date('2026-10-10T09:00:00Z');
    const seance = buildSessionRecord({
      etat: 'en_cours',
      modeRythme: 'libre',
      ecranCourant: 3,
      intervalleLibre: { premier: 1, dernier: 4 },
      pilotageEcrans: { 'E-1': { revele: true } },
      revision: 7,
      majLe,
    });

    expect(etatEnDirect(seance, 12, buildCoursDeTest())).toEqual({
      etat: 'en_cours',
      modeRythme: 'libre',
      ecranCourant: 3,
      intervalleLibre: { premier: 1, dernier: 4 },
      participants: 12,
      revision: 7,
      pilotage: { 'E-1': { revele: true } },
      majLe,
    });
  });

  describe('B-70 · vote jumelé : question affichée et question ouverte', () => {
    const vote = VOTES_JUMELES.find(
      ({ question }) => question.ouverture === 'principale',
    );
    if (vote === undefined) {
      throw new Error('aucun vote jumelé dans les cours servis');
    }
    const ecranId = vote.question.ecranId;
    const { principale, jumelle } = questionsDuVoteJumele(vote.cours, ecranId);
    const accepte = (
      pilotage: PilotageEcran,
      ouverture: 'principale' | 'jumelle',
    ): boolean => {
      try {
        assertPhaseOuverte({ [ecranId]: pilotage }, { ecranId, ouverture });
        return true;
      } catch {
        return false;
      }
    };

    it.each<[string, PilotageEcran, 'principale' | 'jumelle', string | null]>([
      ['au vote', {}, 'principale', principale],
      ['pendant la discussion', { phase: 'discussion' }, 'principale', null],
      ['au revote', { phase: 'revote' }, 'jumelle', jumelle],
      ['à la phase révélée', { phase: 'revele' }, 'jumelle', null],
      [
        'une fois la correction révélée',
        { phase: 'revele', revele: true },
        'jumelle',
        null,
      ],
      ['révélé dès le vote', { revele: true }, 'principale', null],
    ])(
      '%s, sert la question affichée et celle qui reçoit les réponses',
      (_cas, pilotage, affichee, ouverte) => {
        const servi = etatEnDirect(
          buildSessionRecord({
            ecranCourant: rangDeLEcran(vote.cours, ecranId),
            pilotageEcrans: { [ecranId]: pilotage },
          }),
          0,
          vote.cours,
        ).pilotage[ecranId];

        expect(servi.questionAffichee).toBe(
          affichee === 'principale' ? principale : jumelle,
        );
        expect(servi.questionOuverte).toBe(ouverte);
        expect([
          accepte(pilotage, 'principale'),
          accepte(pilotage, 'jumelle'),
        ]).toEqual([ouverte === principale, ouverte === jumelle]);
      },
    );
  });

  describe('F-37 · machine réglée au pupitre', () => {
    const MACHINE = 'B2-01-A3-02-MACHINE-COEFFICIENTS';
    const cours = buildCoursDuContenu(COURS_B2_01);
    const reglages = { tauxUn: 50, tauxDeux: -50 };
    const RANG = rangDeLEcran(cours, MACHINE);
    const diffuse = (ecranCourant: number, pilotage: PilotageEcran) =>
      etatEnDirect(
        buildSessionRecord({
          ecranCourant,
          pilotageEcrans: { [MACHINE]: pilotage },
        }),
        0,
        cours,
      ).pilotage[MACHINE];

    it('diffuse les sorties calculées par le back pour les réglages du pupitre', () => {
      const pilotage = diffuse(RANG, { reglages });
      const machine = machineDuCours(cours, MACHINE);
      if (machine === null) {
        throw new Error(`machine absente du B2-01 : ${MACHINE}`);
      }

      expect(pilotage).toEqual({
        reglages,
        sortiesProjetees: sortiesDeLaMachine(machine, reglages),
      });
      expect(pilotage.sortiesProjetees?.resultat.affichage).toBe('75');
    });

    it('ne diffuse aucune sortie tant que le pupitre n a rien réglé', () => {
      expect(diffuse(RANG, { revele: true })).toEqual({
        revele: true,
        correctionProjetee: true,
      });
    });

    it('D-05 · ne calcule aucune sortie tant que l écran de la machine n est pas servi', () => {
      expect(diffuse(RANG - 1, { reglages })).toEqual({ reglages });
    });
  });

  it.each(CAS_DES_COURS_SERVIS)(
    'QA-01 · %s : diffuse la phase « vote » de chaque vote jumelé encore non piloté',
    (_slug, cours) => {
      const { seance, attendu } = pilotageDUnCoursServi(cours);

      expect(
        etatEnDirect(buildSessionRecord(seance), 0, cours).pilotage,
      ).toEqual(attendu);
    },
  );

  it.each(CAS_DES_COURS_SERVIS)(
    '%s : sert la correction projetée là, et seulement là, où la route des productions refuse d écrire',
    (_slug, cours) => {
      const seances = [
        {
          ecranCourant: cours.ecrans.length - 1,
          modeRythme: 'pilote' as const,
        },
        ...cours.ecrans.flatMap(({ id }) => [
          { pilotageEcrans: { [id]: { revele: true } } },
          { pilotageEcrans: { [id]: { etayageAtteint: 1 } } },
        ]),
      ].map((champs) =>
        buildSessionRecord({
          ecranCourant: cours.ecrans.length - 1,
          ...champs,
        }),
      );
      const ecarts = seances.flatMap((seance) =>
        cours.ecrans.flatMap(({ id }) => {
          const refusee = (() => {
            try {
              assertCorrectionNonProjetee(seance, cours, id);
              return false;
            } catch {
              return true;
            }
          })();
          const servie =
            etatEnDirect(seance, 0, cours).pilotage[id]?.correctionProjetee ===
            true;
          return refusee === servie ? [] : [`${id} : ${String(refusee)}`];
        }),
      );

      expect(ecarts).toEqual([]);
    },
  );

  it.each(
    CAS_DES_COURS_SERVIS.flatMap(([slug, cours]) =>
      ecransDesVotesJumeles(cours).map(
        (ecranId) => [slug, ecranId, cours] as const,
      ),
    ),
  )(
    'D-05 · %s, %s : ne diffuse ni phase ni question d un vote jumelé avant que son écran soit servi',
    (_slug, ecranId, cours) => {
      const rang = rangDeLEcran(cours, ecranId);
      const diffuse = (ecranCourant: number) =>
        etatEnDirect(buildSessionRecord({ ecranCourant }), 0, cours).pilotage[
          ecranId
        ];

      expect([diffuse(rang - 1), diffuse(rang).questionOuverte]).toEqual([
        undefined,
        questionsDuVoteJumele(cours, ecranId).principale,
      ]);
    },
  );
});
