import { buildCoursDuContenu } from '../../../../test/factories/contenus-de-cours.factory';
import { COURS_B2_01 } from '../../../../test/factories/contenus-publies';
import { buildCoursDeTest } from '../../../../test/factories/cours.factory';
import { buildSessionRecord } from '../../../../test/factories/formation.factory';
import {
  CAS_DES_COURS_SERVIS,
  pilotageDUnCoursServi,
  questionsDuVoteJumele,
  VOTES_JUMELES,
} from '../../../../test/factories/votes-des-cours-servis.factory';
import type { PilotageEcran } from './contrats/pilotage';
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
      ['à la phase révélée', { phase: 'revele' }, 'jumelle', jumelle],
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
          buildSessionRecord({ pilotageEcrans: { [ecranId]: pilotage } }),
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

    it('diffuse les sorties calculées par le back pour les réglages du pupitre', () => {
      const pilotage = etatEnDirect(
        buildSessionRecord({ pilotageEcrans: { [MACHINE]: { reglages } } }),
        0,
        cours,
      ).pilotage[MACHINE];
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
      expect(
        etatEnDirect(
          buildSessionRecord({
            pilotageEcrans: { [MACHINE]: { revele: true } },
          }),
          0,
          cours,
        ).pilotage[MACHINE],
      ).toEqual({ revele: true });
    });
  });

  it.each(CAS_DES_COURS_SERVIS)(
    'QA-01 · %s : diffuse la phase « vote » de chaque vote jumelé encore non piloté',
    (_slug, cours) => {
      const { pilotageEcrans, attendu } = pilotageDUnCoursServi(cours);

      expect(
        etatEnDirect(buildSessionRecord({ pilotageEcrans }), 0, cours).pilotage,
      ).toEqual(attendu);
    },
  );
});
